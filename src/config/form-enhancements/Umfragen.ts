// Auto-generated. Per-entity form-enhancements config for "Umfragen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", {"row": ["orga_vorname", "orga_nachname"], "cols": "1fr 1fr"}, "orga_mail", {"row": ["status", "dauer_min"], "cols": "2fr 1fr"}, "frist", "ort", "gewaehlter_termin", "beschreibung"],
  defaults: {
    'status': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'dauer_min': { kind: 'literal', value: 60 },
    'frist': { kind: 'todayOffset', days: 7, withTime: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
