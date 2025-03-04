
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OTPVerification from "./pages/OTPVerification";
import PasswordReset from "./pages/PasswordReset";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<boolean | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);

  useEffect(() => {
    // Check if OTP verification status exists in local storage
    const otpVerificationStatus = localStorage.getItem("otpVerified") === "true";
    setIsOtpVerified(otpVerificationStatus);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      
      // If session exists but OTP is not verified, clear session data
      if (session && !otpVerificationStatus) {
        localStorage.removeItem("otpVerified");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(!!session);
      
      // If user logs out, reset OTP verification status
      if (!session) {
        localStorage.removeItem("otpVerified");
        setIsOtpVerified(false);
        // Clear query cache when user logs out
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/passwords"
              element={
                session === null ? null : (session && isOtpVerified) ? (
                  <Index />
                ) : session ? (
                  <Navigate to="/verify-otp" replace />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/auth"
              element={
                session === null ? null : !session ? (
                  <Auth />
                ) : isOtpVerified ? (
                  <Navigate to="/passwords" replace />
                ) : (
                  <Navigate to="/verify-otp" replace />
                )
              }
            />
            <Route 
              path="/verify-otp" 
              element={
                session === null ? null : session ? (
                  <OTPVerification setIsOtpVerified={setIsOtpVerified} />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
