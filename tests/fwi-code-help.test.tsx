import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FwiCodeHelp } from '../components/Map/FwiCodeHelp';

describe('FWI Bootstrap help tooltips', () => {
  it.each([
    ['FFMC', 'Fine Fuel Moisture Code'],
    ['DMC', 'Duff Moisture Code'],
    ['DC', 'Drought Code'],
  ])('shows the %s expansion on hover and removes the tooltip on unmount', async (code, expansion) => {
    // Bootstrap checks layout visibility; jsdom has no layout engine.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{ width: 13, height: 13 }] as unknown as DOMRectList);
    const view = render(<FwiCodeHelp label={`Previous ${code}`} />);
    const icon = screen.getByRole('button', { name: `What does ${code} stand for?` });
    expect(icon).not.toHaveAttribute('title');
    fireEvent.mouseOver(icon);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveClass('fwi-code-tooltip');
    expect(tooltip).toHaveTextContent(expansion);
    expect(icon).toHaveAttribute('aria-describedby', tooltip.id);
    fireEvent.mouseOut(icon);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    fireEvent.focusIn(icon);
    await screen.findByRole('tooltip');
    view.unmount();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
