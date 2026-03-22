/**
 * Dynamic grading: percentage or hours vs goal → letter grade.
 */
export function percentToGrade(percent) {
  const p = Number(percent);
  if (p >= 90) return { grade: 'A+', percent: p };
  if (p >= 80) return { grade: 'A', percent: p };
  if (p >= 70) return { grade: 'B+', percent: p };
  if (p >= 60) return { grade: 'B', percent: p };
  if (p >= 50) return { grade: 'C', percent: p };
  if (p >= 40) return { grade: 'D', percent: p };
  return { grade: 'F', percent: isNaN(p) ? 0 : p };
}

export function gradeFromRatio(actual, goal) {
  if (!goal || goal <= 0) return { grade: '—', percent: 0 };
  const percent = Math.min(150, Math.round((Number(actual) / goal) * 100));
  return percentToGrade(percent);
}

export function gradeFromMarks(marks, maxMarks) {
  const m = Number(marks);
  const max = Number(maxMarks);
  if (max <= 0 || isNaN(m)) return null;
  const percent = Math.min(100, Math.round((m / max) * 100));
  return percentToGrade(percent);
}

export function gradeClass(grade) {
  if (!grade || grade === '—') return 'grade-none';
  const g = grade.toUpperCase();
  if (g === 'A+' || g === 'A') return 'grade-a';
  if (g === 'B+' || g === 'B') return 'grade-b';
  if (g === 'C') return 'grade-c';
  if (g === 'D') return 'grade-d';
  return 'grade-f';
}
