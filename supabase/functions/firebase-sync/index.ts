// Firebase Firestore sync edge function
// Receives row changes from Postgres triggers (or manual backfill) and writes to Firestore via REST API.
// Auth: signs a JWT with the service account, exchanges it for an OAuth2 access token, caches token in memory.

import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedSA: ServiceAccount | null = null;
let cachedKey: CryptoKey | null = null;

function getServiceAccount(): ServiceAccount {
  if (cachedSA) return cachedSA;
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not configured");
  cachedSA = JSON.parse(raw) as ServiceAccount;
  return cachedSA;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const sa = getServiceAccount();
  cachedKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const sa = getServiceAccount();
  const key = await getCryptoKey();

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      exp: getNumericDate(3600),
      iat: getNumericDate(0),
    },
    key,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed [${res.status}]: ${await res.text()}`);
  }
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
  return cachedToken.token;
}

// Convert a JS value to a Firestore REST "Value" object
function toFirestoreValue(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") {
    // Detect ISO timestamps
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      return { timestampValue: v };
    }
    return { stringValue: v };
  }
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === "object") {
    return { mapValue: { fields: toFirestoreFields(v as Record<string, unknown>) } };
  }
  return { stringValue: String(v) };
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(obj)) {
    out[k] = toFirestoreValue(val);
  }
  return out;
}

async function upsertDoc(collection: string, docId: string, data: Record<string, unknown>) {
  const sa = getServiceAccount();
  const token = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    throw new Error(`Firestore upsert failed [${res.status}]: ${await res.text()}`);
  }
  return await res.json();
}

async function deleteDoc(collection: string, docId: string) {
  const sa = getServiceAccount();
  const token = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Firestore delete failed [${res.status}]: ${await res.text()}`);
  }
}

interface SyncPayload {
  table: string;
  op: "INSERT" | "UPDATE" | "DELETE";
  id: string;
  row?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as SyncPayload | { backfill: true };

    // Backfill mode: dump all tables to Firestore
    if ("backfill" in body && body.backfill) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.4");
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const tables = ["stores", "store_categories", "products", "profiles", "orders", "credit_requests", "user_roles", "store_requests"];
      const summary: Record<string, number> = {};
      for (const t of tables) {
        const { data, error } = await admin.from(t).select("*");
        if (error) { summary[t] = -1; continue; }
        let n = 0;
        for (const row of data || []) {
          const id = String((row as Record<string, unknown>).id);
          await upsertDoc(t, id, row as Record<string, unknown>);
          n++;
        }
        summary[t] = n;
      }
      return new Response(JSON.stringify({ success: true, summary }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = body as SyncPayload;
    if (!payload.table || !payload.op || !payload.id) {
      return new Response(JSON.stringify({ error: "Missing table/op/id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.op === "DELETE") {
      await deleteDoc(payload.table, payload.id);
    } else {
      if (!payload.row) {
        return new Response(JSON.stringify({ error: "Missing row data" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await upsertDoc(payload.table, payload.id, payload.row);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    console.error("firebase-sync error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
