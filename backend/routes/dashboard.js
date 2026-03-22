import { Router } from 'express';
import { DailyHour, Syllabus, Todo, Record, Link } from '../lib/db.js';
import { getDefaultSyllabus } from '../lib/defaultSyllabus.js';

const router = Router();

const WEEKLY_GOAL = 40;
const WEEKDAY_GOAL = 4.25;
const SATURDAY_GOAL = 10;
const SUNDAY_GOAL = 8;

function getWeekRange(now) {
  const d = new Date(now);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function getTodayGoal(now) {
  const day = new Date(now).getDay();
  if (day === 0) return SUNDAY_GOAL;
  if (day === 6) return SATURDAY_GOAL;
  return WEEKDAY_GOAL;
}

function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function streakFromHours(dailyHours, todayStr) {
  const sorted = [...dailyHours].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i].date;
    const hasHours = Number(sorted[i].hours) > 0;
    if (!hasHours) {
      if (run > 0 && currentStreak === 0) {
        const prev = sorted[i - 1]?.date;
        const diff = prev ? daysBetween(d, prev) : 0;
        if (diff === 1) currentStreak = run;
      }
      run = 0;
      longestStreak = Math.max(longestStreak, run);
      continue;
    }
    run++;
    if (i === 0 && (d === todayStr || daysBetween(todayStr, d) <= 1)) {
      currentStreak = run;
    }
    longestStreak = Math.max(longestStreak, run);
  }
  if (currentStreak === 0 && run > 0 && sorted.length > 0) {
    const last = sorted[0].date;
    if (last === todayStr || daysBetween(todayStr, last) === 1) currentStreak = run;
  }
  return { currentStreak, longestStreak };
}

async function syllabusStats(userId) {
  const doc = await Syllabus.findOne({ userId });
  const syllabus = doc ? doc.data : getDefaultSyllabus();
  let total = 0, completed = 0;
  for (const paper of syllabus.papers || []) {
    for (const section of paper.sections || []) {
      for (const group of section.topicGroups || []) {
        for (const t of group.topics || []) {
          total++;
          if (t.completed) completed++;
        }
      }
    }
  }
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

router.get('/', async (req, res) => {
  const userId = req.user.id;
  const [dailyHours, { total: totalTopics, completed: coveredTopics, percent: coveragePercent }, todos, records, linksCount] = await Promise.all([
    DailyHour.find({ userId }),
    syllabusStats(userId),
    Todo.find({ userId }),
    Record.find({ userId }),
    Link.countDocuments({ userId })
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = dailyHours.find(d => d.date === todayStr);
  const totalHours = dailyHours.reduce((s, d) => s + (Number(d.hours) || 0), 0);
  const { start: weekStart, end: weekEnd } = getWeekRange(new Date());
  const weekHours = dailyHours
    .filter(d => d.date >= weekStart && d.date <= weekEnd)
    .reduce((s, d) => s + (Number(d.hours) || 0), 0);
  const completedTodos = todos.filter(t => t.done).length;
  const totalTodos = todos.length;

  const tests = records.filter(r => r.type === 'test');
  const mistakes = records.filter(r => r.type === 'mistake');
  const { currentStreak, longestStreak } = streakFromHours(dailyHours, todayStr);

  res.json({
    todayHours: todayEntry ? Number(todayEntry.hours) : 0,
    todayGoal: getTodayGoal(new Date()),
    totalHours: Math.round(totalHours * 10) / 10,
    weekHours: Math.round(weekHours * 10) / 10,
    weekGoal: WEEKLY_GOAL,
    coveragePercent,
    totalTopics,
    coveredTopics,
    leftTopics: totalTopics - coveredTopics,
    completedTodos,
    totalTodos,
    currentStreak,
    longestStreak,
    testsCount: tests.length,
    mistakesCount: mistakes.length,
    linksCount
  });
});

export default router;
