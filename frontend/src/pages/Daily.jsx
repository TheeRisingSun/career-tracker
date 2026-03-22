import { useState, useEffect } from 'react';
import { api } from '../api';
import { useTimer } from '../TimerContext';

export default function Daily() {
  const [hours, setHours] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, history: [] });
  const [sessions, setSessions] = useState([]);
  
  const { 
    time, isRunning, startTime, pauses, currentPauseStart, wastedTime,
    startTimer, pauseTimer, resumeTimer, stopTimer 
  } = useTimer();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.daily.hours().then(setHours);
    api.daily.streak().then(setStreak);
    api.daily.sessions().then(setSessions);
  };

  const handleResumeClick = () => {
    const reason = window.prompt('Why did you stop? (e.g. Phone, Break, Distraction)');
    resumeTimer(reason);
  };

  const handleStopClick = async () => {
    if (!window.confirm('Stop and save this session?')) return;
    const res = await stopTimer();
    if (res.success) {
      loadData();
    } else {
      alert('Error saving session: ' + res.error);
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => v < 10 ? '0' + v : v).join(':');
  };

  return (
    <>
      <h1 className="page-title">Streaks & Hours</h1>

      <div className="layout-two-column">
        <div>
          {/* DIGITAL STOPWATCH */}
          <div className="card stopwatch-card">
            <h3>Digital Study Timer</h3>
            <div className="stopwatch-display">
              {formatTime(time)}
            </div>
            <div className="stopwatch-wasted">
              Wasted: {formatTime(wastedTime)}
            </div>
            <div className="stopwatch-actions">
              {!startTime && (
                <button className="btn btn-primary btn-lg" onClick={startTimer}>START SESSION</button>
              )}
              {startTime && isRunning && !currentPauseStart && (
                <button className="btn btn-warn btn-lg" onClick={pauseTimer}>PAUSE</button>
              )}
              {currentPauseStart && (
                <button className="btn btn-primary btn-lg" onClick={handleResumeClick}>RESUME</button>
              )}
              {startTime && (
                <button className="btn btn-danger btn-lg" onClick={handleStopClick}>STOP & SAVE</button>
              )}
            </div>
            {pauses.length > 0 && (
              <div className="pauses-list">
                <h4>Interruptions</h4>
                {pauses.map((p, i) => (
                  <div key={i} className="pause-item">
                    <span>{p.reason}</span>
                    <span className="text-danger">+{Math.round((new Date(p.end) - new Date(p.start))/1000)}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Recent Sessions</h3>
            <div className="sessions-list">
              {sessions.slice(-5).reverse().map(s => (
                <div key={s.id} className="session-row">
                  <div>
                    <div className="text-strong">{new Date(s.date).toLocaleDateString()}</div>
                    <div className="text-muted small">{new Date(s.startTime).toLocaleTimeString()} - {new Date(s.endTime).toLocaleTimeString()}</div>
                    {s.maxContinuousSitting > 0 && (
                      <div className="text-muted small">Max Sitting: {formatTime(s.maxContinuousSitting)} | Breaks: {s.breakCount || 0}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-success">{formatTime(s.durationSeconds)}</div>
                    {s.wastedSeconds > 0 && <div className="text-danger small">Wasted: {formatTime(s.wastedSeconds)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card streak-card">
            <div className="streak-stats">
              <div className="streak-stat">
                <span className="stat-label">Current Streak</span>
                <span className="stat-value">{streak.currentStreak} days</span>
              </div>
              <div className="streak-stat">
                <span className="stat-label">Longest Streak</span>
                <span className="stat-value">{streak.longestStreak} days</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Streak History</h3>
            <div className="streak-history">
              {streak.history.length === 0 && <p className="text-muted">No streaks recorded yet.</p>}
              {streak.history.map((s, i) => {
                const startDate = new Date(s.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const endDate = new Date(s.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const range = s.count === 1 ? startDate : `${startDate} - ${endDate}`;
                
                return (
                  <div key={i} className="streak-history-chip" title={`${s.count} days: ${range}`}>
                    <span className="streak-chip-count">{s.count}d</span>
                    <span className="streak-chip-range">{range}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3>Daily Hours</h3>
            <div className="hours-list">
              {hours.slice(-7).reverse().map((h) => (
                <div key={h.date} className="hours-row">
                  <span>{h.date}</span>
                  <span className="text-strong">{h.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
