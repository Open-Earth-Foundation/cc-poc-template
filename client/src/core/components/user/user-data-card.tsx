import { User } from '@/core/types/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { TitleMedium, BodySmall, LabelMedium } from '@oef/components';
import { User as UserIcon, Mail, Briefcase, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserDataCardProps {
  user: User;
}

export function UserDataCard({ user }: UserDataCardProps) {
  const { t } = useTranslation();

  return (
    <Card className='w-full' data-testid='card-user-data'>
      <CardHeader>
        <CardTitle
          className='flex items-center gap-2'
          data-testid='text-user-data-title'
        >
          <UserIcon className='h-5 w-5' />
          <TitleMedium>{t('user.userData')}</TitleMedium>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* User Basic Info */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <UserIcon className='h-4 w-4 text-muted-foreground' />
              <LabelMedium>{t('user.name')}</LabelMedium>
            </div>
            <BodySmall className='pl-6' data-testid='text-user-name'>
              {user.name}
            </BodySmall>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <LabelMedium>{t('user.email')}</LabelMedium>
            </div>
            <BodySmall className='pl-6' data-testid='text-user-email'>
              {user.email}
            </BodySmall>
          </div>
        </div>

        {/* User Title */}
        {user.title && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Briefcase className='h-4 w-4 text-muted-foreground' />
              <LabelMedium>{t('user.title')}</LabelMedium>
            </div>
            <BodySmall className='pl-6' data-testid='text-user-title'>
              {user.title}
            </BodySmall>
          </div>
        )}

        {/* User ID */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <LabelMedium>{t('user.userId')}</LabelMedium>
          </div>
          <BodySmall
            className='font-mono bg-muted px-2 py-1 rounded'
            data-testid='text-user-id'
          >
            {user.id}
          </BodySmall>
        </div>

        {/* Projects */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <FolderOpen className='h-4 w-4 text-muted-foreground' />
            <LabelMedium>
              {t('user.projects')} ({user.projects.length})
            </LabelMedium>
          </div>
          <div
            className='flex flex-wrap gap-2 pl-6'
            data-testid='container-user-projects'
          >
            {user.projects.map(projectId => (
              <Badge
                key={projectId}
                variant='secondary'
                className='text-xs'
                data-testid={`badge-project-${projectId}`}
              >
                {projectId
                  .replace('project-', '')
                  .replace('-', ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
