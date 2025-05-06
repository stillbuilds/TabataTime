import { DifficultyLevel, TabataSettings } from './types';

export const PRESET_SETTINGS: Record<DifficultyLevel, TabataSettings> = {
  [DifficultyLevel.EASY]: {
    workTime: 20,
    restTime: 40,
    rounds: 8,
    sets: 2,
    restBetweenSets: 60
  },
  [DifficultyLevel.HARD]: {
    workTime: 40,
    restTime: 20,
    rounds: 8,
    sets: 2,
    restBetweenSets: 60
  }
};

export const AUDIO_BEEPS = {
  countdownBeep: new Audio('/beep-short.mp3'),
  startBeep: new Audio('/beep-start.mp3'),
  endBeep: new Audio('/beep-end.mp3')
};
