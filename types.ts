export interface TranslationResult {
  originalText: string;
  librasGloss: string;
  explanation: string;
  imageUrl?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  TRANSLATING_TEXT = 'TRANSLATING_TEXT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}