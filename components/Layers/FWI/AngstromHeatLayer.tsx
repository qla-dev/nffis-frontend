import React from 'react';
import { ServerIndexCogLayer, type ServerIndexLayerProps } from './ServerIndexCogLayer';

/** Angström index (Chandler et al. 1983), computed daily by the Fire Intelligence worker. */
export const AngstromHeatLayer: React.FC<ServerIndexLayerProps> = (props) => <ServerIndexCogLayer type="ANGSTROM" {...props} />;
