
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Key, Database } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      {/* Hero Section */}
      <div className="container px-4 text-center space-y-8">
        <div className="flex justify-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full animate-pulse">
            <Shield className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          SecureVault
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Your trusted guardian for digital credentials. Store, manage, and access your passwords with military-grade encryption.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="min-w-[200px] text-lg hover:scale-105 transition-transform"
          >
            <Lock className="mr-2 h-5 w-5" />
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/auth")}
            className="min-w-[200px] text-lg hover:scale-105 transition-transform"
          >
            <Key className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
            <p className="text-muted-foreground">
              End-to-end encryption ensures your data stays private and protected.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors">
            <Database className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cloud Sync</h3>
            <p className="text-muted-foreground">
              Access your passwords securely from any device, anywhere.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors">
            <Key className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Password Generator</h3>
            <p className="text-muted-foreground">
              Create strong, unique passwords with our built-in generator.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>© 2024 SecureVault. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
