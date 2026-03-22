import { useState, useEffect } from 'react';
import { api } from '../api';
import { useRole } from '../RoleContext';

const GS_PAPER_LABELS = {
  'Prelims-GS': 'Prelims – General Studies',
  'Prelims-CSAT': 'Prelims – CSAT',
  'Mains-GS1': 'Mains GS I',
  'Mains-GS2': 'Mains GS II',
  'Mains-GS3': 'Mains GS III',
  'Mains-GS4': 'Mains GS IV (Ethics)',
  'Mains-Essay': 'Mains – Essay',
  'Optional-Sociology': 'Optional – Sociology',
};

export default function Notes() {
  const { labels, roleConfig } = useRole();
  const [gsPapers, setGsPapers] = useState([]);
  const [gsPaper, setGsPaper] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [structure, setStructure] = useState(null);

  // Editor State
  const [editingFile, setEditingFile] = useState(null); // { path, content }
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Dynamically derive category keys from the roadmap papers
    api.syllabus.get().then((data) => {
      if (data?.papers) {
        const keys = data.papers.map(p => ({ id: p.id, name: p.name }));
        setGsPapers(keys);
        if (keys.length > 0) setGsPaper(keys[0].id);
      }
    });
  }, []);

  const loadStructure = () => {
    api.notes.structure().then(setStructure).catch(() => setStructure({}));
  };

  useEffect(() => {
    loadStructure();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !chapter.trim() || !topic.trim()) {
      setMessage({ type: 'error', text: `${labels.subject}, ${labels.chapter} and ${labels.topic} are required.` });
      return;
    }
    if (!file && !editingFile) {
      setMessage({ type: 'error', text: 'Please select a file or create content.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('gsPaper', gsPaper);
    formData.append('subject', subject.trim());
    formData.append('chapter', chapter.trim());
    formData.append('topic', topic.trim());
    
    if (file) {
      formData.append('file', file);
    } else if (editingFile) {
      const blob = new Blob([editingFile.content], { type: 'text/plain' });
      formData.append('file', blob, `${topic.trim() || 'note'}.txt`);
    }

    api.notes
      .upload(formData)
      .then((data) => {
        setMessage({
          type: 'success',
          text: `Saved successfully to ${labels.paper} structure.`,
        });
        setFile(null);
        setSubject('');
        setChapter('');
        setTopic('');
        setEditingFile(null);
        if (document.getElementById('notes-file')) document.getElementById('notes-file').value = '';
        loadStructure();
      })
      .catch((err) => setMessage({ type: 'error', text: err?.message || 'Upload failed' }))
      .finally(() => setLoading(false));
  };

  const handlePreview = async (relPath) => {
    try {
      setLoading(true);
      const { content } = await api.notes.getContent(relPath);
      setEditingFile({ path: relPath, content });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Only text-based files (.txt, .md) can be previewed/edited in the internal editor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;
    try {
      setIsSaving(true);
      await api.notes.saveContent(editingFile.path, editingFile.content);
      setMessage({ type: 'success', text: 'Changes saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecureDownload = async (relPath, fileName) => {
    try {
      const blob = await api.notes.downloadBlob(relPath);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  const handlePreviewFile = async (relPath, fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['txt', 'md'].includes(ext)) {
      handlePreview(relPath);
    } else {
      // Securely open in new tab (PDF, etc)
      try {
        const blob = await api.notes.downloadBlob(relPath);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (err) {
        alert('Preview failed');
      }
    }
  };

  const isPreviewable = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    return ['txt', 'md', 'pdf', 'png', 'jpg', 'jpeg'].includes(ext);
  };

  const isTextFile = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    return ['txt', 'md'].includes(ext);
  };

  const getPaperName = (id) => {
    const p = gsPapers.find(x => x.id === id);
    return p ? p.name : (GS_PAPER_LABELS[id] || id);
  };

  return (
    <>
      <h1 className="page-title">{labels.moduleNotes}</h1>

      {editingFile && (
        <div className="card editor-card">
          <div className="card-header-row">
            <h3>Editing: {editingFile.path.split('/').pop()}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingFile(null)}>Close Editor</button>
            </div>
          </div>
          <textarea
            className="input note-editor-textarea"
            value={editingFile.content}
            onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
            placeholder="Write your notes here..."
            spellCheck="false"
          />
        </div>
      )}

      <div className="card">
        <h3>{editingFile ? 'Upload as new version' : 'Upload a note'}</h3>
        <form onSubmit={handleSubmit} className="notes-form">
          <div className="editor-controls-grid">
            <div className="form-row">
              <label className="label">{labels.paper}</label>
              <select className="input" value={gsPaper} onChange={(e) => setGsPaper(e.target.value)} required>
                {gsPapers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="label">{labels.subject}</label>
              <input type="text" className="input" placeholder={`e.g. ${labels.subject}`} value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="form-row">
              <label className="label">{labels.chapter}</label>
              <input type="text" className="input" placeholder={`e.g. ${labels.chapter}`} value={chapter} onChange={(e) => setChapter(e.target.value)} required />
            </div>
            <div className="form-row">
              <label className="label">{labels.topic}</label>
              <input type="text" className="input" placeholder={`e.g. ${labels.topic}`} value={topic} onChange={(e) => setTopic(e.target.value)} required />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <label className="label">File (PDF, DOC, TXT, etc.)</label>
            <input id="notes-file" type="file" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg" />
          </div>
          {message && (
            <p className={message.type === 'success' ? 'text-success' : 'text-danger'} role="alert" style={{ marginBottom: '1rem' }}>
              {message.text}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Upload & Save'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Library</h3>
        {structure && Object.keys(structure).length === 0 && <p className="text-muted">No notes uploaded yet.</p>}
        <div className="notes-tree">
          {structure && Object.entries(structure).map(([paper, subjects]) => (
            <details key={paper} className="notes-tree-paper">
              <summary>{getPaperName(paper)}</summary>
              <div className="notes-tree-body">
                {Object.entries(subjects).map(([subj, chapters]) => (
                  <details key={subj} className="notes-tree-section">
                    <summary>{subj}</summary>
                    <div className="notes-tree-body">
                      {Object.entries(chapters).map(([ch, topics]) => (
                        <details key={ch} className="notes-tree-section">
                          <summary>{ch}</summary>
                          <div className="notes-tree-body">
                            {Object.entries(topics).map(([top, data]) => (
                              <details key={top} className="notes-tree-section">
                                <summary>{top}</summary>
                                {data._files && data._files.length > 0 ? (
                                  <ul className="notes-file-list">
                                    {data._files.map((f) => {
                                      const relPath = `${paper}/${subj}/${ch}/${top}/${f}`;
                                      return (
                                        <li key={f} className="note-file-item">
                                          <span className="note-file-name">{f}</span>
                                          <div className="note-file-actions">
                                            {isPreviewable(f) && (
                                              <button className="btn btn-ghost btn-sm" onClick={() => handlePreviewFile(relPath, f)}>
                                                {isTextFile(f) ? 'Preview/Edit' : 'Preview'}
                                              </button>
                                            )}
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleSecureDownload(relPath, f)}>Download</button>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : <p className="text-muted">No files</p>}
                              </details>
                            ))}
                          </div>
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
