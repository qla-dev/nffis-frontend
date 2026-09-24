export interface FuelClassHelp {
  code: string;
  family: string;
  name: string;
  meaning: string;
  caution: string;
}

export const BIH_FUEL_CLASS_CATALOGUE: FuelClassHelp[] = [
  { code: 'NB1', family: 'Non-burnable', name: 'Non-burnable', meaning: 'Water, built-up, bare ground, snow or another surface treated as a vegetation-fire barrier.', caution: 'Buildings may still burn; NB1 only means that vegetation spread is not modelled through the cell.' },
  { code: 'GR1', family: 'Short sparse grass', name: 'Short sparse grass', meaning: 'A light grass-fuel proxy used for low-load herbaceous cover.', caution: 'Season and actual curing must be checked locally.' },
  { code: 'GR2', family: 'Low-load grass', name: 'Low-load grass', meaning: 'A provisional proxy for cropland or other managed herbaceous cover.', caution: 'Harvested fields and standing crops can behave very differently.' },
  { code: 'GR4', family: 'Moderate grass', name: 'Moderate grass', meaning: 'A provisional proxy for natural grassland with greater spread potential when dry.', caution: 'It does not contain live field-measured fuel moisture.' },
  { code: 'SH5', family: 'Shrub', name: 'Shrub', meaning: 'A provisional shrub and scrub fuel with potentially vigorous spread.', caution: 'Local shrub height, continuity and species are not yet represented.' },
  { code: 'TU5', family: 'Timber understory', name: 'Timber understory', meaning: 'Tree cover with a substantial provisional understory-fuel assumption.', caution: 'WorldCover does not distinguish local forest species, age or stand structure.' },
];
