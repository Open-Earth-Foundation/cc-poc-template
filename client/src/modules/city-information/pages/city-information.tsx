import { useParams, Link } from 'wouter';
import { useMemo } from 'react';
import { Header } from '@/core/components/layout/header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { CCTerraButton } from '@oef/components';
import {
  DisplayLarge,
  HeadlineLarge,
  TitleLarge,
  TitleMedium,
  BodyMedium,
  BodySmall,
  LabelMedium,
} from '@oef/components';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useCityInformation } from '../hooks/useCityInformation';
import { useCCRADashboard } from '../hooks/useCCRADashboard';
import { InventoryCard } from '../components/inventory-card';
import { HIAPActionsModal } from '../components/hiap-actions-modal';
import {
  MapPin,
  Globe,
  Calendar,
  Database,
  ArrowLeft,
  Building2,
  Clock,
  Shield,
  AlertTriangle,
  Leaf,
  HeartHandshake,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CityInformation() {
  const { cityId } = useParams<{ cityId: string }>();
  const { t } = useTranslation();

  // Use our new working API
  const { data: cityInfo, isLoading, error } = useCityInformation(cityId);

  // Get the most recent inventory for CCRA data (safe computation)
  const latestInventory = useMemo(() => {
    if (!cityInfo?.data?.years || cityInfo.data.years.length === 0) return null;
    return [...cityInfo.data.years].sort(
      (a, b) => (b.year || 0) - (a.year || 0)
    )[0];
  }, [cityInfo?.data?.years]);

  // Fetch CCRA data for the latest inventory (hooks rules compliance)
  const {
    data: ccraData,
    isLoading: ccraLoading,
    error: ccraError,
  } = useCCRADashboard(latestInventory?.inventoryId || undefined);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='space-y-6'>
            <Skeleton className='h-8 w-64' />
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Skeleton className='h-96' />
              <Skeleton className='h-96' />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className='h-32' />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cityInfo) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='mb-6'>
            <Link href='/cities'>
              <CCTerraButton
                variant='text'
                className='mb-4'
                data-testid='button-back-to-cities'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                {t('cityInfo.backToCities')}
              </CCTerraButton>
            </Link>
          </div>
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <TitleLarge color='semantic.danger' className='mb-2'>
                  {t('cityInfo.errorLoadingCity')}
                </TitleLarge>
                <BodyMedium>
                  {t('cityInfo.failedToLoadCity')}: {cityId}
                </BodyMedium>
                {error && (
                  <BodySmall className='mt-2'>
                    {error instanceof Error
                      ? error.message
                      : t('cityInfo.unknownError')}
                  </BodySmall>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const city = cityInfo.data;

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Navigation */}
        <div className='mb-6'>
          <Link href='/cities'>
            <CCTerraButton
              variant='text'
              className='mb-4'
              data-testid='button-back-to-cities'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              {t('cityInfo.backToCities')}
            </CCTerraButton>
          </Link>
        </div>

        {/* City Header */}
        <div className='mb-8'>
          <DisplayLarge className='mb-2' data-testid='text-city-name'>
            {city.name}
          </DisplayLarge>
          <div className='flex flex-wrap gap-4 items-center text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Globe className='h-4 w-4' />
              <span data-testid='text-city-country'>{city.country}</span>
            </div>
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4' />
              <span data-testid='text-city-locode'>{city.locode}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Database className='h-4 w-4' />
              <span data-testid='text-inventory-count'>
                {t('cityInfo.inventoryCount', { count: city.totalInventories })}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* City Information Card */}
          <Card data-testid='card-city-info'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                {t('cityInfo.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>
                  {t('cityInfo.cityName')}
                </label>
                <p
                  className='text-sm text-muted-foreground'
                  data-testid='text-city-name-detail'
                >
                  {city.name}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>
                  {t('cityInfo.country')}
                </label>
                <p
                  className='text-sm text-muted-foreground'
                  data-testid='text-city-country-detail'
                >
                  {city.country}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>
                  {t('cityInfo.locode')}
                </label>
                <p
                  className='text-sm text-muted-foreground font-mono'
                  data-testid='text-city-locode-detail'
                >
                  {city.locode}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>
                  {t('cityInfo.countryCode')}
                </label>
                <p
                  className='text-sm text-muted-foreground'
                  data-testid='text-city-country-code'
                >
                  {city.locodePrefix}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>
                  {t('cityInfo.availableDataYears')}
                </label>
                <div className='flex flex-wrap gap-2 mt-2'>
                  {city.availableYears.map(year => (
                    <Badge
                      key={year}
                      variant='secondary'
                      data-testid={`badge-year-${year}`}
                    >
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>
              {city.latestUpdate && (
                <div>
                  <label className='text-sm font-medium'>
                    {t('cityInfo.lastUpdated')}
                  </label>
                  <p
                    className='text-sm text-muted-foreground'
                    data-testid='text-last-update'
                  >
                    {new Date(city.latestUpdate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Overview Card */}
          <Card data-testid='card-data-overview'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                {t('cityInfo.dataOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center py-8'>
                <div
                  className='text-3xl font-bold text-primary mb-2'
                  data-testid='text-total-inventories'
                >
                  {city.totalInventories}
                </div>
                <p className='text-muted-foreground'>
                  {t('cityInfo.totalInventories')}
                </p>
              </div>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium'>
                    {t('cityInfo.latestYear')}
                  </span>
                  <span
                    className='text-sm text-muted-foreground'
                    data-testid='text-latest-year'
                  >
                    {city.availableYears[0] || 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium'>
                    {t('cityInfo.earliestYear')}
                  </span>
                  <span
                    className='text-sm text-muted-foreground'
                    data-testid='text-earliest-year'
                  >
                    {city.availableYears[city.availableYears.length - 1] ||
                      'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium'>
                    {t('cityInfo.yearRange')}
                  </span>
                  <span
                    className='text-sm text-muted-foreground'
                    data-testid='text-year-range'
                  >
                    {city.availableYears.length > 0
                      ? `${
                          city.availableYears[city.availableYears.length - 1]
                        } - ${city.availableYears[0]}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CCRA Dashboard Section */}
        {latestInventory && (
          <div className='mb-8'>
            <div className='flex items-center gap-2 mb-6'>
              <Shield className='h-5 w-5' />
              <HeadlineLarge>
                {t('cityInfo.climateRiskAssessment', 'Climate Risk Assessment')}
              </HeadlineLarge>
              <Badge variant='outline' data-testid='badge-ccra-year'>
                {latestInventory.year || 'N/A'}
              </Badge>
            </div>

            <Card data-testid='card-ccra-dashboard'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  {t('cityInfo.ccraDashboard', 'CCRA Dashboard')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ccraLoading ? (
                  <div className='space-y-4'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='h-20 w-full' />
                  </div>
                ) : ccraError ? (
                  <div className='text-center py-8'>
                    <AlertTriangle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <TitleMedium className='mb-2'>
                      {t('cityInfo.ccraErrorTitle', 'Unable to load CCRA data')}
                    </TitleMedium>
                    <BodySmall data-testid='text-ccra-error'>
                      {ccraError instanceof Error
                        ? ccraError.message
                        : t(
                            'cityInfo.ccraErrorMessage',
                            'Failed to fetch climate risk assessment data'
                          )}
                    </BodySmall>
                  </div>
                ) : ccraData?.data ? (
                  <div className='space-y-4'>
                    {ccraData.data.topRisks &&
                    ccraData.data.topRisks.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {ccraData.data.topRisks.map(
                          (risk: any, index: number) => (
                            <Card
                              key={index}
                              className='border'
                              data-testid={`card-risk-${index}`}
                            >
                              <CardHeader className='pb-3'>
                                <div className='flex items-center justify-between'>
                                  <Badge
                                    variant={
                                      risk.hazard === 'landslides'
                                        ? 'destructive'
                                        : 'default'
                                    }
                                    className='text-xs'
                                  >
                                    {risk.hazard}
                                  </Badge>
                                  <Badge variant='outline' className='text-xs'>
                                    {risk.latest_year}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className='pt-0 space-y-3'>
                                <div>
                                  <div className='flex items-center gap-2 mb-2'>
                                    {risk.keyimpact === 'infrastructure' ? (
                                      <Building2 className='h-4 w-4 text-muted-foreground' />
                                    ) : (
                                      <Shield className='h-4 w-4 text-muted-foreground' />
                                    )}
                                    <span className='text-sm font-medium capitalize'>
                                      {risk.keyimpact}
                                    </span>
                                  </div>
                                </div>

                                <div className='space-y-2'>
                                  <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                      Risk Score:
                                    </span>
                                    <span
                                      className='font-medium'
                                      data-testid={`text-risk-score-${index}`}
                                    >
                                      {(risk.risk_score * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                      Hazard:
                                    </span>
                                    <span className='font-medium'>
                                      {(risk.hazard_score * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                      Exposure:
                                    </span>
                                    <span className='font-medium'>
                                      {(risk.exposure_score * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                      Vulnerability:
                                    </span>
                                    <span className='font-medium'>
                                      {(risk.vulnerability_score * 100).toFixed(
                                        1
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        <TitleMedium>
                          {t('cityInfo.rawCcraData', 'Raw CCRA Data')}
                        </TitleMedium>
                        <pre
                          className='text-xs bg-muted p-3 rounded-md overflow-x-auto'
                          data-testid='text-ccra-raw-data'
                        >
                          {JSON.stringify(ccraData.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <TitleMedium className='mb-2'>
                      {t('cityInfo.noCcraData', 'No CCRA data available')}
                    </TitleMedium>
                    <BodyMedium>
                      {t(
                        'cityInfo.noCcraDataMessage',
                        'Climate risk assessment data is not available for this inventory.'
                      )}
                    </BodyMedium>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* HIAP Actions Section */}
        {latestInventory && (
          <div className='mb-8'>
            <div className='flex items-center gap-2 mb-6'>
              <HeartHandshake className='h-5 w-5' />
              <HeadlineLarge>
                {t('cityInfo.climateActions', 'Climate Actions')}
              </HeadlineLarge>
              <Badge variant='outline' data-testid='badge-hiap-year'>
                {latestInventory.year || 'N/A'}
              </Badge>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Mitigation Actions Card */}
              <HIAPActionsModal
                inventoryId={latestInventory.inventoryId}
                actionType='mitigation'
                title={t('cityInfo.mitigationActions', 'Mitigation Actions')}
                description={t(
                  'cityInfo.mitigationDescription',
                  'Actions to reduce greenhouse gas emissions and limit climate change.'
                )}
                trigger={
                  <Card
                    className='cursor-pointer hover:shadow-md transition-shadow'
                    data-testid='card-mitigation-actions'
                  >
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Leaf className='h-5 w-5 text-green-600' />
                        {t('cityInfo.mitigationActions', 'Mitigation Actions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>
                        {t(
                          'cityInfo.mitigationCardDescription',
                          'Explore evidence-based actions to reduce emissions and achieve climate targets.'
                        )}
                      </p>
                      <div className='flex items-center text-sm text-primary font-medium'>
                        {t('cityInfo.viewActions', 'View Actions')}
                        <ArrowLeft className='h-4 w-4 ml-2 rotate-180' />
                      </div>
                    </CardContent>
                  </Card>
                }
              />

              {/* Adaptation Actions Card */}
              <HIAPActionsModal
                inventoryId={latestInventory.inventoryId}
                actionType='adaptation'
                title={t('cityInfo.adaptationActions', 'Adaptation Actions')}
                description={t(
                  'cityInfo.adaptationDescription',
                  'Actions to build resilience and adapt to climate change impacts.'
                )}
                trigger={
                  <Card
                    className='cursor-pointer hover:shadow-md transition-shadow'
                    data-testid='card-adaptation-actions'
                  >
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Shield className='h-5 w-5 text-blue-600' />
                        {t('cityInfo.adaptationActions', 'Adaptation Actions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>
                        {t(
                          'cityInfo.adaptationCardDescription',
                          'Discover strategies to strengthen resilience against climate risks and impacts.'
                        )}
                      </p>
                      <div className='flex items-center text-sm text-primary font-medium'>
                        {t('cityInfo.viewActions', 'View Actions')}
                        <ArrowLeft className='h-4 w-4 ml-2 rotate-180' />
                      </div>
                    </CardContent>
                  </Card>
                }
              />
            </div>
          </div>
        )}

        {/* Inventories Section */}
        <div>
          <div className='flex items-center gap-2 mb-6'>
            <Calendar className='h-5 w-5' />
            <HeadlineLarge>{t('cityInfo.emissionsInventories')}</HeadlineLarge>
            <Badge variant='secondary' data-testid='badge-inventory-count'>
              {t('cityInfo.inventoryCount', { count: city.totalInventories })}
            </Badge>
          </div>

          {city.years.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {city.years
                .sort((a, b) => (b.year || 0) - (a.year || 0)) // Sort by year, newest first
                .map(yearData => (
                  <InventoryCard
                    key={yearData.inventoryId}
                    inventory={yearData}
                    cityName={city.name}
                    locode={city.locode}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center'>
                  <Database className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <TitleMedium className='mb-2'>
                    {t('cityInfo.noInventories')}
                  </TitleMedium>
                  <BodyMedium>
                    {t('cityInfo.noInventoriesDescription')}
                  </BodyMedium>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
