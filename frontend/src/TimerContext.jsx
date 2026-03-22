import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from './api';

const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); 
  const [startTime, setStartTime] = useState(localStorage.getItem('timer_startTime') || null);
  const [pauses, setPauses] = useState(JSON.parse(localStorage.getItem('timer_pauses') || '[]'));
  const [currentPauseStart, setCurrentPauseStart] = useState(localStorage.getItem('timer_currentPauseStart') || null);
  const [wastedTime, setWastedTime] = useState(Number(localStorage.getItem('timer_wastedTime') || 0));
  
  const timerRef = useRef(null);

  // Sync state to localStorage
  useEffect(() => {
    if (startTime) localStorage.setItem('timer_startTime', startTime);
    else localStorage.removeItem('timer_startTime');
    
    localStorage.setItem('timer_pauses', JSON.stringify(pauses));
    
    if (currentPauseStart) localStorage.setItem('timer_currentPauseStart', currentPauseStart);
    else localStorage.removeItem('timer_currentPauseStart');
    
    localStorage.setItem('timer_wastedTime', wastedTime.toString());
    localStorage.setItem('timer_isRunning', isRunning.toString());
  }, [startTime, pauses, currentPauseStart, wastedTime, isRunning]);

  // Initial Rehydration and Background Sync
  useEffect(() => {
    const wasRunning = localStorage.getItem('timer_isRunning') === 'true';
    if (wasRunning && startTime) {
      setIsRunning(true);
    }
  }, []);

  useEffect(() => {
    if (isRunning && !currentPauseStart) {
      timerRef.current = setInterval(() => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        
        // Subtract total pause durations from elapsed time
        const totalPausedMs = pauses.reduce((acc, p) => acc + (new Date(p.end).getTime() - new Date(p.start).getTime()), 0);
        
        const elapsedSeconds = Math.floor((now - start - totalPausedMs) / 1000);
        setTime(elapsedSeconds > 0 ? elapsedSeconds : 0);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      // Even if not "running" (paused), we might need to show the last recorded time
      if (startTime) {
        const start = new Date(startTime).getTime();
        const refTime = currentPauseStart ? new Date(currentPauseStart).getTime() : new Date().getTime();
        const totalPausedMs = pauses.reduce((acc, p) => acc + (new Date(p.end).getTime() - new Date(p.start).getTime()), 0);
        const elapsedSeconds = Math.floor((refTime - start - totalPausedMs) / 1000);
        setTime(elapsedSeconds > 0 ? elapsedSeconds : 0);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, startTime, pauses, currentPauseStart]);

  const startTimer = () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setIsRunning(true);
    setPauses([]);
    setWastedTime(0);
    setTime(0);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setCurrentPauseStart(new Date().toISOString());
  };

  const resumeTimer = (reason) => {
    const now = new Date().toISOString();
    const pauseDuration = Math.round((new Date(now) - new Date(currentPauseStart)) / 1000);
    
    setPauses(prev => [...prev, { 
      start: currentPauseStart, 
      end: now, 
      reason: reason || 'Unknown' 
    }]);
    setWastedTime(prev => prev + pauseDuration);
    setIsRunning(true);
    setCurrentPauseStart(null);
  };

  const stopTimer = async () => {
    const endTime = new Date().toISOString();
    const finalData = {
      startTime,
      endTime,
      durationSeconds: time,
      wastedSeconds: wastedTime,
      pauses,
      metadata: {
        device: navigator.userAgent,
        savedAt: new Date().toISOString()
      }
    };

    try {
      await api.daily.logSession(finalData);
      resetTimer();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setStartTime(null);
    setPauses([]);
    setCurrentPauseStart(null);
    setWastedTime(0);
    setTime(0);
    localStorage.removeItem('timer_startTime');
    localStorage.removeItem('timer_pauses');
    localStorage.removeItem('timer_currentPauseStart');
    localStorage.removeItem('timer_wastedTime');
    localStorage.setItem('timer_isRunning', 'false');
  };

  return (
    <TimerContext.Provider value={{
      time, isRunning, startTime, pauses, currentPauseStart, wastedTime,
      startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
