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

// New types for workout programs
export interface WorkoutSegment {
  startTime: number;   // start time in seconds
  endTime: number;     // end time in seconds
  name: string;        // segment name (e.g., "Warm-up", "Tabata Set 1")
  type: string;        // activity type (e.g., "Easy Pedal", "Seated Sprints")
  cadence: string;     // cadence range (e.g., "70-80")
  resistance: string;  // resistance range (e.g., "3-4")
  notes: string;       // additional instructions
  isTabata: boolean;   // whether this is a tabata interval
  tabataWork?: number; // work time for tabata intervals (seconds)
  tabataRest?: number; // rest time for tabata intervals (seconds)
}

export interface WorkoutProgram {
  id: string;          // unique identifier
  name: string;        // program name
  description: string; // short description
  totalDuration: number; // total duration in seconds
  segments: WorkoutSegment[]; // array of workout segments
}
