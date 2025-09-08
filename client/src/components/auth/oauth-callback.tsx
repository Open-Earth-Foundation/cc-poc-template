import { useEffect } from "react";
import { useLocation } from "wouter";
import { handleOAuthCallback } from "@/services/authService";
import { extractOAuthParams } from "@/utils/oauth";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

export function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetch } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const { success, error } = extractOAuthParams();
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: decodeURIComponent(error),
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      
      if (success === 'true') {
        try {
          await refetch(); // Refetch user profile to confirm authentication
          toast({
            title: "Welcome!",
            description: "You have been successfully authenticated.",
          });
          setLocation("/cities");
        } catch (error: any) {
          console.error("Profile fetch error after callback:", error);
          toast({
            title: "Authentication Issue",
            description: "Login succeeded but failed to load profile. Please try again.",
            variant: "destructive",
          });
          setLocation("/login");
        }
        return;
      }
      
      // Fallback - neither success nor error parameter found
      toast({
        title: "Authentication Error",
        description: "Invalid callback parameters",
        variant: "destructive",
      });
      setLocation("/login");
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
