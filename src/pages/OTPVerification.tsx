
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Extract the email from the state passed during navigation
    const state = location.state as { email?: string };
    if (!state || !state.email) {
      // If no email is provided, redirect back to auth page
      toast({
        title: "Error",
        description: "Missing email information. Please log in again.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setEmail(state.email);
  }, [location, navigate, toast]);

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify the OTP that was sent to the user's email
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;

      // Only navigate to passwords page after successful OTP verification
      navigate("/passwords");
      toast({
        title: "Success",
        description: "Email verified successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                placeholder="Enter code from your email"
              />
            </div>
            <p className="text-sm text-gray-500">
              We've sent a verification code to your email ({email}). 
              Please enter it to continue.
            </p>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Verify
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
