export type ScreenType =
  | 'home'
  | 'alerts'
  | 'shelters'
  | 'hazard'
  | 'checklist'
  | 'actions'
  | 'family'
  | 'quiz';

export interface EarthquakeData {
  time: string;
  area: string;
  city?: string;
  rawArea?: string;
  intensity: string;
  magnitude: string;
  warning: string;
}

export interface TsunamiData {
  status: string;
  area: string;
  warning: string;
}

export interface WeatherWarningItem {
  name: string;
  code: string;
  status: string;
}

export interface WeatherData {
  status: string;
  area: string;
  warning: string;
  headline?: string;
  details: WeatherWarningItem[];
}

export interface QuizQuestion {
  question: string;
  answers: string[];
  correct: number;
}
