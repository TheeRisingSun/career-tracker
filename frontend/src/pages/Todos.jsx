import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Todos() {
  const [list, setList] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.todos.list().then(setList).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const add = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    api.todos.add(text).then(() => load());
  };

  const toggle = (id, done) => {
    api.todos.update(id, { done: !done }).then(() => load());
  };

  const remove = (id) => {
    api.todos.remove(id).then(() => load());
  };

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <>
      <h1 className="page-title">Todo List</h1>

      <form onSubmit={add} className="card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ flex: '1 1 200px' }}
          placeholder="Add a task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      <div className="card">
        <ul className="todo-list">
          {list.length === 0 && <p className="text-muted">No tasks yet.</p>}
          {list.map((t) => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggle(t.id, t.done)}
                />
                <span>{t.text}</span>
              </label>
              <button type="button" className="btn btn-danger" onClick={() => remove(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
