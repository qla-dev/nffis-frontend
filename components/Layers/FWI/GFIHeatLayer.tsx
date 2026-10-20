import React from 'react';
import { ServerIndexCogLayer, type ServerIndexLayerProps } from './ServerIndexCogLayer';

/** McArthur grassland fire danger index (Mark 3), computed daily by the Fire Intelligence worker. */
export const GFIHeatLayer: React.FC<ServerIndexLayerProps> = (props) => <ServerIndexCogLayer type="GFDI" {...props} />;
