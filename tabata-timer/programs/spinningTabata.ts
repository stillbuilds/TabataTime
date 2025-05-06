import { WorkoutProgram } from '../src/types';

const spinningTabata: WorkoutProgram = {
  id: 'spinning-tabata',
  name: 'Spinning Tabata',
  description: 'A high-intensity interval workout on the spin bike',
  totalDuration: 20 * 60, // 20 minutes in seconds
  segments: [
    {
      startTime: 0,
      endTime: 30,
      name: 'Get Ready',
      type: 'Prep Position',
      cadence: '—',
      resistance: '—',
      notes: 'Mount bike, adjust position',
      isTabata: false
    },
    {
      startTime: 30,
      endTime: 2 * 60 + 30, // 2:30
      name: 'Warm-up',
      type: 'Easy Pedal',
      cadence: '70–80',
      resistance: '3–4',
      notes: 'Light, seated',
      isTabata: false
    },
    {
      startTime: 2 * 60 + 30, // 2:30
      endTime: 6 * 60 + 30, // 6:30
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
      startTime: 6 * 60 + 30, // 6:30
      endTime: 7 * 60 + 30, // 7:30
      name: 'Recovery',
      type: 'Easy Pedal',
      cadence: '60–70',
      resistance: '2–3',
      notes: 'Light spin',
      isTabata: false
    },
    {
      startTime: 7 * 60 + 30, // 7:30
      endTime: 11 * 60 + 30, // 11:30
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
      startTime: 11 * 60 + 30, // 11:30
      endTime: 12 * 60 + 30, // 12:30
      name: 'Recovery',
      type: 'Easy Pedal',
      cadence: '60–70',
      resistance: '2–3',
      notes: 'Light spin',
      isTabata: false
    },
    {
      startTime: 12 * 60 + 30, // 12:30
      endTime: 16 * 60 + 30, // 16:30
      name: 'Tabata Set 3',
      type: 'Power Sprints',
      cadence: '110–125',
      resistance: '6–7',
      notes: '8x (20s sprint / 10s rest), Power seated or standing',
      isTabata: true,
      tabataWork: 20,
      tabataRest: 10
    },
    {
      startTime: 16 * 60 + 30, // 16:30
      endTime: 18 * 60, // 18:00
      name: 'Cooldown',
      type: 'Light Pedal',
      cadence: '60–70',
      resistance: '2–3',
      notes: 'Gradual effort reduction',
      isTabata: false
    },
    {
      startTime: 18 * 60, // 18:00
      endTime: 20 * 60, // 20:00
      name: 'End Spinout',
      type: 'Very Easy Pedal',
      cadence: '60–70',
      resistance: '1–2',
      notes: 'Completely relaxed',
      isTabata: false
    }
  ]
};

export default spinningTabata;
