export enum Locale {
  'fi-FI' = 'fi-FI',
  'en-US' = 'en-US',
  'sv-SE' = 'sv-SE',
  'es-AR' = 'es-AR'
}

export type NameTranslations = {[key in Locale]?: string};
