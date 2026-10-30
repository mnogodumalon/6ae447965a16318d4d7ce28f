import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Umfragen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    gewaehlter_termin?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    orga_nachname?: string;
    orga_mail?: string;
    status?: LookupValue;
    titel?: string;
    beschreibung?: string;
    ort?: string;
    dauer_min?: number;
    frist?: string; // Format: YYYY-MM-DD oder ISO String
    orga_vorname?: string;
  };
}

export interface Terminvorschlaege {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    start?: string; // Format: YYYY-MM-DD oder ISO String
    umfrage?: RecordUrl; // applookup -> URL zu 'Umfragen' Record
  };
}

export interface Teilnehmer {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    mail?: string;
    token?: string;
    kommentar?: string;
    geantwortet_am?: string; // Format: YYYY-MM-DD oder ISO String
    umfrage?: RecordUrl; // applookup -> URL zu 'Umfragen' Record
  };
}

export interface Antworten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    wert?: LookupValue;
    teilnehmer?: RecordUrl; // applookup -> URL zu 'Teilnehmer' Record
    terminvorschlag?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
  };
}

export const APP_IDS = {
  UMFRAGEN: '6ae4477c663a12c8ca0b4854',
  TERMINVORSCHLAEGE: '6ae44780c21d5e3000bf0883',
  TEILNEHMER: '6ae44781ace92f472d3be778',
  ANTWORTEN: '6ae44781d203daf8c76288ca',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'umfragen': {
    status: [{ key: "offen", get label() { return lookupLabel('umfragen', 'status', "offen") ?? "Offen"; } }, { key: "abgeschlossen", get label() { return lookupLabel('umfragen', 'status', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "abgesagt", get label() { return lookupLabel('umfragen', 'status', "abgesagt") ?? "Abgesagt"; } }],
  },
  'antworten': {
    wert: [{ key: "ja", get label() { return lookupLabel('antworten', 'wert', "ja") ?? "Ja"; } }, { key: "vielleicht", get label() { return lookupLabel('antworten', 'wert', "vielleicht") ?? "Vielleicht"; } }, { key: "nein", get label() { return lookupLabel('antworten', 'wert', "nein") ?? "Nein"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'umfragen': {
    'gewaehlter_termin': 'applookup/select',
    'orga_nachname': 'string/text',
    'orga_mail': 'string/email',
    'status': 'lookup/radio',
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'ort': 'string/text',
    'dauer_min': 'number',
    'frist': 'date/datetimeminute',
    'orga_vorname': 'string/text',
  },
  'terminvorschlaege': {
    'start': 'date/datetimeminute',
    'umfrage': 'applookup/select',
  },
  'teilnehmer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'mail': 'string/email',
    'token': 'string/text',
    'kommentar': 'string/textarea',
    'geantwortet_am': 'date/datetimeminute',
    'umfrage': 'applookup/select',
  },
  'antworten': {
    'wert': 'lookup/radio',
    'teilnehmer': 'applookup/select',
    'terminvorschlag': 'applookup/select',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateUmfragen = StripLookup<Umfragen['fields']>;
export type CreateTerminvorschlaege = StripLookup<Terminvorschlaege['fields']>;
export type CreateTeilnehmer = StripLookup<Teilnehmer['fields']>;
export type CreateAntworten = StripLookup<Antworten['fields']>;