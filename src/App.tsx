import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { CartProvider } from "@/contexts/CartContext";
import PhoneLanding from "./pages/PhoneLanding";
import StoreSearch from "./pages/StoreSearch";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import CategoriesPage from "./pages/CategoriesPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Guard: redirect to "/" if phone not verified
function PhoneGuard({ children }: { children: React.ReactNode }) {
  const verified = localStorage.getItem('omnistore-phone-verified') === 'true';
  if (!verified) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Phone OTP landing */}
                  <Route path="/" element={<PhoneLanding />} />

                  {/* Store search (after phone verification) */}
                  <Route path="/stores" element={
                    <PhoneGuard><StoreSearch /></PhoneGuard>
                  } />

                  {/* Store pages (after phone verification) */}
                  <Route path="/home" element={<PhoneGuard><Index /></PhoneGuard>} />
                  <Route path="/shop" element={<PhoneGuard><Shop /></PhoneGuard>} />
                  <Route path="/categories" element={<PhoneGuard><CategoriesPage /></PhoneGuard>} />
                  <Route path="/about" element={<PhoneGuard><About /></PhoneGuard>} />
                  <Route path="/contact" element={<PhoneGuard><Contact /></PhoneGuard>} />
                  <Route path="/login" element={<PhoneGuard><Login /></PhoneGuard>} />
                  <Route path="/register" element={<PhoneGuard><Register /></PhoneGuard>} />
                  <Route path="/profile" element={<PhoneGuard><Profile /></PhoneGuard>} />
                  <Route path="/admin" element={<PhoneGuard><Admin /></PhoneGuard>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
