// Le 24 key della Camelot wheel. Le "A" sono minori (accento freddo, blu-violetto),
// le "B" sono maggiori (accento caldo, arancio). Ordine numerico da 1 a 12.

export const CAMELOT_KEYS = [
  '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B',
  '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B',
  '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B',
];

export function isMinorKey(key) {
  return typeof key === 'string' && key.endsWith('A');
}

export function isMajorKey(key) {
  return typeof key === 'string' && key.endsWith('B');
}

// Range BPM standard per il selettore (steps di 10)
export const BPM_STEPS = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];
