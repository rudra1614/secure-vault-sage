
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Copy, Eye, EyeOff, Trash2
  ,
   
  LogOut 
  } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
       <
div
 className="
flex justify
-
between
 
items
-
center
 mb-8">
        <h1 className="text-3xl font-bold">Password Manager</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      
      {/* Add New Credential Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Credential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                value={newCredential.website}
                onChange={(e) => setNewCredential(prev => ({ ...prev, website: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input
                id="username"
                value={newCredential.username}
                onChange={(e) => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newCredential.password}
                onChange={(e) => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={addCredential.isPending}>
              {addCredential.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Credential
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Credentials List */}
      <div className="grid gap-4">
        {credentials?.map((cred) => (
          <Card key={cred.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{cred["Website UrL"]}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(cred["Username/Email"]?.[0] || "")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(cred.id)}
                      disabled={deleteCredential.isPending}
                    >
                      {deleteCredential.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-sm text-muted-foreground">
                    Username/Email: {cred["Username/Email"]?.[0]}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      Password:{" "}
                      {showPassword === cred.id ? cred.Password : "••••••••"}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(showPassword === cred.id ? null : cred.id)}
                    >
                      {showPassword === cred.id ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(cred.Password || "")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;