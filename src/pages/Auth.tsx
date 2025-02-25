
import { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [tempSession, setTempSession] = useState<string | null>(null);

  const sendVerificationCode = async (userPhoneNumber?: string) => {
    setIsLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user's stored phone number if not provided
      if (!userPhoneNumber) {
        const { data: userData, error: userError } = await supabase
          .from('user_phone_numbers')
          .select('phone_number')
          .eq('user_id', session.user.id)
          .single();

        if (userError) throw userError;
        if (!userData?.phone_number) throw new Error("No phone number found for this account");
        userPhoneNumber = userData.phone_number;
      }

      setTempSession(session.access_token);

      const response = await fetch(
        'https://obkezbshzvtqmvgbxsth.supabase.co/functions/v1/twilio-verify',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send',
            phoneNumber: userPhoneNumber,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setCodeSent(true);
      toast({
        title: "Code Sent",
        description: "Please check your phone for the verification code.",
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

  const verifyCode = async () => {
    setIsVerifying(true);
    try {
      if (!tempSession) throw new Error("Session not found");

      const response = await fetch(
        'https://obkezbshzvtqmvgbxsth.supabase.co/functions/v1/twilio-verify',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tempSession}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'verify',
            phoneNumber: phoneNumber,
            code: verificationCode,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.valid) {
        toast({
          title: "Success",
          description: "Phone number verified successfully!",
        });
        navigate("/passwords");
      } else {
        throw new Error("Invalid verification code");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!isLogin) {
        // Sign up flow
        const { data: { session }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!session) throw new Error("No session after signup");

        // Store phone number
        const { error: phoneError } = await supabase
          .from('user_phone_numbers')
          .insert([{ 
            user_id: session.user.id,
            phone_number: phoneNumber 
          }]);

        if (phoneError) throw phoneError;

        toast({
          title: "Success",
          description: "Account created successfully. Please check your email for verification.",
        });
      } else {
        // Login flow
        await sendVerificationCode();
      }
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>
            )}
            {codeSent && (
              <div className="grid gap-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter code"
                />
                <Button
                  type="button"
                  onClick={verifyCode}
                  disabled={isVerifying}
                  className="mt-2"
                >
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || codeSent}>
              {isLoading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setCodeSent(false);
                setVerificationCode("");
              }}
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
