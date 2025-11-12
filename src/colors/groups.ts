export interface ColorGroup {
  name: string;
  description: string;
  keys: string[];
  commonIntents: string[];
}

export type ColorGroups = Record<string, ColorGroup>;

export interface ColorMap {
  [key: string]: string;
}
