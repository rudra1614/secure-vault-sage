
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);

  // Check if user is in recovery mode
  useEffect(() => {
    // The URL will contain a hash parameter when coming from a recovery link
    const hash = window.location.hash;
    if (!hash || !hash.includes("type=recovery")) {
      toast({
        title: "Invalid access",
        description: "Please use the password reset link sent to your email",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsPasswordUpdated(true);
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });

      // Navigate back to login after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
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
              {isPasswordUpdated ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isPasswordUpdated ? "Password Updated" : "Create New Password"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isPasswordUpdated 
              ? "Your password has been reset successfully" 
              : "Enter your new password below"}
          </p>
        </div>

        <Card className="border-border/50 shadow-xl animate-scale-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">
              {isPasswordUpdated ? "Success" : "New Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPasswordUpdated ? (
              <div className="text-center space-y-4">
                <div className="rounded-full bg-green-100 p-4 inline-flex mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-muted-foreground">
                  Your password has been updated successfully.
                </p>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the login page shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full transition-all hover:shadow-md flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
          {!isPasswordUpdated && (
            <CardFooter className="flex flex-col space-y-2 pt-0">
              <div className="relative my-2 w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    Changed your mind?
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
          )}
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default UpdatePassword;
