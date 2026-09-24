import { useEffect, useState } from 'react';
import { fetchFireIntelligenceProducts } from '../../../services/fireMonitoringService';
import { CogRasterLayer, FWI_COG_STYLE } from '../../Map/layers/Rasters/CogRasterLayer';

export function FireIntelligenceCogLayer({ visible, pane }: { visible: boolean; pane: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) { setUrl(null); return; }
    const controller = new AbortController();
    fetchFireIntelligenceProducts(controller.signal).then(result => {
      const product = result.data
        .filter(item => item.index_type === 'FWI' && item.forecast_day === 0 && item.status === 'approved' && item.artifact_urls?.cog)
        .sort((a, b) => Date.parse(b.valid_at) - Date.parse(a.valid_at))[0];
      setUrl(product ? `/api/fire-intelligence/products/${product.id}/artifact/cog` : null);
    }).catch(error => { if (error.name !== 'AbortError') console.error('Unable to load the latest Fire Intelligence COG.', error); });
    return () => controller.abort();
  }, [visible]);
  return visible && url ? <CogRasterLayer url={url} pane={pane} style={FWI_COG_STYLE} /> : null;
}
