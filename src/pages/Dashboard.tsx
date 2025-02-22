import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Copy, Eye, EyeOff, Trash2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const [newCredential, setNewCredential] = useState({
    website: "",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credentials } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("credentials").select("*");
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch credentials",
          variant: "destructive",
        });
        return [];
      }
      return data || [];
    },
  });

  const addCredential = useMutation(
    async () => {
      const { data, error } = await supabase.from("credentials").insert([
        {
          "Website UrL": newCredential.website,
          "Username/Email": [newCredential.username],
          Password: newCredential.password,
        },
      ]);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add credential",
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["credentials"] });
        setNewCredential({ website: "", username: "", password: "" });
        toast({
          title: "Success",
          description: "Credential added successfully",
        });
      },
    }
  );

  const deleteCredential = useMutation(
    async (id: string) => {
      const { data, error } = await supabase
        .from("credentials")
        .delete()
        .eq("id", id);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete credential",
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["credentials"] });
        toast({
          title: "Success",
          description: "Credential deleted successfully",
        });
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addCredential.mutate();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const handleDelete = (id: string) => {
    deleteCredential.mutate(id);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
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

export default Dashboard;
