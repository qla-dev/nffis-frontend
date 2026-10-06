import { describe, expect, it } from 'vitest';
import { selectCurrentFwiForecast } from '../lib/fwi/selectCurrentFwiForecast';
import type { FireWeatherProduct } from '../services/fireMonitoringService';

describe('selectCurrentFwiForecast', () => {
  it('keeps days 0 through 3 from the latest forecast run when older runs are present', () => {
    const product = (run_id: number, forecast_day: number, product_kind: FireWeatherProduct['product_kind'] = 'forecast'): FireWeatherProduct => ({
      id: run_id * 10 + forecast_day,
      run_id,
      index_type: 'FWI',
      forecast_day,
      product_kind,
      valid_at: `2026-10-${String(6 + forecast_day).padStart(2, '0')}T12:00:00Z`,
      status: 'approved',
      quality_state: 'forecast',
    });
    const products = [
      product(71, 3), product(70, 0), product(71, 1), product(72, 0, 'historical_reanalysis'),
      product(71, 0), product(70, 2), product(71, 2), product(70, 1), product(70, 3),
    ];

    expect(selectCurrentFwiForecast(products).map(item => [item.run_id, item.forecast_day]))
      .toEqual([[71, 0], [71, 1], [71, 2], [71, 3]]);
  });
});
