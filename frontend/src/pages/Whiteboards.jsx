import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { api } from '../api';
import { useRole } from '../RoleContext';

export default function Whiteboards({ isStandaloneEditor = false, globalTheme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { labels, loading: roleLoading } = useRole();
  const [boards, setBoards] = useState([]);
  const [activeId, setActiveId] = useState(id || null);
  const [paperList, setPaperList] = useState([]);

  const currentTheme = globalTheme || localStorage.getItem('theme') || 'dark';
  
  // Editor Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gsPaper, setGsPaper] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(isStandaloneEditor);
  const [showControls, setShowControls] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.boards.list().then(setBoards);
    api.syllabus.get().then(data => {
      if (data?.papers) {
        const list = data.papers.map(p => ({ id: p.id, name: p.name }));
        setPaperList(list);
        if (!gsPaper && list.length > 0) setGsPaper(list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (activeId) {
      const loadBoard = async () => {
        try {
          const board = await api.boards.get(activeId);
          setName(board.name || '');
          setDescription(board.description || '');
          setGsPaper(board.gsPaper || '');
          setSubject(board.subject || '');
          setChapter(board.chapter || '');
          setTopic(board.topic || '');
          
          if (excalidrawAPI && board.data) {
            excalidrawAPI.updateScene({ elements: board.data.elements, appState: board.data.appState });
          }
          setIsEditorOpen(true);
        } catch (err) {
          console.error('Failed to load board:', err);
        }
      };
      loadBoard();
    }
  }, [activeId, excalidrawAPI]);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Board name is required' });
      return;
    }
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const payload = {
      name,
      description,
      gsPaper,
      subject,
      chapter,
      topic,
      data: { elements, appState }
    };

    try {
      if (activeId) {
        await api.boards.update(activeId, payload);
      } else {
        const res = await api.boards.create(payload);
        setActiveId(res.id);
        navigate(`/whiteboards/${res.id}`);
      }
      setMessage({ type: 'success', text: 'Board saved!' });
      api.boards.list().then(setBoards);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save board' });
    }
  };

  const handleNew = () => {
    setActiveId(null);
    setName('');
    setDescription('');
    setSubject('');
    setChapter('');
    setTopic('');
    if (paperList.length > 0) setGsPaper(paperList[0].id);
    setIsEditorOpen(true);
    if (excalidrawAPI) {
      excalidrawAPI.resetScene();
    }
  };

  const boardTree = useMemo(() => {
    const tree = {};
    boards.forEach(b => {
      const p = b.gsPaper || 'General';
      const s = b.subject || 'Uncategorized';
      const c = b.chapter || 'No Chapter';
      if (!tree[p]) tree[p] = {};
      if (!tree[p][s]) tree[p][s] = {};
      if (!tree[p][s][c]) tree[p][s][c] = [];
      tree[p][s][c].push(b);
    });
    return tree;
  }, [boards]);

  const getPaperName = (id) => {
    const p = paperList.find(x => x.id === id);
    return p ? p.name : id;
  };

  if (roleLoading) return <p>Loading...</p>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page-title">{labels.moduleWhiteboards}</h1>
        <button className="btn btn-primary" onClick={handleNew}>+ New board</button>
      </div>

      {isEditorOpen && (
        <div className="whiteboard-editor-container card">
          <div className="editor-header">
            <div className="editor-title-row" onClick={() => setShowControls(!showControls)}>
              <h2>{name || 'Untitled Board'}</h2>
              <span className="expand-icon">
                {showControls ? '▴' : '▾'}
              </span>
            </div>
            {!showControls && (
              <div className="editor-subtitle">
                {getPaperName(gsPaper)} / {subject || labels.subject} / {chapter || labels.chapter}
              </div>
            )}
          </div>
          <div className="editor-actions">
            {message && (
              <span className={`msg ${message.type === 'success' ? 'text-success' : 'text-danger'}`} style={{ marginRight: '1rem' }}>
                {message.text}
              </span>
            )}
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Board</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsEditorOpen(false)}>Close</button>
          </div>

          {showControls && (
            <div className="editor-controls">
              <div className="form-row">
                <label className="label">Board Name</label>
                <input 
                  className="input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. My Flowchart"
                  required 
                />
              </div>
              <div className="editor-controls-grid">
                <div className="form-row">
                  <label className="label">{labels.paper}</label>
                  <select className="input" value={gsPaper} onChange={(e) => setGsPaper(e.target.value)}>
                    {paperList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label className="label">{labels.subject}</label>
                  <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={`e.g. ${labels.subject}`} />
                </div>
                <div className="form-row">
                  <label className="label">{labels.chapter}</label>
                  <input className="input" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder={`e.g. ${labels.chapter}`} />
                </div>
                <div className="form-row">
                  <label className="label">{labels.topic}</label>
                  <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={`e.g. ${labels.topic}`} />
                </div>
              </div>
            </div>
          )}

          <div className="excalidraw-wrapper" style={{ height: '600px', marginTop: '1rem' }}>
            <Excalidraw 
              excalidrawAPI={(api) => setExcalidrawAPI(api)} 
              theme={currentTheme}
            />
          </div>
        </div>
      )}

      <div className="card">
        <h3>Your Boards</h3>
        {boards.length === 0 && <p className="text-muted">No boards yet. Click "+ New board" to start.</p>}
        <div className="notes-tree">
          {Object.entries(boardTree).map(([paper, subjects]) => (
            <details key={paper} className="notes-tree-paper" open>
              <summary>{getPaperName(paper)}</summary>
              <div className="notes-tree-body">
                {Object.entries(subjects).map(([subj, chapters]) => (
                  <details key={subj} className="notes-tree-section" open>
                    <summary>{subj}</summary>
                    <div className="notes-tree-body">
                      {Object.entries(chapters).map(([ch, list]) => (
                        <details key={ch} className="notes-tree-section" open>
                          <summary>{ch}</summary>
                          <ul className="notes-file-list">
                            {list.map(b => (
                              <li key={b.id} className="note-file-item" onClick={() => {
                                setActiveId(b.id);
                                navigate(`/whiteboards/${b.id}`);
                              }} style={{ cursor: 'pointer' }}>
                                <span className="note-file-name">🎨 {b.name}</span>
                                <div className="note-file-actions">
                                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{b.topic || ''}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
