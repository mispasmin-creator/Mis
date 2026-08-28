/**
 * Category utility for Non MIS / MIS Report feature.
 * 
 * Column V Mapping Rule:
 * - "MIS Basis"       => MIS Category Report ('MIS')
 * - "Non-MIS Basis"   => Non MIS Category Report ('NonMIS')
 * - anything else     => Other Category Report ('Other')
 */

export const CATEGORY_KEYS = {
  MIS: 'MIS',
  NON_MIS: 'NonMIS',
  OTHER: 'Other',
};

export const CATEGORY_LABELS = [
  { key: CATEGORY_KEYS.MIS, label: 'MIS Category Report', shortLabel: 'MIS' },
  { key: CATEGORY_KEYS.NON_MIS, label: 'Non MIS Category Report', shortLabel: 'Non MIS' },
  { key: CATEGORY_KEYS.OTHER, label: 'Other Category Report', shortLabel: 'Other' },
];

/**
 * Categorize a raw basis / incentive category value from Column V.
 * @param {string|null|undefined} value - Raw Column V value from Google Sheet
 * @returns {'MIS' | 'NonMIS' | 'Other'}
 */
export function categorizeByBasis(value) {
  if (value === null || value === undefined) {
    return CATEGORY_KEYS.OTHER;
  }

  const str = String(value).trim().toLowerCase();

  if (!str) {
    return CATEGORY_KEYS.OTHER;
  }

  // Check for MIS Basis
  if (str === 'mis basis' || str === 'mis') {
    return CATEGORY_KEYS.MIS;
  }

  // Check for Non-MIS Basis (support with or without hyphen/space)
  if (
    str === 'non-mis basis' ||
    str === 'non mis basis' ||
    str === 'non-mis' ||
    str === 'non mis' ||
    str === 'nonmis' ||
    str === 'nonmis basis'
  ) {
    return CATEGORY_KEYS.NON_MIS;
  }

  return CATEGORY_KEYS.OTHER;
}
