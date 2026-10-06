import type { FireWeatherProduct } from '../../services/fireMonitoringService';

export function selectCurrentFwiForecast(products: FireWeatherProduct[]): FireWeatherProduct[] {
  const forecasts = products.filter(product => product.index_type === 'FWI' && (product.product_kind ?? 'forecast') === 'forecast');
  const latestRunId = Math.max(...forecasts.map(product => product.run_id));

  return forecasts
    .filter(product => product.run_id === latestRunId)
    .sort((a, b) => a.forecast_day - b.forecast_day);
}
