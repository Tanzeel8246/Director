
export enum Step {
  PRODUCT_INPUT = 1,
  STYLE_SELECTION = 2,
  AUDIENCE_SELECTION = 3,
  VO_TONE_SELECTION = 4,
  GENERATING = 5,
  RESULT = 6
}

export interface CommercialClip {
  clipNumber: number;
  visualDescription: string;
  visualTextEnglish: string;
  voScriptUrdu: string;
  durationSeconds: number;
  globalSeed: string;
  transition: string;
}

export interface DirectorState {
  productName: string;
  niche: string;
  selectedStyle: string;
  selectedAudience: string;
  selectedTone: string;
  clips: CommercialClip[];
}

export interface DynamicOption {
  id: number;
  label: string;
  description: string;
}
