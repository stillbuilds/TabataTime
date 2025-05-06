import { useState, useEffect, useRef } from 'react';
import { TimerPhase, WorkoutProgram } from './types';
import { AUDIO_BEEPS } from './constants';
import { getProgram } from '../programs';

// Helper function to format time as mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Enum to track where we are in a tabata segment
enum TabataPhase {
  WORK = 'work',
  REST = 'rest'
}

// Main component
const App: React.FC = () => {
  // Program state
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  
  // Timer state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);
  
  // Segment tracking
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  
  // Tabata-specific state
  const [tabataPhase, setTabataPhase] = useState<TabataPhase>(TabataPhase.WORK);
  const [tabataRound, setTabataRound] = useState<number>(1);
  
  // Refs for timer and cancel handling
  const intervalRef = useRef<number | null>(null);
  
  // Debug logging function
  const logState = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    console.log({
      currentSegmentIndex,
      tabataPhase,
      tabataRound,
      timeLeft,
      totalElapsedTime
    });
  };
  
  // -------- Timer Control Functions ---------
  
  // Start the timer
  const startTimer = () => {
    if (intervalRef.current !== null) return;
    
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        // Play countdown beep for last 3 seconds
        if (prev <= 3 && prev > 0) {
          playSound('countdown');
        }
        
        // If time's up, handle interval completion
        if (prev <= 1) {
          handleIntervalComplete();
          return 0;
        }
        
        return prev - 1;
      });
      
      setTotalElapsedTime(prev => prev + 1);
    }, 1000) as unknown as number;
  };
  
  // Stop the timer
  const stopTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Play sound effects
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
  
  // Get the current segment based on index
  const getCurrentSegment = () => {
    if (!selectedProgram || currentSegmentIndex >= selectedProgram.segments.length) {
      return null;
    }
    return selectedProgram.segments[currentSegmentIndex];
  };
  
  // -------- Interval Management Functions ---------
  
  // Handle completion of a timer interval
  const handleIntervalComplete = () => {
    if (!selectedProgram) return;
    
    const currentSegment = getCurrentSegment();
    if (!currentSegment) return;
    
    // Play sound for interval change
    playSound('start');
    
    if (currentSegment.isTabata) {
      handleTabataIntervalComplete();
    } else {
      handleRegularIntervalComplete();
    }
  };
  
  // Handle completion of a tabata interval (work or rest)
  const handleTabataIntervalComplete = () => {
    const currentSegment = getCurrentSegment();
    if (!currentSegment) return;
    
    logState(`Completing tabata interval: phase=${tabataPhase}, round=${tabataRound}`);
    
    if (tabataPhase === TabataPhase.WORK) {
      // Work phase complete, move to rest
      setTabataPhase(TabataPhase.REST);
      setTimeLeft(currentSegment.tabataRest || 10);
    } else {
      // Rest phase complete
      if (tabataRound < 8) {
        // Move to next round
        setTabataRound(prev => prev + 1);
        setTabataPhase(TabataPhase.WORK);
        setTimeLeft(currentSegment.tabataWork || 20);
      } else {
        // All 8 rounds complete, move to next segment
        goToNextSegment();
      }
    }
  };
  
  // Handle completion of a regular (non-tabata) interval
  const handleRegularIntervalComplete = () => {
    // Regular segment complete, go to next segment
    goToNextSegment();
  };
  
  // Go to the next segment
  const goToNextSegment = () => {
    const nextSegmentIndex = currentSegmentIndex + 1;
    
    if (!selectedProgram || nextSegmentIndex >= selectedProgram.segments.length) {
      completeWorkout();
      return;
    }
    
    logState(`Going to segment ${nextSegmentIndex}`);
    
    // Set up the next segment
    setCurrentSegmentIndex(nextSegmentIndex);
    
    const nextSegment = selectedProgram.segments[nextSegmentIndex];
    
    // Reset tabata state if needed
    if (nextSegment.isTabata) {
      setTabataPhase(TabataPhase.WORK);
      setTabataRound(1);
      setTimeLeft(nextSegment.tabataWork || 20);
    } else {
      const segmentDuration = nextSegment.endTime - nextSegment.startTime;
      setTimeLeft(segmentDuration);
    }
  };
  
  // Complete the entire workout
  const completeWorkout = () => {
    logState('Completing workout');
    
    setPhase(TimerPhase.COMPLETED);
    setIsActive(false);
    playSound('end');
    stopTimer();
  };
  
  // -------- User Interaction Functions ---------
  
  // Toggle between play and pause
  const toggleTimer = () => {
    if (!selectedProgram) return;
    
    if (isActive) {
      // Pause
      stopTimer();
      setIsActive(false);
    } else {
      // Start/resume
      setIsActive(true);
      
      if (phase === TimerPhase.IDLE || phase === TimerPhase.COMPLETED) {
        // Start new workout
        initializeWorkout();
      }
      
      startTimer();
    }
  };
  
  // Reset the timer to initial state
  const resetTimer = () => {
    logState('Resetting timer');
    
    stopTimer();
    setIsActive(false);
    setPhase(TimerPhase.IDLE);
    setTotalElapsedTime(0);
    setCurrentSegmentIndex(0);
    setTabataRound(1);
    setTabataPhase(TabataPhase.WORK);
    
    if (selectedProgram) {
      const firstSegment = selectedProgram.segments[0];
      
      if (firstSegment.isTabata) {
        setTimeLeft(firstSegment.tabataWork || 20);
      } else {
        const firstSegmentDuration = firstSegment.endTime - firstSegment.startTime;
        setTimeLeft(firstSegmentDuration);
      }
    }
  };
  
  // Initialize a new workout
  const initializeWorkout = () => {
    if (!selectedProgram) return;
    
    logState('Initializing workout');
    
    setPhase(TimerPhase.WORK);
    setTotalElapsedTime(0);
    setCurrentSegmentIndex(0);
    setTabataRound(1);
    setTabataPhase(TabataPhase.WORK);
    
    const firstSegment = selectedProgram.segments[0];
    if (firstSegment.isTabata) {
      setTimeLeft(firstSegment.tabataWork || 20);
    } else {
      const duration = firstSegment.endTime - firstSegment.startTime;
      setTimeLeft(duration);
    }
  };
  
  // Handle program selection
  const handleProgramSelect = () => {
    logState('Selecting program: spinning-tabata');
    
    // Use the program from the programs directory
    const spinningProgram = getProgram('spinning-tabata');
    if (spinningProgram) {
      setSelectedProgram(spinningProgram);
      resetTimer();
    } else {
      console.error('Failed to load spinning-tabata program');
    }
  };
  
  // -------- UI Helper Functions ---------
  
  // Get color for current phase
  const getPhaseColor = (): string => {
    const segment = getCurrentSegment();
    if (!segment) {
      return 'var(--yellow)';
    }
    
    if (segment.isTabata) {
      return tabataPhase === TabataPhase.WORK ? 'var(--red)' : 'var(--blue)';
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
  
  // Get name for current phase
  const getPhaseName = (): string => {
    if (phase === TimerPhase.IDLE) return 'Ready';
    if (phase === TimerPhase.COMPLETED) return 'Completed!';
    
    const segment = getCurrentSegment();
    if (!segment) return 'Ready';
    
    if (segment.isTabata) {
      return `${segment.name.toUpperCase()} - ${tabataPhase === TabataPhase.WORK ? 'WORK!' : 'REST'}`;
    }
    
    return segment.name.toUpperCase();
  };
  
  // Get info text for current phase
  const getPhaseInfo = (): string => {
    const segment = getCurrentSegment();
    if (!segment) return '';
    
    let info = `${segment.type} | ${segment.cadence} RPM | ${segment.resistance} resistance`;
    
    if (segment.isTabata) {
      info += ` | Round ${tabataRound}/8`;
    }
    
    return info;
  };
  
  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (phase === TimerPhase.IDLE) return 0;
    if (phase === TimerPhase.COMPLETED) return 100;
    
    const segment = getCurrentSegment();
    if (!segment) return 0;
    
    if (segment.isTabata) {
      const totalTime = tabataPhase === TabataPhase.WORK 
        ? (segment.tabataWork || 20) 
        : (segment.tabataRest || 10);
      const elapsed = totalTime - timeLeft;
      return (elapsed / totalTime) * 100;
    } else {
      const segmentDuration = segment.endTime - segment.startTime;
      const segmentElapsed = totalElapsedTime - segment.startTime;
      return (segmentElapsed / segmentDuration) * 100;
    }
  };
  
  // -------- Effect Hooks ---------
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Set up keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        toggleTimer();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isActive, phase, selectedProgram]);
  
  // -------- Component Render ---------
  
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
            Total progress: {formatTime(totalElapsedTime)} / {formatTime(selectedProgram.totalDuration)}
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
