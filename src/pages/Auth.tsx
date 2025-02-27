
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [setupStep, setSetupStep] = useState<"initial" | "setup" | "verify">("initial");
  const [isTotpEnabled, setIsTotpEnabled] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  // Check if user is already logged in and has TOTP enabled
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSession(data.session);
        
        // Check if TOTP is already enabled for this user
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasTOTP = factors.totp.some(factor => factor.status === 'verified');
        setIsTotpEnabled(hasTOTP);
        
        if (hasTOTP) {
          navigate("/passwords");
        }
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Signup successful! Please check your email for verification.");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasTOTP = factors.totp.some(factor => factor.status === 'verified');
      
      if (hasTOTP) {
        // If TOTP is already set up, challenge it
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factors.totp[0].id });
        if (challengeError) throw challengeError;
        
        setSetupStep("verify");
      } else {
        // If TOTP is not set up, enter setup flow
        setSetupStep("setup");
        await setupTOTP();
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const setupTOTP = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      
      if (error) throw error;
      
      setTotpSecret(data.totp.secret);
      setTotpUri(data.totp.uri);
    } catch (error: any) {
      toast.error(error.message || "Failed to set up TOTP");
      setSetupStep("initial");
    }
  };

  const verifyTOTP = async () => {
    setIsLoading(true);
    try {
      // For initial setup
      if (setupStep === "setup" && totpSecret) {
        const { data, error } = await supabase.auth.mfa.challenge({
          factorId: (await supabase.auth.mfa.listFactors()).data.totp[0].id,
        });
        
        if (error) throw error;
        
        const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
          factorId: (await supabase.auth.mfa.listFactors()).data.totp[0].id,
          code: verificationCode,
          challengeId: data.id,
        });
        
        if (verifyError) throw verifyError;
        
        toast.success("TOTP setup successful!");
        setIsTotpEnabled(true);
        navigate("/passwords");
      } 
      // For subsequent logins
      else if (setupStep === "verify") {
        const factors = (await supabase.auth.mfa.listFactors()).data.totp;
        if (factors.length === 0) throw new Error("No TOTP factors found");
        
        const { data: challenge } = await supabase.auth.mfa.challenge({
          factorId: factors[0].id,
        });
        
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: factors[0].id,
          code: verificationCode,
          challengeId: challenge.id,
        });
        
        if (error) throw error;
        
        toast.success("Authentication successful!");
        navigate("/passwords");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (setupStep === "setup" && totpUri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-white p-4 rounded-md">
                <img
                  src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(totpUri)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Or enter the code manually:
                </p>
                <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
                  {totpSecret}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Enter the 6-digit code from your app</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                placeholder="000000"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={verifyTOTP} 
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify & Complete Setup"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (setupStep === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">6-digit Code</Label>
              <Input
                id="totp-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                placeholder="000000"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={verifyTOTP} 
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Secure access with Two-Factor Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
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
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"} <LogIn className="ml-2" size={18} />
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
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
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"} <UserPlus className="ml-2" size={18} />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Separator className="my-4" />
            <div className="flex items-center justify-center gap-2">
              <KeyRound size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Protected with TOTP 2FA</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
