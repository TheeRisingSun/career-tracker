import { useState, useEffect } from 'react';
import { api } from '../api';
import { useRole } from '../RoleContext';

export default function Records() {
  const { labels, roleConfig } = useRole();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'test', title: '', description: '', marks: '', maxMarks: '', subject: '', date: new Date().toISOString().slice(0, 10) });

  const load = () => api.records.list().then(setList).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const submit = (e) => {
    e.preventDefault();
    api.records.add({
      type: form.type,
      title: form.title,
      description: form.description,
      marks: form.marks ? parseFloat(form.marks) : null,
      maxMarks: form.maxMarks ? parseFloat(form.maxMarks) : null,
      subject: form.subject,
      date: form.date,
    }).then(() => {
      setForm({ type: 'test', title: '', description: '', marks: '', maxMarks: '', subject: '', date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      load();
    });
  };

  const remove = (id) => {
    if (confirm('Delete this record?')) api.records.remove(id).then(load);
  };

  if (loading) return <p className="text-muted">Loading…</p>;

  const tests = list.filter((r) => r.type === 'test');
  const mistakes = list.filter((r) => r.type === 'mistake');

  return (
    <>
      <h1 className="page-title">{labels.moduleRecords}</h1>
      <p className="text-muted">Track your performance and areas for improvement.</p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Add record</h3>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={submit} className="records-form">
            <div className="form-row">
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="test">{labels.recordTypeTest}</option>
                <option value="mistake">{labels.recordTypeMistake}</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={`e.g. ${labels.recordTypeTest} 1`} required />
            </div>
            <div className="form-row">
              <label className="label">Description (optional)</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Additional details" />
            </div>
            {form.type === 'test' && (
              <div className="form-row two-cols">
                <div>
                  <label className="label">{labels.recordScore}</label>
                  <input type="number" step="any" className="input" value={form.marks} onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))} placeholder="Value" />
                </div>
                <div>
                  <label className="label">{labels.recordMax}</label>
                  <input type="number" step="any" className="input" value={form.maxMarks} onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))} placeholder="Target/Total" />
                </div>
              </div>
            )}
            <div className="form-row two-cols">
              <div>
                <label className="label">{labels.subject}</label>
                <input className="input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder={`e.g. ${labels.subject}`} />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        )}
      </div>

      <div className="card">
        <h3>{labels.recordTypeTest}s</h3>
        <ul className="records-list">
          {tests.length === 0 && <p className="text-muted">No {labels.recordTypeTest.toLowerCase()}s recorded.</p>}
          {tests.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.title}</strong>
                {r.marks != null && r.maxMarks != null && <span className="marks"> {r.marks} / {r.maxMarks}</span>}
                {r.subject && <span className="subject"> · {r.subject}</span>}
                <span className="date"> · {r.date}</span>
              </div>
              {r.description && <p className="record-desc">{r.description}</p>}
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>{labels.recordTypeMistake}s</h3>
        <ul className="records-list">
          {mistakes.length === 0 && <p className="text-muted">No {labels.recordTypeMistake.toLowerCase()}s recorded.</p>}
          {mistakes.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.title}</strong>
                {r.subject && <span className="subject"> · {r.subject}</span>}
                <span className="date"> · {r.date}</span>
              </div>
              {r.description && <p className="record-desc">{r.description}</p>}
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
