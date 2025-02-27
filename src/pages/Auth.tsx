
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [authStep, setAuthStep] = useState<"credentials" | "totp-setup" | "totp-verify">("credentials");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const handleCredentialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email, 
          password
        });

        if (error) throw error;

        // Check if user has TOTP set up
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors.totp.find(factor => factor.status === "verified");
        
        if (totpFactor) {
          // User has TOTP set up, challenge them to enter the code
          setFactorId(totpFactor.id);
          const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: totpFactor.id,
          });
          
          if (challengeError) throw challengeError;
          
          setChallengeId(challenge.id);
          setAuthStep("totp-verify");
        } else {
          // No TOTP set up yet, proceed with login and TOTP setup
          if (isLogin) {
            await enrollTotp();
          } else {
            toast({
              title: "Success",
              description: "Account created successfully. Please verify your email.",
            });
          }
        }
      } else {
        // Sign up flow
        const { error } = await supabase.auth.signUp({ 
          email, 
          password 
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Account created successfully. Please verify your email.",
        });
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

  const enrollTotp = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      
      if (error) throw error;
      
      setTotpSecret(data.totp.secret);
      setTotpUri(data.totp.uri);
      setFactorId(data.id);
      setAuthStep("totp-setup");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verifyTotpSetup = async () => {
    setIsLoading(true);
    try {
      if (!factorId) throw new Error("Factor ID not found");
      
      // For initial setup, we need to challenge first
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });
      
      if (challengeError) throw challengeError;
      
      // Then verify with the challenge ID
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challenge.id,
        code: totpCode,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "TOTP setup complete. You can now log in securely.",
      });
      
      navigate("/passwords");
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

  const verifyTotpLogin = async () => {
    setIsLoading(true);
    try {
      if (!factorId || !challengeId) throw new Error("Authentication challenge not found");
      
      const { error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: totpCode,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate("/passwords");
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

  // Render TOTP setup screen
  if (authStep === "totp-setup" && totpUri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-sm text-center">
                Scan this QR code with your authenticator app (like Google Authenticator, Authy, or 1Password)
              </p>
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
              <Label htmlFor="totp-code">Enter the 6-digit code from your app</Label>
              <Input
                id="totp-code"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={verifyTotpSetup}
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify and Complete Setup"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render TOTP verification screen during login
  if (authStep === "totp-verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center">
              Enter the 6-digit code from your authenticator app
            </p>
            <div className="space-y-2">
              <Label htmlFor="totp-code">Authentication Code</Label>
              <Input
                id="totp-code"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={verifyTotpLogin}
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render main login/signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-black-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCredentialAuth} className="space-y-4">
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
