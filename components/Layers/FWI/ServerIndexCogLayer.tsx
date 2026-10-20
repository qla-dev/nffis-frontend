import { useEffect } from 'react';
import type { SupplementaryIndexType } from '../../../lib/fwi/supplementaryIndices';
import { CogRasterLayer, preloadCogRaster, supplementaryIndexCogStyle } from '../../Map/layers/Rasters/CogRasterLayer';

export interface ServerIndexLayerProps {
  visible: boolean;
  pane: string;
  /** Approved daily product chosen on the date timeline. */
  productId?: number | null;
  /** The next timeline product, fetched ahead so playback does not stall. */
  prefetchProductId?: number | null;
}

/** Renders one server-computed daily index COG (Angström, GFDI or KBDI). */
export function ServerIndexCogLayer({ type, visible, pane, productId, prefetchProductId }: ServerIndexLayerProps & { type: SupplementaryIndexType }) {
  useEffect(() => {
    if (!visible || !prefetchProductId || prefetchProductId === productId) return;
    preloadCogRaster(`/api/fire-intelligence/products/${prefetchProductId}/artifact/cog`);
  }, [prefetchProductId, productId, visible]);
  if (!visible || !productId) return null;
  return <CogRasterLayer url={`/api/fire-intelligence/products/${productId}/artifact/cog`} pane={pane} style={supplementaryIndexCogStyle(type)} />;
}
