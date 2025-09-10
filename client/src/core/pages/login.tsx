import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { useAuth } from "@/core/hooks/useAuth";
import { initiateOAuth } from "@/core/services/authService";
import { useToast } from "@/core/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/cities");
    }
  }, [isAuthenticated, setLocation]);

  const handleOAuthLogin = async () => {
    try {
      const oauthResponse = await initiateOAuth();
      window.location.href = oauthResponse.authUrl;
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to initiate OAuth flow",
        variant: "destructive",
      });
    }
  };

  const handleSampleLogin = async () => {
    try {
      // For development: trigger the sample user creation
      await handleOAuthLogin();
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to use sample user",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="h-8 w-24 bg-card animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-6 p-2">
                <img 
                  src="/boundary-icon.png" 
                  alt="Boundary Editor Icon" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-login-title">
                Welcome to a CC POC Module
              </h2>
              <p className="text-muted-foreground mb-8" data-testid="text-login-subtitle">
                Connect your CityCatalyst account to access your data.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full"
                onClick={handleOAuthLogin}
                data-testid="button-oauth-login"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                Continue with CityCatalyst
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="link"
                  onClick={handleSampleLogin}
                  data-testid="button-sample-login"
                >
                  Use Sample User (for testing)
                </Button>
              </div>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
