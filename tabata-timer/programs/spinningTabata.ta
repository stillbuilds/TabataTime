import { WorkoutProgram } from '../types';

const spinningTabata: WorkoutProgram = {
  id: 'spinning-tabata',
  name: 'Spinning Tabata',
  description: 'A high-intensity interval workout on the spin bike',
  totalDuration: 20 * 60, // 20 minutes in seconds
  segments: [
    {
      startTime: 0,
      endTime: 2 * 60,
      name: 'Warm-up',
      type: 'Easy Pedal',
      cadence: '70–80',
      resistance: '3–4',
      notes: 'Seated, light effort',
      isTabata: false
    },
    {
      startTime: 2 * 60,
      endTime: 6 * 60,
      name: 'Tabata Set 1',
      type: 'Seated Sprints',
      cadence: '100–120',
      resistance: '4–5',
      notes: '8x (20s sprint / 10s rest)',
      isTabata: true,
      tabataWork: 20,
      tabataRest: 10
    },
    {
      startTime: 6 * 60,
      endTime: 7 * 60,
      name: 'Recovery',
      type: 'Easy Pedal',
      cadence: '60–70',
      resistance: '2–3',
      notes: 'Light pedal, breathe',
      isTabata: false
    },
    {
      startTime: 7 * 60,
      endTime: 11 * 60,
      name: 'Tabata Set 2',
      type: 'Standing Climbs',
      cadence: '60–70',
      resistance: '7–8',
      notes: '8x (20s climb / 10s rest)',
      isTabata: true,
      tabataWork: 20,
      tabataRest: 10
    },
    {
      startTime: 11 * 60,
      endTime: 12 * 60,
      name: 'Recovery',
      type: 'Easy Pedal',
      cadence: '60–70',
      resistance: '2–3',
      notes: 'Stay seated, hydrate',
      isTabata: false
    },
    {
      startTime: 12 * 60,
      endTime: 16 * 60,
      name: 'Tabata Set 3',
      type: 'Power Sprints',
      cadence: '110–125',
      resistance: '6–7',
      notes: '8x (20s sprint / 10s rest)',
      isTabata: true,
      tabataWork: 20,
      tabataRest: 10
    },
    {
      startTime: 16 * 60,
      endTime: 18 * 60,
      name: 'Cool Down',
      type: 'Light Pedal',
      cadence: '60–70',
      resistance: '2–3',
      notes: 'Gradually reduce effort',
      isTabata: false
    },
    {
      startTime: 18 * 60,
      endTime: 20 * 60,
      name: 'Idle/End',
      type: 'Optional Spinout',
      cadence: '60–70',
      resistance: '1–2',
      notes: 'Completely relaxed',
      isTabata: false
    }
  ]
};

export default spinningTabata;
