
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Key } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      {/* Hero Section */}
      <div className="container px-4 text-center space-y-8">
        <div className="flex justify-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full">
            <Shield className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Secure Password Manager
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Keep your digital life safe and organized. Store, manage, and access your passwords securely from anywhere.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="min-w-[200px] text-lg"
          >
            <Lock className="mr-2 h-5 w-5" />
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/auth")}
            className="min-w-[200px] text-lg"
          >
            <Key className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg bg-card">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
            <p className="text-muted-foreground">
              Your passwords are encrypted and stored with industry-standard security.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card">
            <Lock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Access</h3>
            <p className="text-muted-foreground">
              Quick and secure access to all your passwords whenever you need them.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card">
            <Key className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Password Generation</h3>
            <p className="text-muted-foreground">
              Generate strong, unique passwords for all your accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>© 2024 Password Manager. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
