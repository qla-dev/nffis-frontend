import React, { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { scrapeRs, rsAwsDummyData, RsStation, RsScrapedData } from '../../../../AWSRsData';
import { AWSHoverCard } from './AWSHoverCard';
import { MapLayer } from '../../../../types';
import { awsStationIdentity, fetchAwsStationAdjustments, type AwsStationAdjustment } from '../../../../services/awsStationService';

interface AWSRsLayerProps {
  activeTypes: Set<MapLayer>;
  canAdjust: boolean;
}

function makeIcon(station: RsStation) {
  const color = '#818cf8'; // indigo for RS stations
  const temp = station.tempC !== null ? `${station.tempC}°` : '–';
  const html = `<div style="width:32px;height:32px;border-radius:50%;border:2px solid ${color};background:rgba(2,6,23,0.92);display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}55;cursor:pointer;"><span style="font-size:10px;font-weight:700;color:#fff;font-family:monospace;">${temp}</span></div>`;
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
}

export const AWSRsLayer: React.FC<AWSRsLayerProps> = ({ activeTypes, canAdjust }) => {
  const [data, setData] = useState<RsScrapedData | null>(null);
  const [adjustments, setAdjustments] = useState<AwsStationAdjustment[]>([]);

  // RS stations are all "meteo" type — only show when AWS_METEO is active
  const visible = activeTypes.has('AWS Meteo' as MapLayer);

  useEffect(() => {
    if (!visible) return;
    scrapeRs().then(setData).catch(() => setData(null));
  }, [visible]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAwsStationAdjustments(controller.signal).then(setAdjustments).catch(() => setAdjustments([]));
    return () => controller.abort();
  }, []);

  const adjustmentMap = useMemo(() => new Map(adjustments.map((item) => [awsStationIdentity(item.source, item.station_type, item.station_key), item])), [adjustments]);
  const handleAdjusted = (adjustment: AwsStationAdjustment) => setAdjustments((current) => [...current.filter((item) => item.id !== adjustment.id), adjustment]);

  if (!visible) return null;

  const stations = (data ?? rsAwsDummyData).stations;

  return (
    <>
      {stations.map((sourceStation, i) => {
        const adjustment = adjustmentMap.get(awsStationIdentity('rs', sourceStation.type, sourceStation.name));
        const station = adjustment ? { ...sourceStation, ...adjustment.values } as RsStation : sourceStation;
        return <Marker key={`rs-${station.name}-${i}`} position={[station.lat, station.lon]} icon={makeIcon(station)}>
          <Popup closeButton closeOnClick={false} maxWidth={360} minWidth={280} className="aws-edit-popup">
            <AWSHoverCard station={station} source="rs" canAdjust={canAdjust} adjustment={adjustment} onAdjusted={handleAdjusted} />
          </Popup>
        </Marker>;
      })}
    </>
  );
};
