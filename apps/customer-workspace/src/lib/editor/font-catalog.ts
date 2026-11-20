import '../../../../designer-studio/shared-screen-font-catalog.js';

type FontCatalog = { choices: (current?: string) => readonly string[] };
export const fontChoices = (globalThis as typeof globalThis & { ACDLFontCatalog: FontCatalog }).ACDLFontCatalog.choices;
