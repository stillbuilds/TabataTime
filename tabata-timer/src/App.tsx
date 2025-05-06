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
