import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FwiParameterComparison } from '../components/Map/FwiParameterComparison';

const inputs = { temperatureC: 25, humidityPct: 40, windKmh: 15, dryDays: 12, rainMm: 0, month: 7, previousFfmc: 85, previousDmc: 6, previousDc: 15 };
const props = { inputs, observationTime: '2026-07-15T12:00', locationName: 'Tuzla' };

describe('FWI parameter comparison', () => {
  it('updates both formula outputs from a shared parameter and resets the scenario', () => {
    render(<FwiParameterComparison {...props} />);
    const resultCells = () => within(within(screen.getByRole('table', { name: 'Bosnian and Canadian FWI comparison' })).getByRole('row', { name: /^Point FWI / })).getAllByRole('cell').slice(1).map(cell => cell.textContent);
    const original = resultCells();
    expect(original.every(value => value !== '-')).toBe(true);
    fireEvent.change(screen.getByLabelText('Comparison Wind (km/h)'), { target: { value: '35' } });
    const changed = resultCells();
    expect(Number(changed[0])).toBeGreaterThan(Number(original[0]));
    expect(Number(changed[1])).toBeGreaterThan(Number(original[1]));
    expect(Number(screen.getByLabelText('FWI difference').textContent)).toBeCloseTo(Number(changed[1]) - Number(changed[0]), 2);
    fireEvent.click(screen.getByText('Reset to loaded inputs'));
    expect(resultCells()).toEqual(original);
  });

  it('shows a dash for inputs and intermediate values that a formula does not use', () => {
    render(<FwiParameterComparison {...props} />);
    const table = screen.getByRole('table', { name: 'Bosnian and Canadian FWI comparison' });
    for (const label of ['Previous FFMC', 'Previous DMC', 'Previous DC', 'Updated FFMC', 'Updated DMC', 'Updated DC', 'Rain, previous 24 h (mm)']) {
      const cells = within(within(table).getByRole('row', { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })).getAllByRole('cell');
      expect(cells[1]).toHaveTextContent('-');
      expect(cells[2].textContent).not.toBe('-');
    }
    const dryDays = within(within(table).getByRole('row', { name: /Dry days/ })).getAllByRole('cell');
    expect(dryDays[1]).toHaveTextContent('12.000');
    expect(dryDays[2]).toHaveTextContent('-');
  });
  it('requires an explicit rain value when the 24-hour weather window is incomplete', () => {
    render(<FwiParameterComparison {...props} inputs={{ ...inputs, rainMm: null }} />);
    expect(screen.getByLabelText('FWI difference')).toHaveTextContent('-');
    fireEvent.change(screen.getByLabelText('Comparison Rain, previous 24 h (mm)'), { target: { value: '0' } });
    expect(screen.getByLabelText('FWI difference').textContent).not.toBe('-');
    fireEvent.change(screen.getByLabelText('Comparison Humidity (%)'), { target: { value: '101' } });
    expect(screen.getByLabelText('FWI difference')).toHaveTextContent('-');
  });
});
