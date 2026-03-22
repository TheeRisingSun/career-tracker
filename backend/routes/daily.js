import { Router } from 'express';
import { DailyHour, StudySession } from '../lib/db.js';
import { isValidDateStr } from '../middleware/validate.js';

const router = Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

// HOURS API
router.get('/hours', async (req, res) => {
  const data = await DailyHour.find({ userId: req.user.id }).sort({ date: 1 });
  res.json(data);
});

router.post('/hours', async (req, res) => {
  const date = req.body?.date ?? today();
  if (!isValidDateStr(date)) {
    return res.status(400).json({ error: 'Invalid date; use YYYY-MM-DD' });
  }
  const numHours = Math.min(24, Math.max(0, Number(req.body?.hours) || 0));
  
  const entry = await DailyHour.findOneAndUpdate(
    { userId: req.user.id, date },
    { hours: numHours },
    { upsert: true, new: true }
  );
  
  res.json(entry);
});

// STREAK API
router.get('/streak', async (req, res) => {
  const data = await DailyHour.find({ userId: req.user.id, hours: { $gt: 0 } }).sort({ date: 1 });
  
  if (data.length === 0) {
    return res.json({ currentStreak: 0, longestStreak: 0, history: [] });
  }

  const streaks = [];
  let currentRun = [data[0].date];

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].date;
    const curr = data[i].date;
    if (daysBetween(prev, curr) === 1) {
      currentRun.push(curr);
    } else {
      streaks.push({
        start: currentRun[0],
        end: currentRun[currentRun.length - 1],
        count: currentRun.length
      });
      currentRun = [curr];
    }
  }
  streaks.push({
    start: currentRun[0],
    end: currentRun[currentRun.length - 1],
    count: currentRun.length
  });

  const lastEntry = data[data.length - 1].date;
  const t = today();
  const isActive = lastEntry === t || daysBetween(t, lastEntry) === 1;
  
  const currentStreak = isActive ? currentRun.length : 0;
  const longestStreak = Math.max(...streaks.map(s => s.count), 0);

  res.json({
    currentStreak,
    longestStreak,
    history: streaks.reverse(), // Newest streaks first
    lastStudyDate: lastEntry
  });
});

// SESSIONS API (Stopwatch & Wasted Time)
router.get('/sessions', async (req, res) => {
  const data = await StudySession.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(data.map(s => ({
    id: s._id,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    durationSeconds: s.durationSeconds,
    wastedSeconds: s.wastedSeconds,
    pauses: s.pauses,
    note: s.note,
    breakCount: s.breakCount,
    maxContinuousSitting: s.maxContinuousSitting,
    metadata: s.metadata,
    createdAt: s.createdAt
  })));
});

router.post('/sessions', async (req, res) => {
  const pauses = req.body.pauses || [];
  const breakCount = pauses.length;

  let maxContinuousSitting = 0;
  const startTs = new Date(req.body.startTime).getTime();
  const endTs = new Date(req.body.endTime).getTime();

  if (!isNaN(startTs) && !isNaN(endTs)) {
    if (pauses.length === 0) {
      maxContinuousSitting = Math.max(0, Math.floor((endTs - startTs) / 1000));
    } else {
      let currentStart = startTs;
      let maxSittingMs = 0;

      for (const p of pauses) {
        const pStart = new Date(p.start).getTime();
        const pEnd = new Date(p.end).getTime();
        
        const sittingMs = pStart - currentStart;
        if (sittingMs > maxSittingMs) maxSittingMs = sittingMs;
        
        currentStart = pEnd;
      }

      const finalSittingMs = endTs - currentStart;
      if (finalSittingMs > maxSittingMs) maxSittingMs = finalSittingMs;

      maxContinuousSitting = Math.max(0, Math.floor(maxSittingMs / 1000));
    }
  }

  const sessionData = {
    userId: req.user.id,
    date: today(),
    startTime: req.body.startTime, // ISO
    endTime: req.body.endTime,     // ISO
    durationSeconds: req.body.durationSeconds,
    wastedSeconds: req.body.wastedSeconds || 0,
    pauses: pauses, // [{start, end, reason}]
    note: req.body.note || '',
    breakCount,
    maxContinuousSitting,
    metadata: req.body.metadata || {} // Custom JSON format payload
  };
  
  const session = await StudySession.create(sessionData);

  // Automatically update daily hours
  const date = session.date;
  const hoursToAdd = session.durationSeconds / 3600;
  
  await DailyHour.findOneAndUpdate(
    { userId: req.user.id, date },
    { $inc: { hours: Number(hoursToAdd.toFixed(2)) } },
    { upsert: true, new: true }
  );

  res.status(201).json({
    id: session._id,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    durationSeconds: session.durationSeconds,
    wastedSeconds: session.wastedSeconds,
    pauses: session.pauses,
    note: session.note,
    breakCount: session.breakCount,
    maxContinuousSitting: session.maxContinuousSitting,
    metadata: session.metadata,
    createdAt: session.createdAt
  });
});

export default router;
