import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStoresTool from "./tools/list-stores";
import listProductsTool from "./tools/list-products";
import listMyOrdersTool from "./tools/list-my-orders";
import getMyProfileTool from "./tools/get-my-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "omnistore-mcp",
  title: "OmniStore MCP",
  version: "0.1.0",
  instructions:
    "Tools for the OmniStore multi-tenant platform. Use `list_stores` to browse stores, `list_products` for products, `list_my_orders` to see the signed-in customer's orders, and `get_my_profile` for the current account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listStoresTool, listProductsTool, listMyOrdersTool, getMyProfileTool],
});
