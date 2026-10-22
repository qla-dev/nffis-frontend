import React from 'react';
import { ServerIndexCogLayer, type ServerIndexLayerProps } from './ServerIndexCogLayer';

/** Keetch–Byram drought index, computed daily by the Fire Intelligence worker. */
export const KBDIHeatLayer: React.FC<ServerIndexLayerProps> = (props) => <ServerIndexCogLayer type="KBDI" {...props} />;
