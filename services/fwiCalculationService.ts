import { inspectSupplementaryWeather, type SupplementarySettings } from '../lib/fwi/supplementaryCalculations';
import { apiRequest } from './api';
import { MOCK_FORESTS } from '../constants';
import { RegionType } from '../types';
import { calculateCanadianComparison } from '../lib/fwi/compareFwi';
import { calculateBosnianFwi } from '../lib/fwi/bosnianFwi';
import { calculateCanadianFwi, type CanadianFwiWeatherData } from '../lib/fwi/canadianFwi';

export type FwiLocation = { name: string; lat: number; lng: number };
export interface FwiWeather extends CanadianFwiWeatherData {
  daily: { time: string[]; precipitation_sum: Array<number | null> };
}
export interface FwiWeatherResponse {
  data: FwiWeather[]; date: string; source: string; timezone: string; historical: boolean; supplementary_settings?: SupplementarySettings;
}
export const FWI_SAMPLE_LOCATIONS: FwiLocation[] = MOCK_FORESTS
  .filter(forest => forest.type !== RegionType.LANDFILL)
  .map(forest => ({ name: forest.name, lat: forest.coordinates[0], lng: forest.coordinates[1] }));

export function sarajevoDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sarajevo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const cache = new Map<string, { expires: number; request: Promise<FwiWeatherResponse> }>();
export function fetchFwiWeather(locations: FwiLocation[], date: string, inspect = false, refresh = false): Promise<FwiWeatherResponse> {
  const query = new URLSearchParams({ date });
  locations.forEach(location => { query.append('latitude[]', String(location.lat)); query.append('longitude[]', String(location.lng)); });
  const path = `${inspect ? '/admin/fwi/weather' : '/weather/fwi'}?${query}`;
  const cached = cache.get(path);
  if (!refresh && cached && cached.expires > Date.now()) return cached.request;
  const request = apiRequest<FwiWeatherResponse>(path).catch(error => { cache.delete(path); throw error; });
  cache.set(path, { expires: Date.now() + 15 * 60_000, request });
  return request;
}

export function inspectFwiWeather(weather: FwiWeather, response: Pick<FwiWeatherResponse, 'date' | 'historical' | 'supplementary_settings'>) {
  const targetTime = response.historical ? `${response.date}T12:00` : weather.current?.time;
  const index = weather.hourly?.time?.findIndex(time => time.slice(0, 13) === targetTime?.slice(0, 13)) ?? -1;
  if (index < 0) throw new Error('No weather observation is available for this date and hour.');
  const daily = weather.daily;
  // Do not allow absent precipitation to silently become a dry day.
  if (daily.precipitation_sum.some(value => value === null || !Number.isFinite(value))) throw new Error('Daily precipitation inputs are incomplete.');
  const precipitationDays = daily.time.map((date, i) => ({ date, rainMm: daily.precipitation_sum[i]!, dry: daily.precipitation_sum[i]! < 2 }));
  const bosnian = calculateBosnianFwi({
    temperatureC: weather.hourly!.temperature_2m![index],
    humidityPct: weather.hourly!.relative_humidity_2m![index],
    windKmh: weather.hourly!.wind_speed_10m![index],
    dryDays: precipitationDays.filter(day => day.dry).length,
  });
  if (!bosnian) throw new Error('Temperature, humidity or wind inputs are incomplete.');
  const canadian = calculateCanadianFwi(weather, targetTime);
  const previousDay = canadian?.steps.filter(step => step.time.slice(0, 10) < targetTime!.slice(0, 10)).at(-1);
  const rain = weather.hourly?.precipitation?.slice(Math.max(0, index - 23), index + 1);
  const rainMm = rain?.length === 24 && rain.every(value => value != null && Number.isFinite(value) && value >= 0)
    ? rain.reduce((sum, value) => sum + value, 0) : null;
  const comparisonInputs = {
    temperatureC: bosnian.temperatureC, humidityPct: bosnian.humidityPct, windKmh: bosnian.windKmh,
    dryDays: bosnian.dryDays, rainMm, month: Number(targetTime!.slice(5, 7)),
    previousFfmc: previousDay?.ffmc ?? 85, previousDmc: previousDay?.dmc ?? 6, previousDc: previousDay?.dc ?? 15,
  };
  return { supplementaryInputs: inspectSupplementaryWeather(weather, response.date, response.supplementary_settings), bosnian, canadian, currentCanadian: calculateCanadianComparison(comparisonInputs, targetTime!), comparisonInputs, observationTime: targetTime!, precipitationDays };
}

export async function fetchBosnianFwiSurface(date = sarajevoDate()) {
  const response = await fetchFwiWeather(FWI_SAMPLE_LOCATIONS, date);
  return response.data.map((weather, index) => ({
    id: String(index), ...FWI_SAMPLE_LOCATIONS[index],
    ...inspectFwiWeather(weather, response).bosnian,
  }));
}
