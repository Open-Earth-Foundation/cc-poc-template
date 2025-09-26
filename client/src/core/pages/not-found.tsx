import { Card, CardContent } from '@/core/components/ui/card';
import { TitleLarge, BodySmall } from '@oef/components';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-gray-50'>
      <Card className='w-full max-w-md mx-4'>
        <CardContent className='pt-6'>
          <div className='flex mb-4 gap-2'>
            <AlertCircle className='h-8 w-8 text-red-500' />
            <TitleLarge color='content.primary'>404 Page Not Found</TitleLarge>
          </div>

          <BodySmall color='content.tertiary' className='mt-4'>
            Did you forget to add the page to the router?
          </BodySmall>
        </CardContent>
      </Card>
    </div>
  );
}
