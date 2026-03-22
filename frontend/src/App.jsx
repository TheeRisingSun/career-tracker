import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useTimer } from './TimerContext';
import { useRole } from './RoleContext';
import { api } from './api';
import Dashboard from './pages/Dashboard';
import Todos from './pages/Todos';
import Daily from './pages/Daily';
import Topics from './pages/Topics';
import Records from './pages/Records';
import Routine from './pages/Routine';
import Notes from './pages/Notes';
import Links from './pages/Links';
import Whiteboards from './pages/Whiteboards';
import RoadmapView from './pages/RoadmapView';
import Login from './pages/Login';
import './App.css';

function App() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const { time, startTime, isRunning } = useTimer();
  const { roleConfig, labels, loading: roleLoading } = useRole();
  
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => v < 10 ? '0' + v : v).join(':');
  };

  if (!isAuthenticated && location.pathname !== '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  if (roleLoading) {
    return <div className="loading-screen">Loading Configuration...</div>;
  }

  return (
    <div className="app" data-sidebar-collapsed={sidebarCollapsed} data-theme={theme}>
      <aside className="sidebar">
        <div className="sidebar-header">
          {!sidebarCollapsed && <h1 className="logo">{labels.logo}</h1>}
          <button 
            className="sidebar-collapse-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {startTime && (
          <div className={`sidebar-timer ${isRunning ? 'active' : 'paused'}`}>
            <div className="timer-dot"></div>
            {!sidebarCollapsed && <span className="timer-val">{formatTime(time)}</span>}
          </div>
        )}
        
        <nav className="sidebar-nav">
          <NavLink title="Dashboard" to="/" end>{sidebarCollapsed ? '🏠' : <span>Dashboard</span>}</NavLink>
          <NavLink title="Todo" to="/todos">{sidebarCollapsed ? '✅' : <span>Todo</span>}</NavLink>
          <NavLink title="Streak & Hours" to="/daily">{sidebarCollapsed ? '🔥' : <span>Streak & Hours</span>}</NavLink>
          <NavLink title={labels.moduleSyllabus} to="/topics">{sidebarCollapsed ? '📚' : <span>{labels.moduleSyllabus}</span>}</NavLink>
          <NavLink title="Reference Map" to="/roadmap-ref">{sidebarCollapsed ? '🗺️' : <span>{labels.moduleSyllabus} Map</span>}</NavLink>
          <NavLink title={labels.moduleRoutine} to="/routine">{sidebarCollapsed ? '⏰' : <span>{labels.moduleRoutine}</span>}</NavLink>
          <NavLink title={labels.moduleRecords} to="/records">{sidebarCollapsed ? '📊' : <span>{labels.moduleRecords}</span>}</NavLink>
          <NavLink title={labels.moduleNotes} to="/notes">{sidebarCollapsed ? '📝' : <span>{labels.moduleNotes}</span>}</NavLink>
          <NavLink title={labels.moduleLinks} to="/links">{sidebarCollapsed ? '🔗' : <span>{labels.moduleLinks}</span>}</NavLink>
          <NavLink title={labels.moduleWhiteboards} to="/whiteboards">{sidebarCollapsed ? '🎨' : <span>{labels.moduleWhiteboards}</span>}</NavLink>
        </nav>

        <div className="sidebar-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
            {!sidebarCollapsed && <span style={{ marginLeft: '10px' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
          <button className="theme-toggle-btn" onClick={() => api.auth.logout()} title="Logout" style={{ marginTop: '10px', color: '#ff4d4d' }}>
            {sidebarCollapsed ? '🚪' : 'Logout'}
            {!sidebarCollapsed && <span style={{ marginLeft: '10px' }}>Sign Out</span>}
          </button>
        </div>
        
        {!sidebarCollapsed && <p className="sidebar-footer">Database: MongoDB ({roleConfig?.role?.toUpperCase() || '...' })</p>}
      </aside>

      <main className="main" key={location.pathname}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/roadmap-ref" element={<RoadmapView />} />
          <Route path="/routine" element={<Routine />} />
          <Route path="/records" element={<Records />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/links" element={<Links />} />
          <Route path="/whiteboards" element={<Whiteboards />} />
          <Route path="/whiteboards/new" element={<Whiteboards isStandaloneEditor={true} globalTheme={theme} />} />
          <Route path="/whiteboards/:id" element={<Whiteboards isStandaloneEditor={true} globalTheme={theme} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
