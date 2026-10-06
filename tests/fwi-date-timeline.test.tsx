import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { archiveFwiDateRange, defaultFwiDateRange, filterFwiProducts, FwiDateRangePicker, FwiDateTimeline } from '../components/Map/FwiDateTimeline';
import type { FireWeatherProduct } from '../services/fireMonitoringService';

const products = ['2025-12-05', '2026-06-15', '2026-10-05'].map((date, index) => ({
  id: index + 1,
  valid_at: `${date}T12:00:00Z`,
  statistics: { min: 0, max: 40, mean: [4.2, 14.7, 30.1][index], count: 100 },
})) as FireWeatherProduct[];

afterEach(() => vi.useRealTimers());

describe('FWI date range', () => {
  it('defaults to the last 90 calendar days and filters saved products inclusively', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
    const range = defaultFwiDateRange();
    expect(range).toEqual({ from: '2026-07-09', to: '2026-10-06' });
    expect(filterFwiProducts(products, range).map(product => product.id)).toEqual([3]);
    expect(archiveFwiDateRange(products)).toEqual({ from: '2025-12-05', to: '2026-10-06' });
    expect(filterFwiProducts(products, { from: '2025-12-05', to: '2026-06-15' }).map(product => product.id)).toEqual([1, 2]);
  });

  it('shows the date on the map and navigates between saved products', () => {
    const onSelect = vi.fn();
    render(<FwiDateTimeline products={products} range={{ from: '2025-10-07', to: '2026-10-06' }}
      index={1} onSelect={onSelect} language="en" />);
    const datePicker = screen.getByLabelText('Date shown on map');
    expect(datePicker).toHaveAttribute('type', 'date');
    expect(datePicker).toHaveValue('2026-06-15');
    expect(screen.queryByText('Date shown on map')).not.toBeInTheDocument();
    expect(screen.getByText('5 Dec')).toBeInTheDocument();
    expect(screen.getByText('15 Jun')).toBeInTheDocument();
    expect(screen.getByText('5 Oct')).toBeInTheDocument();
    expect(screen.queryByText(/available days/)).not.toBeInTheDocument();
    fireEvent.change(datePicker, { target: { value: '2025-12-05' } });
    expect(onSelect).toHaveBeenCalledWith(0);
    fireEvent.change(datePicker, { target: { value: '2026-06-16' } });
    expect(onSelect).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Previous FWI date' }));
    expect(onSelect).toHaveBeenCalledWith(0);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('allows an earlier start date without limiting it to saved products', () => {
    const onChange = vi.fn();
    render(<FwiDateRangePicker range={{ from: '2026-06-01', to: '2026-10-06' }}
      onChange={onChange} language="en" maxDate="2026-10-06" firstAvailableDate="2026-06-26" />);
    expect(screen.getByText(/Earliest saved FWI: 26 June 2026/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('FWI from date'), { target: { value: '2025-10-07' } });
    expect(onChange).toHaveBeenCalledWith({ from: '2025-10-07', to: '2026-10-06' });
  });
});
