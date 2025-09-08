import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { initiateOAuth } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const oauthResponse = await initiateOAuth();
      window.location.href = oauthResponse.authUrl;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Failed to initiate OAuth flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BC</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">Boundary Editor</h1>
            </div>
            <span className="text-sm text-muted-foreground">CityCatalyst Integration</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <div className="font-medium text-foreground" data-testid="user-name">{user.name}</div>
                  <div className="text-muted-foreground" data-testid="user-email">{user.email}</div>
                </div>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                data-testid="button-login"
              >
                Sign In with CityCatalyst
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
