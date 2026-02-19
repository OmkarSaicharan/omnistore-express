import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, otp: submittedOtp } = await req.json();

    const AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY');
    const TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID');

    if (!AUTH_KEY) {
      throw new Error('MSG91_AUTH_KEY is not configured');
    }

    const mobileNumber = `91${phone.replace(/\D/g, '')}`;

    if (action === 'send') {
      // Send OTP via MSG91
      const url = `https://control.msg91.com/api/v5/otp?template_id=${TEMPLATE_ID}&mobile=${mobileNumber}&authkey=${AUTH_KEY}&otp_length=6&otp_expiry=10`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('MSG91 send response:', data);

      if (!response.ok || data.type === 'error') {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify') {
      // Verify OTP via MSG91
      const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobileNumber}&otp=${submittedOtp}&authkey=${AUTH_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('MSG91 verify response:', data);

      if (data.type === 'success') {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, message: data.message || 'Invalid OTP' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } else if (action === 'resend') {
      // Resend OTP via MSG91
      const url = `https://control.msg91.com/api/v5/otp/retry?mobile=${mobileNumber}&authkey=${AUTH_KEY}&retrytype=text`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('MSG91 resend response:', data);

      return new Response(JSON.stringify({ success: true, message: 'OTP resent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('OTP error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
