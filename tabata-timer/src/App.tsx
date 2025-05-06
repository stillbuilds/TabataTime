import { useState, useEffect, useRef } from 'react';
import { TimerPhase, WorkoutProgram } from './types';
import { AUDIO_BEEPS } from './constants';

// Define the spinning tabata program directly in the App.tsx
const spinningTabataProgram: WorkoutProgram = {
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

// Helper function to format time as mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  // Program state
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  
  // Timer state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
  
  // Current segment and interval tracking
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [isWorkPhase, setIsWorkPhase] = useState<boolean>(true);
  const [currentRound, setCurrentRound] = useState<number>(1);
  
  // For interval management
  const timerIntervalRef = useRef<number | null>(null);
  
  // Log for debugging
  const logState = () => {
    console.log({
      currentSegmentIndex,
      isWorkPhase,
      currentRound,
      timeLeft,
      totalTimeElapsed,
      phase
    });
  };
  
  // Find current segment based on segment index
  const getCurrentSegment = () => {
    if (!selectedProgram || currentSegmentIndex >= selectedProgram.segments.length) {
      return null;
    }
    return selectedProgram.segments[currentSegmentIndex];
  };
  
  // Set up the next timing interval
  const setupNextInterval = () => {
    const currentSegment = getCurrentSegment();
    if (!currentSegment) {
      completeWorkout();
      return;
    }
    
    // Play sound for new interval
    playSound('start');
    
    if (currentSegment.isTabata) {
      // The key fix: Explicitly set the time for tabata work/rest phases
      if (isWorkPhase) {
        // Work phase should be exactly 20 seconds (or whatever is specified)
        setTimeLeft(Number(currentSegment.tabataWork) || 20);
        console.log(`Setting work time to ${currentSegment.tabataWork || 20} seconds`);
      } else {
        // Rest phase should be exactly 10 seconds (or whatever is specified)
        setTimeLeft(Number(currentSegment.tabataRest) || 10);
        console.log(`Setting rest time to ${currentSegment.tabataRest || 10} seconds`);
      }
    } else {
      // For non-tabata segments, calculate remaining time
      const segmentDuration = currentSegment.endTime - currentSegment.startTime;
      setTimeLeft(segmentDuration);
      console.log(`Setting non-tabata time to ${segmentDuration} seconds`);
    }
    
    // Log the current state after setup
    logState();
  };
  
  // Handle transition to next interval
  const goToNextInterval = () => {
    const currentSegment = getCurrentSegment();
    if (!currentSegment) {
      completeWorkout();
      return;
    }
    
    if (currentSegment.isTabata) {
      if (isWorkPhase) {
        // Transition from work to rest
        setIsWorkPhase(false);
        setupNextInterval();
      } else {
        // Transition from rest to work (or next segment if we've completed all rounds)
        if (currentRound < 8) {
          // More rounds to go in this tabata set
          setCurrentRound(prevRound => prevRound + 1);
          setIsWorkPhase(true);
          setupNextInterval();
        } else {
          // Completed all 8 rounds, move to next segment
          setCurrentRound(1); // Reset round counter for next tabata segment
          moveToNextSegment();
        }
      }
    } else {
      // Non-tabata segment completed, move to next segment
      moveToNextSegment();
    }
  };
  
  // Move to the next segment
  const moveToNextSegment = () => {
    const nextSegmentIndex = currentSegmentIndex + 1;
    
    if (!selectedProgram || nextSegmentIndex >= selectedProgram.segments.length) {
      completeWorkout();
      return;
    }
    
    setCurrentSegmentIndex(nextSegmentIndex);
    setIsWorkPhase(true); // Start with work phase for tabata segments
    
    // Setup the timer for the next segment
    setCurrentRound(1);
    setupNextInterval();
  };
  
  // Handle workout completion
  const completeWorkout = () => {
    setPhase(TimerPhase.COMPLETED);
    setIsActive(false);
    playSound('end');
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  
  // Reset timer to initial state
  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setIsActive(false);
    setPhase(TimerPhase.IDLE);
    setTotalTimeElapsed(0);
    setCurrentSegmentIndex(0);
    setCurrentRound(1);
    setIsWorkPhase(true);
    
    if (selectedProgram) {
      const firstSegment = selectedProgram.segments[0];
      
      if (firstSegment.isTabata && firstSegment.tabataWork) {
        setTimeLeft(firstSegment.tabataWork);
      } else if (firstSegment.isTabata) {
        setTimeLeft(20); // Default tabata work time
      } else {
        const firstSegmentDuration = firstSegment.endTime - firstSegment.startTime;
        setTimeLeft(firstSegmentDuration);
      }
    }
  };
  
  // Initialize a new workout
  const initializeWorkout = () => {
    if (!selectedProgram) return;
    
    setPhase(TimerPhase.WORK);
    setTotalTimeElapsed(0);
    
    // Start with the first segment
    const firstSegment = selectedProgram.segments[0];
    setCurrentSegmentIndex(0);
    
    if (firstSegment.isTabata) {
      setIsWorkPhase(true);
      setCurrentRound(1);
      setTimeLeft(Number(firstSegment.tabataWork) || 20);
    } else {
      const duration = firstSegment.endTime - firstSegment.startTime;
      setTimeLeft(duration);
    }
    
    // Log initial state
    logState();
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
  
  // Toggle timer (start/pause)
  const toggleTimer = () => {
    if (!selectedProgram) return;
    
    if (isActive) {
      // Pause timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsActive(false);
    } else {
      // Start or resume timer
      setIsActive(true);
      
      if (phase === TimerPhase.IDLE || phase === TimerPhase.COMPLETED) {
        resetTimer();
        initializeWorkout();
      }
      
      // Start interval - critical timing code
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prevTimeLeft => {
          // Play countdown beep for last 3 seconds
          if (prevTimeLeft <= 3 && prevTimeLeft > 0) {
            playSound('countdown');
          }
          
          // Time's up for current interval
          if (prevTimeLeft <= 1) {
            goToNextInterval();
            return 0;
          }
          
          return prevTimeLeft - 1;
        });
        
        setTotalTimeElapsed(prevTotal => {
          const newTotal = prevTotal + 1;
          // Check if workout is complete based on total duration
          if (selectedProgram && newTotal >= selectedProgram.totalDuration) {
            completeWorkout();
            return prevTotal;
          }
          return newTotal;
        });
      }, 1000) as unknown as number;
    }
  };
  
  // Handle program selection
  const handleProgramSelect = () => {
    setSelectedProgram(spinningTabataProgram);
    resetTimer();
  };
  
  // Get phase color based on current state
  const getPhaseColor = (): string => {
    const segment = getCurrentSegment();
    if (!segment) {
      return 'var(--yellow)'; // Default color
    }
    
    if (segment.isTabata) {
      return isWorkPhase ? 'var(--red)' : 'var(--blue)';
    }
    
    // Colors based on segment type
    switch (segment.name) {
      case 'Warm-up':
        return 'var(--yellow)';
      case 'Recovery':
        return 'var(--aqua)';
      case 'Cool Down':
        return 'var(--green)';
      case 'Idle/End':
        return 'var(--purple)';
      default:
        return 'var(--orange)';
    }
  };
  
  // Get phase name for display
  const getPhaseName = (): string => {
    if (phase === TimerPhase.IDLE) return 'Ready';
    if (phase === TimerPhase.COMPLETED) return 'Completed!';
    
    const segment = getCurrentSegment();
    if (!segment) return 'Ready';
    
    if (segment.isTabata) {
      return `${segment.name.toUpperCase()} - ${isWorkPhase ? 'WORK!' : 'REST'}`;
    }
    
    return segment.name.toUpperCase();
  };
  
  // Get additional info for display
  const getPhaseInfo = (): string => {
    const segment = getCurrentSegment();
    if (!segment) return '';
    
    let info = `${segment.type} | ${segment.cadence} RPM | ${segment.resistance} resistance`;
    
    if (segment.isTabata) {
      info += ` | Round ${currentRound}/8`;
    }
    
    return info;
  };
  
  // Calculate timer progress percentage
  const calculateProgress = (): number => {
    if (phase === TimerPhase.IDLE) return 0;
    if (phase === TimerPhase.COMPLETED) return 100;
    
    const segment = getCurrentSegment();
    if (!segment) return 0;
    
    if (segment.isTabata) {
      const totalTime = isWorkPhase ? (segment.tabataWork || 20) : (segment.tabataRest || 10);
      const elapsed = totalTime - timeLeft;
      return (elapsed / totalTime) * 100;
    } else {
      const segmentDuration = segment.endTime - segment.startTime;
      const segmentTimeElapsed = totalTimeElapsed - segment.startTime;
      return (segmentTimeElapsed / segmentDuration) * 100;
    }
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  // Add keyboard shortcut for space bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        toggleTimer();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, phase, selectedProgram]);
  
  // Get progress percentage for the circle
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
              {phase !== TimerPhase.IDLE && phase !== TimerPhase.COMPLETED && getPhaseInfo()}
            </div>
          </div>
        </div>
        
        <div className="controls">
          <button 
            className={isActive ? "warning" : "primary"} 
            onClick={toggleTimer}
            disabled={!selectedProgram}
          >
            {isActive ? 'Pause' : phase === TimerPhase.COMPLETED ? 'Start New' : 'Start'}
          </button>
          <button 
            onClick={resetTimer} 
            disabled={!selectedProgram || phase === TimerPhase.IDLE}
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="settings">
        <div className="settings-title">Program</div>
        <div className="program-selector">
          {selectedProgram ? (
            <div className="selected-program">
              <h3>{selectedProgram.name}</h3>
              <p>{selectedProgram.description}</p>
              <p>Duration: {formatTime(selectedProgram.totalDuration)}</p>
            </div>
          ) : (
            <button 
              className="primary"
              onClick={handleProgramSelect}
              disabled={isActive}
            >
              Select Program
            </button>
          )}
        </div>
        
        {selectedProgram && (
          <div className="workout-progress">
            Total progress: {formatTime(totalTimeElapsed)} / {formatTime(selectedProgram.totalDuration)}
            {currentSegmentIndex > 0 && ` • Segment ${currentSegmentIndex + 1}/${selectedProgram.segments.length}`}
          </div>
        )}
      </div>
      
      <div className="footer">
        Press <kbd>Space</kbd> to start/pause • Broadcast on local network
      </div>
    </div>
  );
};

export default App;
