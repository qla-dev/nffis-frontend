import { afterEach, describe, expect, it, vi } from 'vitest';
import { awsPopupHoverHandlers } from '../components/Map/layers/AWS/awsPopupHover';

describe('AWS popup hover', () => {
  afterEach(() => vi.useRealTimers());

  it('closes after leaving the marker, but stays open while the pointer is on the card', () => {
    vi.useFakeTimers();
    const element = document.createElement('div');
    const marker = { openPopup: vi.fn(), closePopup: vi.fn() };
    const handlers = awsPopupHoverHandlers();
    const event = { target: marker } as any;

    handlers.mouseover(event);
    handlers.popupopen({ ...event, popup: { getElement: () => element } } as any);
    handlers.mouseout(event);
    element.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(200);
    expect(marker.closePopup).not.toHaveBeenCalled();

    element.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(180);
    expect(marker.closePopup).toHaveBeenCalledOnce();
    handlers.popupclose();
  });
});
