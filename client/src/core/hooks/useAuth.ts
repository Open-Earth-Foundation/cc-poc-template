import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { User, AuthState } from '@/core/types/auth';
import {
  getUserProfile,
  logout as logoutService,
} from '@/core/services/authService';

export function useAuth(): AuthState & {
  logout: () => Promise<void>;
  refetch: () => void;
  initiateCityCatalystAuth: () => Promise<void>;
} {
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery<User | null>({
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

  // Auto-retry OAuth on single-use code error with complete cache clearing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasRetryParam =
      urlParams.get('retry') || urlParams.get('clear_cache');

    if (hasRetryParam && !user && !isLoading) {
      console.log(
        '🔄 Auto-retrying OAuth with fresh state due to single-use code error...'
      );

      // Clear ALL browser cache and OAuth state
      const clearBrowserCache = () => {
        // Clear URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.search = '';
        newUrl.hash = '';
        window.history.replaceState({}, '', newUrl.toString());

        // Clear any OAuth-related session storage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('code_verifier');

        // Clear React Query cache for auth-related queries
        queryClient.clear();

        // Force a small delay to ensure clean state, then initiate fresh OAuth
        setTimeout(() => {
          console.log('✨ Initiating completely fresh OAuth flow...');
          initiateCityCatalystAuth();
        }, 100);
      };

      clearBrowserCache();
    }
  }, [user, isLoading, location, queryClient]);

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
