import spinningTabata from './spinningTabata';
import { WorkoutProgram } from '../types';

export const programs: WorkoutProgram[] = [
  spinningTabata,
  // Add more programs here as they are created
];

export const getProgram = (id: string): WorkoutProgram | undefined => {
  return programs.find(program => program.id === id);
};
