import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekMondaySunday(now) {
  const d = new Date(now);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function formatDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function dateToYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getRowColor(hours, goal, isFuture) {
  if (isFuture) return [240, 240, 245];
  const h = Number(hours) || 0;
  if (h >= goal) return [200, 230, 201];
  if (h >= 1) return [255, 249, 196];
  return [255, 205, 210];
}

function getStatusText(hours, goal, isFuture) {
  if (isFuture) return '—';
  const h = Number(hours) || 0;
  if (h >= goal) return 'Met';
  if (h >= 1) return 'Below';
  return 'Missed';
}

function getGradeFromRatio(actual, goal) {
  if (!goal || goal <= 0) return '—';
  const percent = Math.min(150, Math.round((Number(actual) / goal) * 100));
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 40) return 'D';
  return 'F';
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => v < 10 ? '0' + v : v).join(':');
}

export async function generateWeekReportPdf(api, user, labels) {
  const [hoursList, dashboard, routine, streak, sessions] = await Promise.all([
    api.daily.hours(),
    api.dashboard(),
    api.routine.get(),
    api.daily.streak(),
    api.daily.sessions(),
  ]);

  const hoursByDate = {};
  (hoursList || []).forEach((e) => { hoursByDate[e.date] = e.hours; });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { monday, sunday } = getWeekMondaySunday(today);

  // Dynamically calculate goals from the user's routine
  const weekdayHours = parseFloat((routine.summary || []).find(s => s.type.includes('Weekday'))?.hours) || 4.25;
  const satHours = parseFloat((routine.summary || []).find(s => s.type.includes('Sat'))?.hours) || 10;
  const sunHours = parseFloat((routine.summary || []).find(s => s.type.includes('Sun'))?.hours) || 8;

  const getDayGoal = (d) => {
    if (d === 0) return sunHours;
    if (d === 6) return satHours;
    return weekdayHours;
  };

  const rows = [];
  const rowColors = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ymd = dateToYMD(d);
    const dayGoal = getDayGoal(d.getDay());
    const hours = hoursByDate[ymd] != null ? Number(hoursByDate[ymd]) : null;
    const isFuture = d > today;
    const status = getStatusText(hours != null ? hours : 0, dayGoal, isFuture);
    const grade = isFuture ? '—' : getGradeFromRatio(hours != null ? hours : 0, dayGoal);
    rows.push([DAY_NAMES[d.getDay()], formatDate(d), hours != null ? String(hours) : '—', String(dayGoal), grade, status]);
    rowColors.push(getRowColor(hours != null ? hours : 0, dayGoal, isFuture));
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Personalized Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`${labels.logo} Performance Report`, 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(`Hi, ${user?.name || 'User'}!`, 14, 32);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Tracking Period: ${formatDate(monday)} - ${formatDate(sunday)}`, 14, 40);

  autoTable(doc, {
    startY: 48,
    head: [['Day', 'Date', 'Actual Hours', 'Target', 'Grade', 'Status']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index >= 0 && data.row.index < rowColors.length) {
        data.cell.styles.fillColor = rowColors[data.row.index];
      }
    },
    margin: { left: 14 },
    tableWidth: pageW - 28,
  });

  let finalY = doc.lastAutoTable.finalY + 12;

  // Streak History Section
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Consistency Streak', 14, finalY);
  finalY += 6;
  const streakHistoryRows = (streak?.history || []).slice(0, 5).map(s => [
    `${formatDate(new Date(s.start))} - ${formatDate(new Date(s.end))}`,
    `${s.count} days`
  ]);
  
  autoTable(doc, {
    startY: finalY,
    head: [['Period', 'Length']],
    body: streakHistoryRows.length > 0 ? streakHistoryRows : [['No history', '-']],
    theme: 'plain',
    margin: { left: 14 },
    styles: { fontSize: 9 },
    tableWidth: (pageW - 28) / 2
  });

  // Session Analysis
  const leftTableEnd = doc.lastAutoTable.finalY;
  doc.text('Recent Deep Work Analysis', pageW / 2 + 7, finalY);
  const sessionRows = (sessions || []).slice(-5).reverse().map(s => [
    new Date(s.date).toLocaleDateString(),
    formatTime(s.durationSeconds),
    formatTime(s.wastedSeconds)
  ]);

  autoTable(doc, {
    startY: finalY + 6,
    head: [['Date', 'Active', 'Wasted']],
    body: sessionRows.length > 0 ? sessionRows : [['No sessions', '-', '-']],
    theme: 'plain',
    margin: { left: pageW / 2 + 7 },
    styles: { fontSize: 9 },
    tableWidth: (pageW - 28) / 2
  });

  finalY = Math.max(leftTableEnd, doc.lastAutoTable.finalY) + 12;

  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Core Progress Metrics', 14, finalY);
  finalY += 8;

  const totalWasted = (sessions || []).reduce((sum, s) => sum + (s.wastedSeconds || 0), 0);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  [
    `Active Streak: ${streak?.currentStreak ?? 0} days (Personal Best: ${streak?.longestStreak ?? 0} days)`,
    `Total Time Wasted: ${formatTime(totalWasted)}`,
    `${labels.moduleSyllabus} Coverage: ${dashboard?.coveragePercent ?? 0}%`,
    `Total ${labels.recordTypeTest}s: ${dashboard?.testsCount ?? 0} | Total ${labels.recordTypeMistake}s: ${dashboard?.mistakesCount ?? 0}`,
    `Total ${labels.moduleLinks} Saved: ${dashboard?.linksCount ?? 0}`,
  ].forEach((line) => { doc.text(line, 14, finalY); finalY += 6; });

  const filename = `${user?.name || 'user'}-${labels.logo.replace(/\s+/g, '-')}-Report.pdf`;
  doc.save(filename);
  return filename;
}
