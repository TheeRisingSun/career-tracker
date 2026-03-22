import { useState, useEffect } from 'react';
import { api } from '../api';
import { useRole } from '../RoleContext';

export default function Routine() {
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const { labels } = useRole();

  useEffect(() => {
    api.routine.get()
      .then(setRoutine)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading {labels.moduleRoutine.toLowerCase()}...</p>;
  if (!routine) return <p className="text-muted">No {labels.moduleRoutine.toLowerCase()} found.</p>;

  return (
    <>
      <h1 className="page-title">{labels.moduleRoutine}</h1>
      <p className="routine-tagline">{routine.tagline}</p>

      {/* Weekly summary */}
      <div className="card routine-summary">
        <h3>📊 Weekly hours</h3>
        <table className="routine-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {(routine.summary || []).map((s, i) => (
              <tr key={i} className={s.isTotal ? 'routine-total' : ''}>
                <td>{s.type}</td>
                <td>{s.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Days */}
      {(routine.days || []).map((day, di) => (
        <div key={di} className="card routine-day">
          <h2 className="routine-day-title">{day.title}</h2>
          <div className="routine-blocks">
            {(day.blocks || []).map((block, bi) => (
              <div key={bi} className={`routine-block routine-block--${bi % 2 === 0 ? 'morning' : 'night'}`}>
                <span className="routine-time">{block.time}</span>
                {block.duration && <span className="routine-duration">{block.duration}</span>}
                <strong className="routine-label">{block.label}</strong>
                {block.rotate && <p className="routine-rotate">{block.rotate}</p>}
                <ul>
                  {(block.points || []).map((p, pi) => <li key={pi}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="routine-day-total">{day.totalLabel}</p>
        </div>
      ))}

      {/* Subject rotation */}
      <div className="card routine-rotation">
        <h3>🔁 Strategy / Rotation</h3>
        <div className="rotation-grid">
          {(routine.rotation || []).map((r, i) => (
            <div key={i} className="rotation-item">
              <span className="rotation-label">{r.label}</span>
              <span className="rotation-value">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Golden rules */}
      <div className="card routine-golden">
        <h3>🧠 Golden rules</h3>
        <ul className="routine-rules">
          {(routine.rules || []).map((rule, i) => <li key={i}>{rule}</li>)}
        </ul>
      </div>
    </>
  );
}
