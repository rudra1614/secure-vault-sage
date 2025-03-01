
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, QrCode } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // TOTP states
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrCode, setTotpQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showTotpVerification, setShowTotpVerification] = useState(false);
  const [factorId, setFactorId] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) throw error;

        // Check if user has MFA enabled
        const { data: { mfa_factors } } = await supabase.auth.mfa.listFactors();
        
        if (mfa_factors && mfa_factors.length > 0) {
          // User has TOTP setup, show verification screen
          const totpFactor = mfa_factors.find(factor => factor.factor_type === 'totp');
          if (totpFactor) {
            setFactorId(totpFactor.id);
            setShowTotpVerification(true);
            toast({
              title: "Verification required",
              description: "Please enter the verification code from your authenticator app",
            });
          } else {
            // Complete login if no TOTP setup
            navigate("/passwords");
            toast({
              title: "Success",
              description: "Logged in successfully",
            });
          }
        } else {
          // No MFA, setup TOTP
          const { data: totpData, error: totpError } = await supabase.auth.mfa.enroll({
            factorType: 'totp'
          });
          
          if (totpError) throw totpError;

          if (totpData && totpData.totp) {
            setTotpSecret(totpData.totp.secret);
            setTotpQrCode(totpData.totp.qr_code);
            setFactorId(totpData.id);
            setShowTotpSetup(true);
            toast({
              title: "Security setup",
              description: "Please scan the QR code with your authenticator app",
            });
          }
        }
      } else {
        // Sign up with email and password
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

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (showTotpSetup) {
        // Verify and activate the TOTP factor
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: verificationCode
        });

        if (error) throw error;

        setShowTotpSetup(false);
        navigate("/passwords");
        toast({
          title: "Success",
          description: "Two-factor authentication setup successful",
        });
      } else if (showTotpVerification) {
        // Verify the TOTP code for login
        const { error } = await supabase.auth.mfa.verify({
          factorId,
          code: verificationCode,
          challengeId: "" // Will be auto-detected by Supabase client
        });

        if (error) throw error;

        setShowTotpVerification(false);
        navigate("/passwords");
        toast({
          title: "Success",
          description: "Logged in successfully",
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

  // Cancel TOTP setup and go back to login
  const handleCancelTotp = () => {
    setShowTotpSetup(false);
    setShowTotpVerification(false);
    setVerificationCode("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {showTotpSetup 
              ? "Set Up Two-Factor Authentication" 
              : showTotpVerification 
                ? "Verify Two-Factor Authentication" 
                : isLogin ? "Login" : "Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(showTotpSetup || showTotpVerification) ? (
            <form onSubmit={handleVerifyTotp} className="space-y-4">
              {showTotpSetup && (
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-2 rounded">
                      <img 
                        src={totpQrCode} 
                        alt="QR Code for authenticator app" 
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  <div className="text-center text-sm">
                    <p className="mb-2">Scan this QR code with your authenticator app.</p>
                    <p className="font-medium">Manual entry code:</p>
                    <p className="font-mono bg-gray-100 p-2 rounded">{totpSecret}</p>
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="verificationCode">
                  {showTotpSetup ? "Verification Code" : "Enter the 6-digit code from your authenticator app"}
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="123456"
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={handleCancelTotp}>
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" disabled={isLoading || verificationCode.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          ) : (
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
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
              </Button>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
