

## Plan: Remove OTP, Fix Routing, Complete All Pending Features

### 1. Remove OTP & PhoneGuard — Direct Access
- **`src/App.tsx`**: Remove `PhoneGuard` component entirely. Change `/` route to render `StoreSearch` directly. Remove `PhoneLanding` import. Remove `/stores` route (or redirect it to `/`).
- **`src/pages/PhoneLanding.tsx`**: Delete this file (no longer needed).
- **`supabase/functions/send-otp/index.ts`**: Delete this edge function.

### 2. Store Search — Add "Register Your Store"
- **`src/pages/StoreSearch.tsx`**: Add a "Register Your Store" button that opens a dialog form. Fields: store name, tagline, category, location, admin name, email, password, admin secret key (auto-generated). On submit, save store to `localStorage` key `omnistore-custom-stores`. Merge custom stores with the hardcoded OmniStore list for display. Remove the logout button (no phone session to log out of).

### 3. Profile — Logout + Admin Features
- **`src/pages/Profile.tsx`**: 
  - Add a **Logout** button (calls `logout()` from AuthContext, navigates to `/`).
  - If user is admin, show their **admin secret key** (from localStorage store data) and a **"Change Store Name"** inline editor.

### 4. Index (Store Home) — Back Navigation
- **`src/pages/Index.tsx`**: Add a back arrow button in the top area that navigates to `/` (store search).

### 5. StoreSearch Logout
- Update the logout button in `StoreSearch.tsx` to clear auth session instead of phone verification flag.

### Files Changed

| File | Action |
|------|--------|
| `src/App.tsx` | Remove PhoneGuard, PhoneLanding; make `/` → StoreSearch |
| `src/pages/PhoneLanding.tsx` | Delete |
| `supabase/functions/send-otp/index.ts` | Delete |
| `src/pages/StoreSearch.tsx` | Add register store dialog, update logout |
| `src/pages/Profile.tsx` | Add logout button, admin secret key, store name edit |
| `src/pages/Index.tsx` | Add back button to store search |

