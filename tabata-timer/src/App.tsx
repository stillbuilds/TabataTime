import { useState, useEffect, useRef, useCallback } from 'react';
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
  // Program and segment tracking
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  
  // Tabata specific states
  const [tabataRound, setTabataRound] = useState<number>(1);
  const [isTabataWorkPhase, setIsTabataWorkPhase] = useState<boolean>(true);
  
  // Timer states
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  
  const intervalRef = useRef<number | null>(null);

  // Get the current segment based on total time elapsed
  const getCurrentSegment = () => {
    if (!selectedProgram) return null;
    
    return selectedProgram.segments.find(segment => 
      totalTimeElapsed >= segment.startTime && totalTimeElapsed < segment.endTime
    ) || null;
  };
  
  // Get current phase color
  const getPhaseColor = (): string => {
    const segment = getCurrentSegment();
    if (!segment) {
      return 'var(--yellow)'; // Default color
    }
    
    if (segment.isTabata) {
      return isTabataWorkPhase ? 'var(--red)' : 'var(--blue)';
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
      return `${segment.name} - ${isTabataWorkPhase ? 'Work!' : 'Rest'}`;
    }
    
    return segment.name;
  };

  // Get additional info for the current phase
  const getPhaseInfo = (): string => {
    const segment = getCurrentSegment();
    if (!segment) return '';
    
    let info = `${segment.type} | ${segment.cadence} RPM | ${segment.resistance} resistance`;
    
    if (segment.isTabata) {
      info += ` | Round ${tabataRound}/8`;
    }
    
    return info;
  };

  // Calculate progress percentage for the current phase or tabata interval
  const calculateProgress = (): number => {
    if (phase === TimerPhase.IDLE) return 0;
    if (phase === TimerPhase.COMPLETED) return 100;
    
    const segment = getCurrentSegment();
    if (!segment) return 0;
    
    if (segment.isTabata) {
      const totalTime = isTabataWorkPhase ? segment.tabataWork! : segment.tabataRest!;
      const elapsed = totalTime - timeLeft;
      return (elapsed / totalTime) * 100;
    } else {
      const segmentDuration = segment.endTime - segment.startTime;
      const segmentElapsed = totalTimeElapsed - segment.startTime;
      return (segmentElapsed / segmentDuration) * 100;
    }
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

  // Handle completion of current interval (work/rest in tabata or regular segment)
  const handleIntervalComplete = useCallback(() => {
    if (!selectedProgram) return;
    
    const segment = getCurrentSegment();
    if (!segment) return;
    
    playSound('start');
    
    if (segment.isTabata) {
      if (isTabataWorkPhase) {
        // Work phase complete, move to rest
        setIsTabataWorkPhase(false);
        setTimeLeft(segment.tabataRest!);
      } else {
        // Rest phase complete
        if (tabataRound < 8) {
          // Move to next tabata round
          setTabataRound(prev => prev + 1);
          setIsTabataWorkPhase(true);
          setTimeLeft(segment.tabataWork!);
        } else {
          // Tabata section complete (8 rounds done), move to next segment
          setTabataRound(1);
          setIsTabataWorkPhase(true);
          
          const nextSegmentIndex = currentSegmentIndex + 1;
          if (nextSegmentIndex < selectedProgram.segments.length) {
            setCurrentSegmentIndex(nextSegmentIndex);
            const nextSegment = selectedProgram.segments[nextSegmentIndex];
            
            if (nextSegment.isTabata) {
              setTimeLeft(nextSegment.tabataWork!);
            } else {
              setTimeLeft(nextSegment.endTime - nextSegment.startTime);
            }
          } else {
            completeWorkout();
          }
        }
      }
    } else {
      // Non-tabata segment complete, move to next segment
      const nextSegmentIndex = currentSegmentIndex + 1;
      
      if (nextSegmentIndex < selectedProgram.segments.length) {
        setCurrentSegmentIndex(nextSegmentIndex);
        const nextSegment = selectedProgram.segments[nextSegmentIndex];
        
        if (nextSegment.isTabata) {
          // Starting a tabata segment
          setTabataRound(1);
          setIsTabataWorkPhase(true);
          setTimeLeft(nextSegment.tabataWork!);
        } else {
          // Regular segment
          setTimeLeft(nextSegment.endTime - nextSegment.startTime);
        }
      } else {
        // Workout complete
        completeWorkout();
      }
    }
  }, [currentSegmentIndex, isTabataWorkPhase, selectedProgram, tabataRound]);

  // Handle timer tick
  const tick = useCallback(() => {
    if (!selectedProgram) return;
    
    setTimeLeft((prevTimeLeft) => {
      // Play countdown beep for last 3 seconds of each phase
      if (prevTimeLeft <= 3 && prevTimeLeft > 0) {
        playSound('countdown');
      }
      
      // If current interval is over
      if (prevTimeLeft <= 1) {
        handleIntervalComplete();
        return 0;
      }
      
      return prevTimeLeft - 1;
    });
    
    setTotalTimeElapsed((prev) => {
      // If workout is complete
      if (prev + 1 >= selectedProgram.totalDuration) {
        completeWorkout();
        return prev;
      }
      return prev + 1;
    });
  }, [handleIntervalComplete, selectedProgram]);

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
  const toggleTimer = useCallback(() => {
    if (!selectedProgram) return;
    
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
        initializeWorkout();
      }
      
      // Start interval
      intervalRef.current = setInterval(tick, 1000) as unknown as number;
    }
  }, [isActive, phase, selectedProgram, tick]);

  // Initialize workout state
  const initializeWorkout = useCallback(() => {
    if (!selectedProgram) return;
    
    setPhase(TimerPhase.WORK);
    setTotalTimeElapsed(0);
    setCurrentSegmentIndex(0);
    
    const firstSegment = selectedProgram.segments[0];
    if (firstSegment.isTabata) {
      setTabataRound(1);
      setIsTabataWorkPhase(true);
      setTimeLeft(firstSegment.tabataWork!);
    } else {
      setTimeLeft(firstSegment.endTime - firstSegment.startTime);
    }
  }, [selectedProgram]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setPhase(TimerPhase.IDLE);
    setTotalTimeElapsed(0);
    setCurrentSegmentIndex(0);
    setTabataRound(1);
    setIsTabataWorkPhase(true);
    
    if (selectedProgram) {
      const firstSegment = selectedProgram.segments[0];
      if (firstSegment.isTabata) {
        setTimeLeft(firstSegment.tabataWork!);
      } else {
        setTimeLeft(firstSegment.endTime - firstSegment.startTime);
      }
    }
  }, [selectedProgram]);

  // Handle program selection
  const handleProgramSelect = () => {
    // Simply set the spinning tabata program directly
    setSelectedProgram(spinningTabataProgram);
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

  // Add keyboard shortcut for space bar to start/pause
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
  }, [toggleTimer]);

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
