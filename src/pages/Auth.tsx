
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, clear any previous OTP verification status
      localStorage.removeItem("otpVerified");
      
      if (isLogin) {
        // Attempt to sign in with password
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) throw error;
        
        // Send OTP to user's email
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false, // Don't create new user since we already authenticated
          }
        });

        if (otpError) throw otpError;

        toast({
          title: "Verification code sent",
          description: "Please check your email for the verification code",
        });

        // Navigate to OTP verification page with email in state
        navigate("/verify-otp", { state: { email } });
      } else {
        // For signup flow
        const { error } = await supabase.auth.signUp({ email, password });

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

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ""
      );
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Background gradient elements */}
      <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-primary/20 rounded-full filter blur-3xl animate-pulse-soft"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-72 h-72 bg-primary/10 rounded-full filter blur-3xl"></div>
      
      <div className="w-full max-w-md p-4 z-10 animate-scale-in">
        <Card className="border border-border/50 shadow-xl backdrop-blur-sm bg-card/80">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto bg-primary/10 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? "Enter your credentials to sign in to your account" 
                : "Enter your details to create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isLogin ? "••••••••" : "Create a password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full transition-all hover:shadow-md space-x-2 group"
                disabled={isLoading}
              >
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/20 hover:bg-primary/5"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Login"}
              </Button>
              
              {isLogin && (
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-destructive/80 hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Account
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
