export const ESA_WORLDCOVER_CLASSES = [
  { value: 10, label: 'Tree cover', color: '#006400' },
  { value: 20, label: 'Shrubland', color: '#ffbb22' },
  { value: 30, label: 'Grassland', color: '#ffff4c' },
  { value: 40, label: 'Cropland', color: '#f096ff' },
  { value: 50, label: 'Built-up', color: '#fa0000' },
  { value: 60, label: 'Bare / sparse vegetation', color: '#b4b4b4' },
  { value: 70, label: 'Snow and ice', color: '#f0f0f0' },
  { value: 80, label: 'Permanent water bodies', color: '#0064c8' },
  { value: 90, label: 'Herbaceous wetland', color: '#0096a0' },
  { value: 95, label: 'Mangroves', color: '#00cf75' },
  { value: 100, label: 'Moss and lichen', color: '#fae6a0' },
] as const;

export function isEsaWorldCoverLayer(tableName: string, displayName: string): boolean {
  return `${tableName} ${displayName}`.toLowerCase().includes('worldcover');
}
