import L from 'leaflet';

// Give the pointer time to cross the gap between the marker and its popup.
export function awsPopupHoverHandlers() {
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let popupElement: HTMLElement | null = null;
  let currentMarker: L.Marker | null = null;
  const cancelClose = () => { if (closeTimer) clearTimeout(closeTimer); closeTimer = undefined; };
  const scheduleClose = (marker: L.Marker) => {
    cancelClose();
    closeTimer = setTimeout(() => marker.closePopup(), 180);
  };
  const enterPopup = () => cancelClose();
  const leavePopup = () => { if (currentMarker) scheduleClose(currentMarker); };

  return {
    mouseover: (event: L.LeafletMouseEvent) => { cancelClose(); (event.target as L.Marker).openPopup(); },
    mouseout: (event: L.LeafletMouseEvent) => scheduleClose(event.target as L.Marker),
    popupopen: (event: L.PopupEvent) => {
      currentMarker = event.target as L.Marker;
      popupElement = event.popup.getElement();
      if (!popupElement) return;
      popupElement.addEventListener('mouseenter', enterPopup);
      popupElement.addEventListener('mouseleave', leavePopup);
    },
    popupclose: () => {
      cancelClose();
      popupElement?.removeEventListener('mouseenter', enterPopup);
      popupElement?.removeEventListener('mouseleave', leavePopup);
      popupElement = null;
      currentMarker = null;
    },
  };
}
