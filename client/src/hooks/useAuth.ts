import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, AuthState } from "@/types/auth";
import { getUserProfile, logout as logoutService } from "@/services/authService";

export function useAuth(): AuthState & {
  logout: () => Promise<void>;
  refetch: () => void;
} {
  const queryClient = useQueryClient();
  
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

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutateAsync,
    refetch,
  };
}
