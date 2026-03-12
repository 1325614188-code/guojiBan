
export enum AppSection {
  HOME = 'home',
  JADE_APPRAISAL = 'jade-appraisal',
  TRY_ON_CLOTHES = 'try-on-clothes',
  TRY_ON_ACCESSORIES = 'try-on-accessories',
  HAIRSTYLE = 'hairstyle',
  MAKEUP = 'makeup',
  BEAUTY_SCORE = 'beauty-score',
  COUPLE_FACE = 'couple-face',
  TONGUE_DIAGNOSIS = 'tongue-diagnosis',
  FACE_COLOR = 'face-color',
  FACE_READING = 'face-reading',
  FENG_SHUI = 'feng-shui',
  CALENDAR = 'calendar',
  LICENSE_PLATE = 'license-plate',
  MBTI_TEST = 'mbti-test',
  DEPRESSION_TEST = 'depression-test',
  LOVE_FORTUNE = 'love-fortune',
  WEALTH_FORTUNE = 'wealth-fortune'
}

export interface JadeAnalysisResult {
  authenticity: {
    conclusion: string;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  quality: {
    color: string;
    transparency: string;
    texture: string;
    craftsmanship: string;
    overallGrade: string;
  };
  detailedAnalysis: string;
}

export interface AnalysisResult {
  score: number;
  report: string;
  parts?: {
    name: string;
    description: string;
  }[];
}

export interface HairstyleResult {
  name: string;
  imageUrl: string;
}
