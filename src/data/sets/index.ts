// Available sets configuration
export interface SetInfo {
  code: string;
  name: string;
  languages: string[];
}

export const availableSets: SetInfo[] = [
  { code: "1", name: "The First Chapter", languages: ["en", "de", "fr", "it"] },
  { code: "2", name: "Rise of the Floodborn", languages: ["en", "de", "fr", "it"] },
  { code: "3", name: "Into the Inklands", languages: ["en", "de", "fr", "it"] },
  { code: "4", name: "Ursula's Return", languages: ["en", "de", "fr", "it"] },
  { code: "5", name: "Shimmering Skies", languages: ["en", "de", "fr", "it"] },
  { code: "6", name: "Azurite Sea", languages: ["en", "de", "fr", "it"] },
  { code: "7", name: "Archazia's Island", languages: ["en", "de", "fr", "it"] },
  { code: "8", name: "Reign of Jafar", languages: ["en", "de", "fr", "it"] },
  { code: "9", name: "Fabled", languages: ["en", "de", "fr", "it"] },
  { code: "10", name: "Whispers in the Well", languages: ["en", "de", "fr", "it"] },
  { code: "11", name: "Winterspell", languages: ["en"] },
  { code: "12", name: "Wilds Unknown", languages: ["de"] },
  { code: "Q1", name: "Illumineer's Quest: Deep Trouble", languages: ["en", "de", "fr", "it"] },
  { code: "Q2", name: "Illumineer's Quest: Palace Heist", languages: ["en", "de", "fr"] },
];

export const availableLanguages = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
];

// Pre-define all set imports for Vite to bundle correctly
const setLoaders: Record<string, () => Promise<any>> = {
  // English
  'en-1': () => import('./en/set-1.json'),
  'en-2': () => import('./en/set-2.json'),
  'en-3': () => import('./en/set-3.json'),
  'en-4': () => import('./en/set-4.json'),
  'en-5': () => import('./en/set-5.json'),
  'en-6': () => import('./en/set-6.json'),
  'en-7': () => import('./en/set-7.json'),
  'en-8': () => import('./en/set-8.json'),
  'en-9': () => import('./en/set-9.json'),
  'en-10': () => import('./en/set-10.json'),
  'en-11': () => import('./en/set-11.json'),
  'en-Q1': () => import('./en/set-Q1.json'),
  'en-Q2': () => import('./en/set-Q2.json'),
  // German
  'de-1': () => import('./de/set-1.json'),
  'de-2': () => import('./de/set-2.json'),
  'de-3': () => import('./de/set-3.json'),
  'de-4': () => import('./de/set-4.json'),
  'de-5': () => import('./de/set-5.json'),
  'de-6': () => import('./de/set-6.json'),
  'de-7': () => import('./de/set-7.json'),
  'de-8': () => import('./de/set-8.json'),
  'de-9': () => import('./de/set-9.json'),
  'de-10': () => import('./de/set-10.json'),
  'de-12': () => import('./de/set-12.json'),
  'de-Q1': () => import('./de/set-Q1.json'),
  'de-Q2': () => import('./de/set-Q2.json'),
  // French
  'fr-1': () => import('./fr/set-1.json'),
  'fr-2': () => import('./fr/set-2.json'),
  'fr-3': () => import('./fr/set-3.json'),
  'fr-4': () => import('./fr/set-4.json'),
  'fr-5': () => import('./fr/set-5.json'),
  'fr-6': () => import('./fr/set-6.json'),
  'fr-7': () => import('./fr/set-7.json'),
  'fr-8': () => import('./fr/set-8.json'),
  'fr-9': () => import('./fr/set-9.json'),
  'fr-10': () => import('./fr/set-10.json'),
  'fr-Q1': () => import('./fr/set-Q1.json'),
  'fr-Q2': () => import('./fr/set-Q2.json'),
  // Italian
  'it-1': () => import('./it/set-1.json'),
  'it-2': () => import('./it/set-2.json'),
  'it-3': () => import('./it/set-3.json'),
  'it-4': () => import('./it/set-4.json'),
  'it-5': () => import('./it/set-5.json'),
  'it-6': () => import('./it/set-6.json'),
  'it-7': () => import('./it/set-7.json'),
  'it-8': () => import('./it/set-8.json'),
  'it-9': () => import('./it/set-9.json'),
  'it-10': () => import('./it/set-10.json'),
  'it-Q1': () => import('./it/set-Q1.json'),
};

export async function loadSetData(setCode: string, language: string): Promise<any> {
  const key = `${language}-${setCode}`;
  const loader = setLoaders[key];
  
  if (!loader) {
    throw new Error(`Set ${setCode} not available in ${language}`);
  }
  
  const module = await loader();
  return module.default || module;
}
