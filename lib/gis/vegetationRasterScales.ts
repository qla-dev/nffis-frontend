export const VEGETATION_RASTER_SCALES = {
  ndvi: {
    title: 'Vegetation greenness (NDVI)',
    colors: ['#7f1d1d', '#d97706', '#facc15', '#65a30d', '#166534'],
    low: 'Less green',
    high: 'Greener',
    note: 'NDVI is a unitless satellite reflectance ratio, not percent vegetation cover. Higher values indicate a stronger green vegetation signal.',
  },
  ndii: {
    title: 'Vegetation moisture (NDII)',
    colors: ['#9a3412', '#facc15', '#b4d98b', '#39a5a8', '#1e3a8a'],
    low: 'Drier',
    high: 'Moister',
    note: 'NDII is a unitless satellite reflectance ratio, not percent water content. Higher values indicate a stronger vegetation moisture signal.',
  },
  dryness: {
    title: 'Relative vegetation dryness',
    colors: ['#166534', '#a3c957', '#facc15', '#f97316', '#b91c1c'],
    low: 'Less dry',
    high: 'Drier',
    note: 'Dryness = the wet-reference NDII for similarly green vegetation minus the observed NDII (with negative results set to zero). A value of 0.3 means the observed NDII is 0.3 index units below that wet reference. It does not mean 30% moisture loss or 30% fire risk.',
  },
} as const;
