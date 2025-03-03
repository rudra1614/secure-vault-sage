import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Eye, EyeOff, PlusCircle, Filter, Trash2, LogOut, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPasswords = async () => {
      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        toast({
          title: "Error fetching passwords",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPasswords(data);
      }
      setLoading(false);
    };

    fetchPasswords();
  }, [toast]);

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id as string
      );
      
      if (error) throw error;
      
      localStorage.removeItem("otpVerified");
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const renderPasswordCards = () => {
    return passwords.map((password) => (
      <Card key={password.id}>
        <CardHeader>
          <CardTitle>{password.title}</CardTitle>
          <CardDescription>{password.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="text" value={password.value} readOnly />
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => handleCopyPassword(password.value)}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="destructive" onClick={() => handleDeletePassword(password.id)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Password Manager</h1>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete Account</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          renderPasswordCards()
        )}
      </div>
    </div>
  );
};

export default Index;
