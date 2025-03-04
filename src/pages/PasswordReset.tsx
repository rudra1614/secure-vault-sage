
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowRight, ShieldCheck, RefreshCw, HelpCircle } from "lucide-react";

const PasswordReset = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isRequestSent, setIsRequestSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setIsRequestSent(true);
      
      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3 inline-flex">
              {isRequestSent ? (
                <RefreshCw className="h-8 w-8 text-primary animate-spin-slow" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground mt-2">
            {isRequestSent 
              ? "Reset link sent! Check your email" 
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        <Card className="border-border/50 shadow-xl animate-scale-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">
              {isRequestSent ? "Email Sent" : "Forgot Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isRequestSent ? (
              <div className="text-center space-y-4">
                <div className="rounded-full bg-green-100 p-3 inline-flex mx-auto">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to: <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <div className="rounded-full bg-amber-100 p-3 inline-flex mx-auto mt-4">
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Don't see the email? Check your spam folder or request another reset link.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full transition-all hover:shadow-md flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <div className="relative my-2 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Remember your password?
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default PasswordReset;
