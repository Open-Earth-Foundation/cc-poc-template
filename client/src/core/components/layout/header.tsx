import { Button } from "@/core/components/ui/button";
import { useAuth } from "@/core/hooks/useAuth";
import { initiateOAuth } from "@/core/services/authService";
import { useToast } from "@/core/hooks/use-toast";

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
    <header className="bg-primary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center p-0">
                <img 
                  src="/boundary-icon.png" 
                  alt="Boundary Editor Icon" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-xl font-semibold text-white">CC POC Module</h1>
            </div>
            <span className="text-sm text-white/80">CityCatalyst Prototype Module</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-white/20 animate-pulse rounded"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <div className="font-medium text-white" data-testid="user-name">{user.name}</div>
                  <div className="text-white/80" data-testid="user-email">{user.email}</div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="border-white bg-primary text-white hover:bg-white hover:text-primary"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                data-testid="button-login"
                className="bg-white text-primary hover:bg-white/90"
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
