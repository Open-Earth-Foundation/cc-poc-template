import { useEffect } from "react";
import { useLocation } from "wouter";
import { handleOAuthCallback } from "@/core/services/authService";
import { extractOAuthParams } from "@/core/utils/oauth";
import { useToast } from "@/core/hooks/use-toast";
import { Spinner } from "@/core/components/ui/spinner";
import { useAuth } from "@/core/hooks/useAuth";

export function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetch } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const { code, state, error } = extractOAuthParams();
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error,
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      
      if (!code || !state) {
        toast({
          title: "Authentication Error",
          description: "Missing authorization code or state",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      
      try {
        await handleOAuthCallback(code, state);
        await refetch(); // Refetch user profile
        toast({
          title: "Welcome!",
          description: "You have been successfully authenticated.",
        });
        setLocation("/cities");
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to complete authentication",
          variant: "destructive",
        });
        setLocation("/login");
      }
    };
    
    handleCallback();
  }, [setLocation, toast, refetch]);

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <div className="text-center">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing Authentication...</h2>
        <p className="text-muted-foreground">Please wait while we process your login.</p>
      </div>
    </div>
  );
}
