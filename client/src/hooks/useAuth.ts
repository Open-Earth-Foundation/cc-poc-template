import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, AuthState } from "@/types/auth";
import { getUserProfile, logout as logoutService } from "@/services/authService";

export function useAuth(): AuthState & {
  logout: () => Promise<void>;
  refetch: () => void;
  initiateCityCatalystAuth: () => Promise<void>;
} {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      try {
        const profile = await getUserProfile();
        return profile;
      } catch (error: any) {
        if (error.message.includes('401')) {
          return null; // Not authenticated
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logoutService,
    onSuccess: () => {
      queryClient.setQueryData(['/api/user/profile'], null);
      queryClient.clear();
    },
  });

  // Auto-retry OAuth on single-use code error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('retry') === '1' && !user && !isLoading) {
      console.log('🔄 Auto-retrying OAuth due to single-use code error...');
      // Clear the retry parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('retry');
      window.history.replaceState({}, '', newUrl.toString());
      // Initiate fresh OAuth
      initiateCityCatalystAuth();
    }
  }, [user, isLoading, location]);

  const initiateCityCatalystAuth = async () => {
    try {
      const response = await fetch('/api/auth/oauth/initiate');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutateAsync,
    refetch,
    initiateCityCatalystAuth,
  };
}
