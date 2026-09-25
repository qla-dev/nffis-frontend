import { useEffect, useState } from 'react';
import { fetchFireIntelligenceProducts } from '../../../services/fireMonitoringService';
import { CogRasterLayer, FWI_COG_STYLE, preloadCogRaster } from '../../Map/layers/Rasters/CogRasterLayer';

export function FireIntelligenceCogLayer({ visible, pane, productId, prefetchProductId }: { visible: boolean; pane: string; productId?: number | null; prefetchProductId?: number | null }) {
  const [latestProductId, setLatestProductId] = useState<number | null>(null);
  useEffect(() => {
    if (!visible || productId) return;
    const controller = new AbortController();
    fetchFireIntelligenceProducts(controller.signal).then(result => {
      const product = result.data
        .filter(item => item.index_type === 'FWI' && item.forecast_day === 0 && item.status === 'approved' && item.artifact_urls?.cog)
        .sort((a, b) => Date.parse(b.valid_at) - Date.parse(a.valid_at))[0];
      setLatestProductId(product?.id ?? null);
    }).catch(error => { if (error.name !== 'AbortError') console.error('Unable to load the latest Fire Intelligence COG.', error); });
    return () => controller.abort();
  }, [productId, visible]);
  useEffect(() => {
    if (!visible || !prefetchProductId || prefetchProductId === productId) return;
    preloadCogRaster(`/api/fire-intelligence/products/${prefetchProductId}/artifact/cog`);
  }, [prefetchProductId, productId, visible]);
  const resolvedProductId = productId ?? latestProductId;
  const url = resolvedProductId ? `/api/fire-intelligence/products/${resolvedProductId}/artifact/cog` : null;
  return visible && url ? <CogRasterLayer url={url} pane={pane} style={FWI_COG_STYLE} /> : null;
}
