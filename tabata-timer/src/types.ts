export interface TabataSettings {
  workTime: number;    // work time in seconds
  restTime: number;    // rest time in seconds
  rounds: number;      // number of rounds
  sets: number;        // number of sets
  restBetweenSets: number;  // rest time between sets in seconds
}

export enum TimerPhase {
  IDLE = 'idle',
  WORK = 'work',
  REST = 'rest',
  SET_REST = 'setRest',
  COMPLETED = 'completed'
}

export enum DifficultyLevel {
  EASY = 'easy',
  HARD = 'hard'
}
