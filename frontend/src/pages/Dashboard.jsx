import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useRole } from '../RoleContext';
import { generateWeekReportPdf } from '../utils/weekReportPdf';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { labels, roleConfig } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = async () => {
    setPdfLoading(true);
    try {
      const user = await api.auth.me();
      await generateWeekReportPdf(api, user, labels);
    } catch (e) {
      alert('Failed to generate PDF: ' + (e?.message || e));
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <p className="text-muted">Loading metrics…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!data) return null;

  const todayGoal = data.todayGoal ?? 4.25;
  const weekGoal = data.weekGoal ?? 40;

  return (
    <>
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownloadReport}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Generating…' : '📄 Download week report (PDF)'}
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <h3>Today's Hours</h3>
          <p className="stat-value">{data.todayHours} <span className="stat-goal">/ {todayGoal}</span></p>
          <p className="stat-unit">hours (goal: {todayGoal} hrs)</p>
          <Link to="/daily" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Log hours</Link>
        </div>
        <div className="card stat-card">
          <h3>This Week</h3>
          <p className="stat-value">{data.weekHours ?? 0} <span className="stat-goal">/ {weekGoal}</span></p>
          <p className="stat-unit">hours (goal: {weekGoal} hrs/week)</p>
        </div>
        <div className="card stat-card">
          <h3>Total Study Hours</h3>
          <p className="stat-value">{data.totalHours}</p>
          <p className="stat-unit">hours</p>
        </div>
        <div className="card stat-card">
          <h3>Current Streak</h3>
          <p className="stat-value">{data.currentStreak ?? 0}</p>
          <p className="stat-unit">days</p>
          <Link to="/daily" className="btn" style={{ marginTop: '0.75rem' }}>Consistency</Link>
        </div>
        <div className="card stat-card">
          <h3>Longest Streak</h3>
          <p className="stat-value">{data.longestStreak ?? 0}</p>
          <p className="stat-unit">days</p>
        </div>
        <div className="card stat-card">
          <h3>{labels.moduleSyllabus} Coverage</h3>
          <p className="stat-value">{data.coveragePercent}%</p>
          <p className="stat-unit">{data.coveredTopics} / {data.totalTopics} {labels.topic.toLowerCase()}s</p>
          <Link to="/topics" className="btn" style={{ marginTop: '0.75rem' }}>Update</Link>
        </div>
        <div className="card stat-card">
          <h3>Todo Progress</h3>
          <p className="stat-value">{data.completedTodos} / {data.totalTodos}</p>
          <p className="stat-unit">tasks done</p>
          <Link to="/todos" className="btn" style={{ marginTop: '0.75rem' }}>Todo list</Link>
        </div>
      </div>

      <div className="card">
        <h3>{labels.moduleRecords}</h3>
        <p>{labels.recordTypeTest}s: <strong>{data.testsCount}</strong> · {labels.recordTypeMistake}s: <strong>{data.mistakesCount}</strong></p>
        <Link to="/records" className="btn">View {labels.moduleRecords.toLowerCase()}</Link>
      </div>
    </>
  );
}
