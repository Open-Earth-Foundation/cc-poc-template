import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { TitleMedium, BodySmall, LabelSmall } from '@oef/components';
import { City } from '@/core/types/city';

interface CityCardProps {
  city: City;
  onSelect: (cityId: string) => void;
  isActive?: boolean;
}

export function CityCard({ city, onSelect, isActive = true }: CityCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        !isActive ? 'opacity-60' : ''
      }`}
      onClick={() => isActive && onSelect(city.locode || city.cityId)}
      data-testid={`card-city-${city.cityId}`}
    >
      <CardContent className='p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <TitleMedium data-testid={`text-city-name-${city.cityId}`}>
              {city.name}
            </TitleMedium>
            <BodySmall data-testid={`text-city-country-${city.cityId}`}>
              {city.country}
            </BodySmall>
            {city.locode && (
              <LabelSmall
                className='mt-1'
                data-testid={`text-city-locode-${city.cityId}`}
              >
                LOCODE: {city.locode}
              </LabelSmall>
            )}
          </div>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            data-testid={`badge-city-status-${city.cityId}`}
          >
            {isActive ? 'Active' : 'Pending'}
          </Badge>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <LabelSmall>Project:</LabelSmall>
            <BodySmall data-testid={`text-city-project-${city.cityId}`}>
              {city.projectId}
            </BodySmall>
          </div>
          <div className='flex justify-between text-sm'>
            <LabelSmall>Boundaries:</LabelSmall>
            <BodySmall>Available</BodySmall>
          </div>
          <div className='flex justify-between text-sm'>
            <LabelSmall>Status:</LabelSmall>
            <BodySmall>{isActive ? 'Ready' : 'Pending Access'}</BodySmall>
          </div>
        </div>

        {!isActive && (
          <LabelSmall className='mt-4'>Access pending approval</LabelSmall>
        )}
      </CardContent>
    </Card>
  );
}
