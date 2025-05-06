#!/bin/bash

# Navigate to the tabata-timer directory
cd tabata-timer || { echo "Error: tabata-timer directory not found"; exit 1; }

# package.json
cat > package.json << 'EOF'
{
  "name": "tabata-timer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "start": "vite --host 0.0.0.0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
EOF

# index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/timer.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tabata Timer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
  },
})
EOF

# README.md
cat > README.md << 'EOF'
# Tabata Timer

A simple Tabata interval timer web application with Gruvbox dark theme. Built with TypeScript and React.

## Features

- Easy and Hard difficulty presets
- Visual timer with progress ring
- Sound alerts for interval changes
- Responsive design for all screen sizes
- Broadcasts to local network and Tailscale (accessible from any device)

## Setup and Run

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory

```bash
cd tabata-timer
```

3. Install dependencies

```bash
npm install
```

4. Start the development server (will broadcast to all network interfaces)

```bash
npm run dev
```

5. Access the app:
   - On your computer: http://localhost:5173
   - From other devices on your network: http://YOUR_COMPUTER_IP:5173
   - Via Tailscale: http://YOUR_TAILSCALE_IP:5173

## Audio Files

The application requires three audio files in the `public` directory:

- `beep-short.mp3` - For countdown alerts
- `beep-start.mp3` - For phase changes
- `beep-end.mp3` - For workout completion

If these files are missing, the timer will still work, but without sound alerts.

## Build for Production

```bash
npm run build
```

This creates a `dist` directory with the production build that can be deployed to any static hosting service.

To preview the production build locally (also broadcasts to network):

```bash
npm run preview
```

## Customization

You can customize the workout parameters by modifying the `src/constants.ts` file:

```typescript
export const PRESET_SETTINGS: Record<DifficultyLevel, TabataSettings> = {
  [DifficultyLevel.EASY]: {
    workTime: 20,            // Work interval in seconds
    restTime: 40,            // Rest interval in seconds
    rounds: 8,               // Number of rounds per set
    sets: 2,                 // Number of sets
    restBetweenSets: 60      // Rest time between sets in seconds
  },
  // ...
};
```

## License

MIT
EOF

# src/main.tsx
cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# src/App.tsx
cat > src/App.tsx << 'EOF'
import { useState, useEffect, useRef } from 'react';
import { DifficultyLevel, TabataSettings, TimerPhase } from './types';
import { PRESET_SETTINGS, AUDIO_BEEPS } from './constants';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<TabataSettings>(
    PRESET_SETTINGS[DifficultyLevel.EASY]
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.EASY);
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(false);
  
  const intervalRef = useRef<number | null>(null);

  // Calculate total session duration in seconds
  const calculateTotalSessionTime = (): number => {
    const { workTime, restTime, rounds, sets, restBetweenSets } = settings;
    const roundTime = workTime + restTime;
    const setTime = roundTime * rounds;
    // Total time including rest between sets
    return (setTime * sets) + (restBetweenSets * (sets - 1));
  };

  // Get current phase color
  const getPhaseColor = (): string => {
    switch (phase) {
      case TimerPhase.WORK:
        return 'var(--red)';
      case TimerPhase.REST:
        return 'var(--blue)';
      case TimerPhase.SET_REST:
        return 'var(--aqua)';
      case TimerPhase.COMPLETED:
        return 'var(--green)';
      default:
        return 'var(--yellow)';
    }
  };

  // Get phase name for display
  const getPhaseName = (): string => {
    switch (phase) {
      case TimerPhase.WORK:
        return 'Work!';
      case TimerPhase.REST:
        return 'Rest';
      case TimerPhase.SET_REST:
        return 'Set Break';
      case TimerPhase.COMPLETED:
        return 'Completed!';
      default:
        return 'Ready';
    }
  };

  // Calculate progress percentage for the current phase
  const calculateProgress = (): number => {
    if (phase === TimerPhase.IDLE) return 0;
    if (phase === TimerPhase.COMPLETED) return 100;
    
    let totalTime;
    switch (phase) {
      case TimerPhase.WORK:
        totalTime = settings.workTime;
        break;
      case TimerPhase.REST:
        totalTime = settings.restTime;
        break;
      case TimerPhase.SET_REST:
        totalTime = settings.restBetweenSets;
        break;
      default:
        totalTime = 0;
    }
    
    const elapsed = totalTime - timeLeft;
    return (elapsed / totalTime) * 100;
  };

  // Play sound based on timer state
  const playSound = (soundType: 'countdown' | 'start' | 'end') => {
    try {
      switch (soundType) {
        case 'countdown':
          AUDIO_BEEPS.countdownBeep.play();
          break;
        case 'start':
          AUDIO_BEEPS.startBeep.play();
          break;
        case 'end':
          AUDIO_BEEPS.endBeep.play();
          break;
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  // Handle timer tick
  const tick = () => {
    setTimeLeft((prevTime) => {
      // Play countdown beep for last 3 seconds of each phase
      if (prevTime <= 3 && prevTime > 0) {
        playSound('countdown');
      }
      
      // If time's up, move to next phase
      if (prevTime <= 1) {
        moveToNextPhase();
        return 0;
      }
      
      return prevTime - 1;
    });
  };

  // Move to the next timer phase
  const moveToNextPhase = () => {
    // Play sound for phase change
    playSound('start');
    
    if (phase === TimerPhase.IDLE) {
      // Start with work phase
      setPhase(TimerPhase.WORK);
      setTimeLeft(settings.workTime);
    } else if (phase === TimerPhase.WORK) {
      // Work phase completed, move to rest
      setPhase(TimerPhase.REST);
      setTimeLeft(settings.restTime);
    } else if (phase === TimerPhase.REST) {
      // Rest phase completed
      if (currentRound < settings.rounds) {
        // Move to next round
        setCurrentRound(currentRound + 1);
        setPhase(TimerPhase.WORK);
        setTimeLeft(settings.workTime);
      } else if (currentSet < settings.sets) {
        // Round completed, take longer rest between sets
        setPhase(TimerPhase.SET_REST);
        setTimeLeft(settings.restBetweenSets);
      } else {
        // All sets and rounds completed
        completeWorkout();
      }
    } else if (phase === TimerPhase.SET_REST) {
      // Set rest completed, start next set
      setCurrentSet(currentSet + 1);
      setCurrentRound(1);
      setPhase(TimerPhase.WORK);
      setTimeLeft(settings.workTime);
    }
  };

  // Handle workout completion
  const completeWorkout = () => {
    setPhase(TimerPhase.COMPLETED);
    setIsActive(false);
    playSound('end');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Start or pause the timer
  const toggleTimer = () => {
    if (isActive) {
      // Pause timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
    } else {
      // Start timer
      setIsActive(true);
      if (phase === TimerPhase.IDLE || phase === TimerPhase.COMPLETED) {
        // Reset and start from beginning
        resetTimer();
        moveToNextPhase();
      }
      // Start interval
      intervalRef.current = setInterval(tick, 1000) as unknown as number;
    }
  };

  // Reset the timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setPhase(TimerPhase.IDLE);
    setCurrentRound(1);
    setCurrentSet(1);
    setTimeLeft(settings.workTime);
  };

  // Change difficulty level
  const changeDifficulty = (level: DifficultyLevel) => {
    if (isActive) return; // Don't change settings while timer is running
    
    setDifficulty(level);
    setSettings(PRESET_SETTINGS[level]);
    resetTimer();
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate progress percentage for the progress ring
  const progressPercent = calculateProgress();
  
  return (
    <div className="container">
      <h1>Tabata Timer</h1>
      
      <div className="timer-section">
        <div 
          className="timer-container"
          style={{ 
            '--progress-color': getPhaseColor(),
            '--progress-percent': `${progressPercent}%`
          } as React.CSSProperties}
        >
          <div className="timer-progress"></div>
          <div className="timer-circle">
            <div className="timer-display">{formatTime(timeLeft)}</div>
            <div className="phase-name" style={{ color: getPhaseColor() }}>
              {getPhaseName()}
            </div>
            <div className="round-info">
              {phase !== TimerPhase.IDLE && phase !== TimerPhase.COMPLETED && (
                <>Round {currentRound}/{settings.rounds} • Set {currentSet}/{settings.sets}</>
              )}
            </div>
          </div>
        </div>
        
        <div className="controls">
          <button 
            className={isActive ? "warning" : "primary"} 
            onClick={toggleTimer}
          >
            {isActive ? 'Pause' : phase === TimerPhase.COMPLETED ? 'Start New' : 'Start'}
          </button>
          <button onClick={resetTimer} disabled={phase === TimerPhase.IDLE}>Reset</button>
        </div>
      </div>
      
      <div className="settings">
        <div className="settings-title">Difficulty</div>
        <div className="difficulty-options">
          <button 
            className={`difficulty-btn ${difficulty === DifficultyLevel.EASY ? 'active' : ''}`}
            onClick={() => changeDifficulty(DifficultyLevel.EASY)}
            disabled={isActive}
          >
            Easy (20s/40s)
          </button>
          <button 
            className={`difficulty-btn ${difficulty === DifficultyLevel.HARD ? 'active' : ''}`}
            onClick={() => changeDifficulty(DifficultyLevel.HARD)}
            disabled={isActive}
          >
            Hard (40s/20s)
          </button>
        </div>
        
        <div className="session-info">
          Session duration: {formatTime(calculateTotalSessionTime())}
        </div>
      </div>
      
      <div className="footer">
        Press <kbd>Space</kbd> to start/pause • Broadcast on local network
      </div>
    </div>
  );
};

export default App;
EOF

# src/index.css
cat > src/index.css << 'EOF'
:root {
  /* Gruvbox Dark Theme Colors */
  --bg: #282828;
  --bg-soft: #32302f;
  --bg-hard: #1d2021;
  --fg: #ebdbb2;
  --red: #fb4934;
  --green: #b8bb26;
  --yellow: #fabd2f;
  --blue: #83a598;
  --purple: #d3869b;
  --aqua: #8ec07c;
  --gray: #a89984;
  --orange: #fe8019;

  font-family: system-ui, -apple-system, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color-scheme: dark;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--bg);
  color: var(--fg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#root {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  background-color: var(--bg-soft);
  color: var(--fg);
  border: 1px solid var(--gray);
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s, border-color 0.2s;
}

button:hover {
  background-color: var(--bg-hard);
  border-color: var(--yellow);
}

button:active {
  background-color: var(--bg-hard);
  border-color: var(--orange);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.primary {
  background-color: var(--green);
  color: var(--bg-hard);
  border-color: var(--green);
}

button.primary:hover {
  background-color: var(--yellow);
  border-color: var(--yellow);
}

button.warning {
  background-color: var(--red);
  color: var(--bg-hard);
  border-color: var(--red);
}

button.warning:hover {
  background-color: var(--orange);
  border-color: var(--orange);
}

.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.timer-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.timer-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 2rem auto;
}

.timer-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    var(--progress-color) 0% var(--progress-percent),
    var(--bg-soft) var(--progress-percent) 100%
  );
  transition: background 0.3s;
}

.timer-circle {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border-radius: 50%;
  background-color: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.timer-display {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.phase-name {
  font-size: 1.5rem;
  text-transform: uppercase;
  font-weight: bold;
}

.round-info {
  margin-top: 0.5rem;
  font-size: 1.2rem;
  color: var(--gray);
}

.settings {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-title {
  font-size: 1.2rem;
  color: var(--yellow);
  margin-bottom: 0.5rem;
}

.difficulty-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.difficulty-btn {
  padding: 0.5rem 1rem;
  background-color: var(--bg-soft);
  border: 1px solid var(--gray);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.difficulty-btn.active {
  background-color: var(--aqua);
  color: var(--bg-hard);
  border-color: var(--aqua);
}

.footer {
  margin-top: 2rem;
  color: var(--gray);
  font-size: 0.9rem;
}

/* Make it responsive */
@media (max-width: 600px) {
  .container {
    padding: 1rem;
  }
  
  .timer-container {
    width: 250px;
    height: 250px;
  }
  
  .timer-display {
    font-size: 2.5rem;
  }
  
  .phase-name {
    font-size: 1.2rem;
  }
}
EOF

# src/types.ts
cat > src/types.ts << 'EOF'
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
EOF

# src/constants.ts
cat > src/constants.ts << 'EOF'
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
EOF

# public/timer.svg
cat > public/timer.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ebdbb2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
EOF

# Create simple audio files or placeholder audio files
# These are empty files that allow the app to run without errors
# Ideally, you should replace these with actual audio files
echo "Creating placeholder audio files..."
dd if=/dev/zero of=public/beep-short.mp3 bs=1024 count=1
dd if=/dev/zero of=public/beep-start.mp3 bs=1024 count=1
dd if=/dev/zero of=public/beep-end.mp3 bs=1024 count=1

echo "All files populated successfully!"
echo "Run 'npm install' followed by 'npm run dev' to start the app."
