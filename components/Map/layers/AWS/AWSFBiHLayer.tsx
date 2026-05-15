import React, { useEffect, useState } from 'react';
import { Marker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import {
  scrape,
  allFhmzStations,
  AnyStation,
  ScrapedData,
} from '../../../../AWSFBiHData';
import { AWSHoverCard } from './AWSHoverCard';
import { MapLayer } from '../../../../types';

interface AWSFBiHLayerProps {
  activeTypes: Set<MapLayer>;
}

function typeToKey(s: AnyStation): MapLayer | null {
  if (s.type === 'precipitation') return MapLayer.AWS_PRECIPITATION;
  if (s.type === 'agro') return MapLayer.AWS_AGRO;
  if (s.type === 'meteo') return MapLayer.AWS_METEO;
  return null;
}

// Approximate coordinates for FBiH stations
const COORDS: Record<string, [number, number]> = {
  "Divičani": [44.38, 17.29], "Dobrošin": [43.88, 17.65], "Gornji Kamengrad": [44.80, 16.55],
  "Gračanica kod Bugojna": [44.02, 17.48], "Kupres": [43.99, 17.27], "Pidriš": [43.88, 17.58],
  "Rat": [44.38, 18.06], "Ripač": [44.76, 15.93], "Rovna": [44.07, 17.46],
  "Šeherdžik": [43.91, 17.53], "Voljice-Gaj": [43.93, 17.61], "Sanica": [44.60, 16.63],
  "Budim Potok": [44.20, 17.75], "Ustikolina": [43.58, 18.79], "Sapna": [44.50, 18.99],
  "Snježnica": [44.57, 18.96], "Bijela Voda": [43.94, 18.25], "Bjelašnica-Babin Do": [43.71, 18.28],
  "Sarajevo-Faletići": [43.87, 18.45], "Srednje": [43.98, 18.43], "Vareš": [44.16, 18.32],
  "Vlašić-Babanovac": [44.28, 17.61], "Visoko": [43.98, 18.17], "Tešanj": [44.61, 17.98],
  "Goražde": [43.66, 18.97], "Sarajevo-Butmir": [43.82, 18.33], "Gabela": [43.06, 17.68],
  "Odžak": [45.01, 18.32], "Kalesija": [44.44, 18.87], "Brčko": [44.87, 18.81],
  "G.Vakuf Uskoplje": [43.93, 17.58], "Gračanica": [44.70, 18.30], "Grude": [43.37, 17.41],
  "Kakanj": [44.12, 18.11], "Kiseljak": [43.94, 18.08], "Kladanj": [44.22, 18.69],
  "Maglaj": [44.54, 18.10], "Neum": [42.92, 17.61], "Sarajevo": [43.85, 18.41],
  "Široki Brijeg": [43.38, 17.59], "Travnik": [44.22, 17.66], "Tuzla": [44.53, 18.67],
  "Zenica": [44.20, 17.90], "Žepče": [44.42, 18.03],
};

function getColor(type: string) {
  if (type === 'agro') return '#eab308';
  if (type === 'precipitation') return '#06b6d4';
  return '#10b981'; // meteo / air_quality
}

function makeIcon(station: AnyStation) {
  const color = getColor(station.type);
  const temp = station.tempC !== null ? `${station.tempC}°` : '–';
  const html = `<div style="width:32px;height:32px;border-radius:50%;border:2px solid ${color};background:rgba(2,6,23,0.92);display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}55;cursor:pointer;"><span style="font-size:10px;font-weight:700;color:#fff;font-family:monospace;">${temp}</span></div>`;
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
}

export const AWSFBiHLayer: React.FC<AWSFBiHLayerProps> = ({ activeTypes }) => {
  const [data, setData] = useState<ScrapedData | null>(null);
  const map = useMap();

  useEffect(() => {
    scrape().then(setData).catch(() => setData(null));
  }, []);

  const stations = (data ? data.all : allFhmzStations).filter(s => {
    const key = typeToKey(s);
    return key !== null && activeTypes.has(key);
  });

  return (
    <>
      {stations.map((station, i) => {
        const name = 'city' in station ? station.city : station.station;
        const coords = COORDS[name];
        if (!coords) return null;
        return (
          <Marker
            key={`fbih-${name}-${i}`}
            position={coords}
            icon={makeIcon(station)}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <AWSHoverCard station={station} />
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};
