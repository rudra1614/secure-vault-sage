
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // TOTP related states
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [setupStep, setSetupStep] = useState<"auth" | "setup" | "verify">("auth");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Check if user has TOTP enabled
  const checkTotpStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      console.log("MFA factors:", data);
      
      const hasVerifiedTotp = data.totp.some(factor => factor.status === 'verified');
      
      if (hasVerifiedTotp) {
        // User already has TOTP setup, proceed to verification
        const factor = data.totp.find(f => f.status === 'verified');
        if (factor) {
          setFactorId(factor.id);
          console.log("Challenging factor ID:", factor.id);
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: factor.id
          });
          
          if (challengeError) throw challengeError;
          
          console.log("Challenge created:", challengeData);
          setChallengeId(challengeData.id);
          setSetupStep("verify");
        }
      } else {
        // Setup TOTP for user
        console.log("No verified TOTP factor found, enrolling new one");
        await setupTotp();
      }
    } catch (error: any) {
      console.error("Error checking TOTP status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Setup TOTP for user
  const setupTotp = async () => {
    try {
      console.log("Setting up TOTP...");
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) throw error;
      
      console.log("TOTP enrollment successful:", data);
      setTotpSecret(data.totp.secret);
      setTotpUri(data.totp.uri);
      setFactorId(data.id);
      setSetupStep("setup");
    } catch (error: any) {
      console.error("TOTP setup error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Verify TOTP code during setup
  const verifyTotpSetup = async () => {
    setIsLoading(true);
    try {
      if (!factorId) throw new Error("Factor ID not found");
      
      console.log("Verifying TOTP setup with factor ID:", factorId);
      
      // For initial setup, we need to challenge first
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });
      
      if (challengeError) throw challengeError;
      
      console.log("Challenge created for verification:", challengeData);
      
      // Then verify with the challenge ID
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: totpCode
      });
      
      if (error) throw error;
      
      console.log("TOTP verification successful:", data);
      
      toast({
        title: "Success",
        description: "TOTP setup complete. You can now log in with your authenticator app.",
      });
      
      navigate("/passwords");
    } catch (error: any) {
      console.error("TOTP verification error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify TOTP code during login
  const verifyTotpLogin = async () => {
    setIsLoading(true);
    try {
      if (!factorId || !challengeId) throw new Error("Authentication challenge not found");
      
      console.log("Verifying TOTP login with factor ID:", factorId, "and challenge ID:", challengeId);
      
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: totpCode
      });
      
      if (error) throw error;
      
      console.log("TOTP login verification successful:", data);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate("/passwords");
    } catch (error: any) {
      console.error("TOTP login verification error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login flow
        console.log("Attempting login with email:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        console.log("Login successful, user:", data.user);
        
        // After successful password auth, check TOTP status
        await checkTotpStatus(data.user.id);
      } else {
        // Sign up flow
        console.log("Attempting signup with email:", email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        console.log("Signup response:", data);
        
        if (data.session) {
          // If session exists, user is already confirmed, setup TOTP
          console.log("User already confirmed, setting up TOTP");
          await checkTotpStatus(data.user.id);
        } else {
          // User needs to confirm email
          console.log("User needs to confirm email");
          toast({
            title: "Success",
            description: "Account created successfully. Please check your email for verification.",
          });
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (setupStep === "setup" && totpUri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-4 rounded-md">
                <img
                  src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(totpUri)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Or enter this code manually:</p>
                <code className="bg-muted p-2 rounded text-xs">{totpSecret}</code>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={verifyTotpSetup}
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify and Complete Setup"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (setupStep === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the verification code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={verifyTotpLogin}
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </Button>
            <div className="flex items-center justify-center gap-2 mt-2">
              <ShieldCheck size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Secured with two-factor authentication</span>
            </div>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
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
