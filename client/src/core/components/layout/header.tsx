import { CCTerraButton } from '@oef/components';
import { TitleMedium, BodySmall } from '@oef/components';
import { useAuth } from '@/core/hooks/useAuth';
import { initiateOAuth } from '@/core/services/authService';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/core/components/i18n/language-switcher';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';
import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { analytics } from '@/core/lib/analytics';
import posthog from 'posthog-js';

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleLogin = async () => {
    try {
      const oauthResponse = await initiateOAuth();
      window.location.href = oauthResponse.authUrl;
    } catch (error) {
      toast({
        title: t('errors.authenticationFailed'),
        description: t('errors.networkError'),
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      const userId = user?.id || 'unknown';
      analytics.auth.logout(userId);
      await logout();
      // Reset PostHog user identification on logout
      if (posthog) {
        posthog.reset();
      }
      toast({
        title: t('navigation.logout'),
        description: t('common.success'),
      });
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        description: t('errors.networkError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <header className='bg-primary shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-4'>
            <div
              className='flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => setLocation('/cities')}
            >
              <div className='w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center p-0 overflow-hidden'>
                <img
                  src='/poc-icon.png'
                  alt={t('header.iconAlt')}
                  className='w-8 h-8 object-cover'
                />
              </div>
              <TitleMedium color='base.light'>{t('header.title')}</TitleMedium>
            </div>
            <BodySmall color='base.light' opacity={0.8}>
              {t('header.subtitle')}
            </BodySmall>
          </div>

          <div className='flex items-center space-x-4'>
            <LanguageSwitcher />
            {isLoading ? (
              <div className='h-8 w-24 bg-white/20 animate-pulse rounded'></div>
            ) : isAuthenticated && user ? (
              <div className='flex items-center space-x-3'>
                <div className='text-sm'>
                  <BodySmall
                    className='font-medium text-white'
                    data-testid='user-name'
                  >
                    {user.name}
                  </BodySmall>
                  <BodySmall
                    color='base.light'
                    opacity={0.8}
                    data-testid='user-email'
                  >
                    {user.email}
                  </BodySmall>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CCTerraButton
                      variant='text'
                      onClick={handleLogout}
                      data-testid='button-logout'
                      className='h-8 w-8 p-0 text-white hover:bg-white/10 transition-colors'
                    >
                      <LogOut className='h-4 w-4' />
                    </CCTerraButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('navigation.logout')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <CCTerraButton
                onClick={handleLogin}
                data-testid='button-login'
                variant='filled'
                className='bg-white text-primary hover:bg-white/90'
              >
                {t('login.continueButton')}
              </CCTerraButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
