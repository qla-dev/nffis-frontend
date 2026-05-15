import React, { useEffect, useState } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { scrapeRs, rsAwsDummyData, RsStation, RsScrapedData } from '../../../../AWSRsData';
import { AWSHoverCard } from './AWSHoverCard';
import { MapLayer } from '../../../../types';

interface AWSRsLayerProps {
  activeTypes: Set<MapLayer>;
}

function makeIcon(station: RsStation) {
  const color = '#818cf8'; // indigo for RS stations
  const temp = station.tempC !== null ? `${station.tempC}°` : '–';
  const html = `<div style="width:32px;height:32px;border-radius:50%;border:2px solid ${color};background:rgba(2,6,23,0.92);display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}55;cursor:pointer;"><span style="font-size:10px;font-weight:700;color:#fff;font-family:monospace;">${temp}</span></div>`;
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
}

export const AWSRsLayer: React.FC<AWSRsLayerProps> = ({ activeTypes }) => {
  const [data, setData] = useState<RsScrapedData | null>(null);

  // RS stations are all "meteo" type — only show when AWS_METEO is active
  const visible = activeTypes.has(MapLayer.AWS_METEO);

  useEffect(() => {
    if (!visible) return;
    scrapeRs().then(setData).catch(() => setData(null));
  }, [visible]);

  if (!visible) return null;

  const stations = (data ?? rsAwsDummyData).stations;

  return (
    <>
      {stations.map((station, i) => (
        <Marker
          key={`rs-${station.name}-${i}`}
          position={[station.lat, station.lon]}
          icon={makeIcon(station)}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <AWSHoverCard station={station} />
          </Tooltip>
        </Marker>
      ))}
    </>
  );
};
