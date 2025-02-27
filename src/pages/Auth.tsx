import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [totpSetup, setTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState(null);

  // Function to handle sign-in
  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    
    if (data.session?.user?.mfa_enabled) {
      setTotpSetup(true);
    } else {
      navigate("/dashboard");
    }
  };

  // Function to enable TOTP
  const enableTOTP = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    setTotpSecret(data.totp.secret);
  };

  // Function to verify OTP
  const verifyTOTP = async () => {
    const { error } = await supabase.auth.mfa.verify({ factorId: "totp", code: otp });
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    navigate("/dashboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        {!totpSetup ? (
          <>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={handleSignIn}>Sign In</Button>
          </>
        ) : (
          <>
            <Label>Enter OTP</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button onClick={verifyTOTP}>Verify OTP</Button>
          </>
        )}
        {totpSecret && (
          <>
            <p>Scan this QR code in your authenticator app:</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${totpSecret}`} alt="TOTP QR Code" />
          </>
        )}
        <Button onClick={enableTOTP}>Enable TOTP</Button>
      </CardContent>
    </Card>
  );
};

export default Auth;
