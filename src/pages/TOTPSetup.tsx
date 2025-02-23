
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TOTPSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState<string>("");
  const [challengeId, setChallengeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const setupTOTP = async () => {
    try {
      const { data: { totp }, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      if (totp) {
        setQrCode(totp.qr_code);
        setSecret(totp.secret);
        // The factorId is part of the uri string, we need to extract it
        const uriParams = new URLSearchParams(totp.uri.split('?')[1]);
        const factorIdFromUri = uriParams.get('factorId');
        if (factorIdFromUri) {
          setFactorId(factorIdFromUri);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verifyTOTP = async () => {
    if (!verifyCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ 
        factorId 
      });
      
      if (challengeError) throw challengeError;
      if (!challengeData.id) throw new Error("No challenge ID received");
      
      setChallengeId(challengeData.id);

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // Store the factor ID in our custom table
      const { error: insertError } = await supabase
        .from('totp_factors')
        .insert([{ 
          factor_id: factorId,
          user_id: (await supabase.auth.getUser()).data.user?.id 
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "TOTP setup completed successfully!",
      });
      navigate("/passwords");
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!qrCode ? (
            <Button onClick={setupTOTP} className="w-full">
              Setup 2FA
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="border-4 border-primary p-2 rounded-lg"
                />
                <p className="text-sm text-muted-foreground break-all">
                  Secret key: {secret}
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                />
                <Button 
                  onClick={verifyTOTP} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TOTPSetup;
