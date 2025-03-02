
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Copy, Eye, EyeOff, Trash2, LogOut, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState<number | null>(null);
  const [newCredential, setNewCredential] = useState({
    website: "",
    username: "",
    password: "",
  });

  // Check authentication status
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return null;
    }
    return session;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };
  
  // Fetch credentials
  const { data: credentials, isLoading } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const session = await checkUser();
      if (!session) return [];
      const { data, error } = await supabase
        .from("Credentials")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Add new credential
  const addCredential = useMutation({
    mutationFn: async (credential: typeof newCredential) => {
      const { error } = await supabase.from("Credentials").insert([
        {
          "Website UrL": credential.website,
          "Username/Email": [credential.username],
          "Password": credential.password,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      setNewCredential({ website: "", username: "", password: "" });
      toast({
        title: "Success",
        description: "Credential added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete credential
  const deleteCredential = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("Credentials")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast({
        title: "Success",
        description: "Credential deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCredential.mutate(newCredential);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this credential?")) {
      deleteCredential.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="h-16 w-16 text-primary opacity-80" />
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your secure vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 pb-16">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300">Password Vault</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        
        {/* Add New Credential Form */}
        <Card className="mb-8 border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none rounded-lg"></div>
          <CardHeader className="relative border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              Add New Credential
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="website" className="text-sm font-medium">Website URL</Label>
                <Input
                  id="website"
                  value={newCredential.website}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, website: e.target.value }))}
                  required
                  className="transition-all focus-visible:ring-primary"
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-sm font-medium">Username/Email</Label>
                <Input
                  id="username"
                  value={newCredential.username}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
                  required
                  className="transition-all focus-visible:ring-primary"
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newCredential.password}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="transition-all focus-visible:ring-primary"
                  placeholder="••••••••••"
                />
              </div>
              <Button 
                type="submit" 
                disabled={addCredential.isPending}
                className="w-full mt-2 transition-all hover:shadow-md hover:shadow-primary/20"
              >
                {addCredential.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Save Credential
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Credentials List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground/90">Your Credentials</h2>
          <div className="grid gap-4">
            {credentials?.length === 0 ? (
              <Card className="p-12 border-dashed border-2 border-muted bg-muted/20">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <Key className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-muted-foreground">No credentials saved yet</p>
                  <p className="text-sm text-muted-foreground/70">Add your first credential using the form above</p>
                </div>
              </Card>
            ) : (
              credentials?.map((cred) => (
                <Card 
                  key={cred.id} 
                  className="overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md group"
                >
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-lg flex items-center gap-2">
                          <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Key className="h-4 w-4" />
                          </div>
                          {cred["Website UrL"]}
                        </div>
                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(cred["Username/Email"]?.[0] || "")}
                            className="h-8 w-8 transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(cred.id)}
                            disabled={deleteCredential.isPending}
                            className="h-8 w-8 opacity-70 hover:opacity-100"
                          >
                            {deleteCredential.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 bg-muted/30 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span className="font-medium text-foreground/80">Username/Email:</span> 
                          <span className="font-mono bg-background/80 px-2 py-1 rounded text-foreground/90 flex items-center gap-2">
                            {cred["Username/Email"]?.[0]}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(cred["Username/Email"]?.[0] || "")}
                              className="h-6 w-6 ml-1 hover:bg-primary/10 hover:text-primary"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span className="font-medium text-foreground/80">Password:</span>
                          <span className="font-mono bg-background/80 px-2 py-1 rounded text-foreground/90 flex items-center gap-2">
                            {showPassword === cred.id ? (
                              <span className="text-foreground/90">{cred.Password}</span>
                            ) : (
                              <span className="text-foreground/90">••••••••</span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPassword(showPassword === cred.id ? null : cred.id)}
                              className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                            >
                              {showPassword === cred.id ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(cred.Password || "")}
                              className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
