export interface PredictionResult {
  hiragana: string;
}

export enum AppState {
  IDLE = 'IDLE',
  IMAGE_SELECTED = 'IMAGE_SELECTED',
  ANALYZING = 'ANALYZING',
  RESULT_SHOWN = 'RESULT_SHOWN',
  ERROR = 'ERROR'
}

export interface BearProps {
  expression: 'happy' | 'thinking' | 'waiting' | 'talking';
}
