import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/core/components/ui/card';
import { CCTerraButton, TitleLarge, BodyMedium } from '@oef/components';
import { useAuth } from '@/core/hooks/useAuth';
import { initiateOAuth } from '@/core/services/authService';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { analytics } from '@/core/lib/analytics';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/cities');
    }
  }, [isAuthenticated, setLocation]);

  // Track page view on component mount
  useEffect(() => {
    analytics.navigation.pageViewed('Login');
  }, []);

  const handleOAuthLogin = async () => {
    try {
      analytics.auth.loginAttempt('oauth');
      const oauthResponse = await initiateOAuth();
      window.location.href = oauthResponse.authUrl;
    } catch (error: any) {
      analytics.auth.loginFailure(error.message || 'network_error', 'oauth');
      toast({
        title: t('errors.authenticationFailed'),
        description: error.message || t('errors.networkError'),
        variant: 'destructive',
      });
    }
  };

  const handleSampleLogin = async () => {
    try {
      analytics.auth.loginAttempt('sample');
      // For development: trigger the sample user creation
      await handleOAuthLogin();
    } catch (error: any) {
      analytics.auth.loginFailure(
        error.message || 'validation_error',
        'sample'
      );
      toast({
        title: t('errors.authenticationFailed'),
        description: error.message || t('errors.validationError'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-muted flex items-center justify-center'>
        <div className='h-8 w-24 bg-card animate-pulse rounded'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-muted flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <Card>
          <CardContent className='p-8'>
            <div className='text-center'>
              <div className='mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-6 p-0 overflow-hidden'>
                <img
                  src='/poc-icon.png'
                  alt={t('header.iconAlt')}
                  className='w-16 h-16 object-cover'
                />
              </div>
              <TitleLarge className='mb-2' data-testid='text-login-title'>
                {t('login.title')}
              </TitleLarge>
              <BodyMedium className='mb-8' data-testid='text-login-subtitle'>
                {t('login.subtitle')}
              </BodyMedium>
            </div>

            <div className='space-y-4'>
              <CCTerraButton
                className='w-full'
                onClick={handleOAuthLogin}
                data-testid='button-oauth-login'
                variant='filled'
                leftIcon={<ArrowRight className='w-5 h-5' />}
              >
                {t('login.continueButton')}
              </CCTerraButton>

              {/* Sample User Button - Currently not working properly */}
              {/* TODO: Fix sample user authentication flow */}
              {/*
              <div className="text-center">
                <Button 
                  variant="link"
                  onClick={handleSampleLogin}
                  data-testid="button-sample-login"
                >
                  {t('login.sampleButton')}
                </Button>
              </div>
              */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
