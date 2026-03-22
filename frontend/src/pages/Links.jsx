import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useRole } from '../RoleContext';
import { generateLinksPdf } from '../utils/linksPdf';

export default function Links() {
  const { labels, roleConfig, loading: roleLoading } = useRole();
  const [gsPapers, setGsPapers] = useState([]);
  const [gsPaper, setGsPaper] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const [showSubjectHints, setShowSubjectHints] = useState(false);
  const [showChapterHints, setShowChapterHints] = useState(false);
  const [showTopicHints, setShowTopicHints] = useState(false);

  useEffect(() => {
    // Dynamically derive category keys from the roadmap papers
    api.syllabus.get().then((data) => {
      if (data?.papers) {
        const keys = data.papers.map(p => ({ id: p.id, name: p.name }));
        setGsPapers(keys);
        if (keys.length > 0) setGsPaper(keys[0].id);
      }
    });

    api.links.list().then(setLinks).catch(() => setLinks([]));
  }, []);

  const filteredLinks = useMemo(
    () => links.filter((l) => !gsPaper || l.gsPaper === gsPaper),
    [links, gsPaper],
  );

  const grouped = useMemo(() => {
    const out = {};
    for (const link of links) { // Group all links for the tree view
      const paperKey = link.gsPaper || 'Other';
      const subjKey = link.subject || 'General';
      const chapKey = link.chapter || 'Misc';
      const topicKey = link.topic || 'Misc';
      out[paperKey] ??= {};
      out[paperKey][subjKey] ??= {};
      out[paperKey][subjKey][chapKey] ??= {};
      out[paperKey][subjKey][chapKey][topicKey] ??= [];
      out[paperKey][subjKey][chapKey][topicKey].push(link);
    }
    return out;
  }, [links]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const subjectHints = useMemo(() => {
    const set = new Set();
    for (const l of filteredLinks) {
      if (l.subject) set.add(l.subject);
    }
    const all = Array.from(set).sort();
    if (!subject.trim()) return all.slice(0, 8);
    return all.filter((s) => s.toLowerCase().includes(subject.trim().toLowerCase())).slice(0, 8);
  }, [filteredLinks, subject]);

  const chapterHints = useMemo(() => {
    const set = new Set();
    for (const l of filteredLinks) {
      if (l.chapter && (!subject.trim() || l.subject === subject.trim())) set.add(l.chapter);
    }
    const all = Array.from(set).sort();
    if (!chapter.trim()) return all.slice(0, 8);
    return all.filter((c) => c.toLowerCase().includes(chapter.trim().toLowerCase())).slice(0, 8);
  }, [filteredLinks, subject, chapter]);

  const topicHints = useMemo(() => {
    const set = new Set();
    for (const l of filteredLinks) {
      if (
        l.topic &&
        (!subject.trim() || l.subject === subject.trim()) &&
        (!chapter.trim() || l.chapter === chapter.trim())
      ) {
        set.add(l.topic);
      }
    }
    const all = Array.from(set).sort();
    if (!topic.trim()) return all.slice(0, 8);
    return all.filter((t) => t.toLowerCase().includes(topic.trim().toLowerCase())).slice(0, 8);
  }, [filteredLinks, subject, chapter, topic]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !chapter.trim() || !topic.trim() || !url.trim()) {
      setMessage({ type: 'error', text: `${labels.subject}, ${labels.chapter}, ${labels.topic} and URL are required.` });
      return;
    }
    setLoading(true);
    setMessage(null);

    api.links
      .add({
        gsPaper,
        subject: subject.trim(),
        chapter: chapter.trim(),
        topic: topic.trim(),
        url: url.trim(),
        title: title.trim() || undefined,
      })
      .then((entry) => {
        setLinks((prev) => [...prev, entry]);
        setMessage({
          type: 'success',
          text: `Saved successfully to ${labels.paper} structure.`,
        });
        setSubject('');
        setChapter('');
        setTopic('');
        setUrl('');
        setTitle('');
      })
      .catch((err) => {
        setMessage({ type: 'error', text: err?.message || 'Could not save link.' });
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this link?')) return;
    api.links
      .remove(id)
      .then(() => {
        setLinks((prev) => prev.filter((l) => l.id !== id));
      })
      .catch(() => {});
  };

  const handleDownloadPdf = async () => {
    if (!links.length) return;
    setLoading(true);
    try {
      const user = await api.auth.me();
      await generateLinksPdf(user, labels, grouped);
    } catch (err) {
      alert('Failed to generate PDF.');
    } finally {
      setLoading(false);
    }
  };

  const getPaperName = (id) => {
    const p = gsPapers.find(x => x.id === id);
    return p ? p.name : id;
  };

  if (roleLoading) return <p className="text-muted">Loading {labels.moduleLinks}...</p>;

  return (
    <div className="links-page">
      <h1 className="page-title">{labels.moduleLinks}</h1>
      <p className="text-muted" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
        Curate your external resources, organized by {labels.paper.toLowerCase()}.
      </p>

      <div className="card">
        <h3>Add a {labels.moduleLinks.slice(0, -1)}</h3>
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
              <div className="input-with-hints">
                <input type="text" className="input" placeholder={`e.g. ${labels.subject}`} value={subject} onChange={(e) => setSubject(e.target.value)} onFocus={() => setShowSubjectHints(true)} onBlur={() => setTimeout(() => setShowSubjectHints(false), 120)} required autoComplete="off" />
                {showSubjectHints && subjectHints.length > 0 && (
                  <ul className="input-hints">
                    {subjectHints.map((s) => <li key={s} onMouseDown={(e) => { e.preventDefault(); setSubject(s); }}>{s}</li>)}
                  </ul>
                )}
              </div>
            </div>
            <div className="form-row">
              <label className="label">{labels.chapter}</label>
              <div className="input-with-hints">
                <input type="text" className="input" placeholder={`e.g. ${labels.chapter}`} value={chapter} onChange={(e) => setChapter(e.target.value)} onFocus={() => setShowChapterHints(true)} onBlur={() => setTimeout(() => setShowChapterHints(false), 120)} required autoComplete="off" />
                {showChapterHints && chapterHints.length > 0 && (
                  <ul className="input-hints">
                    {chapterHints.map((c) => <li key={c} onMouseDown={(e) => { e.preventDefault(); setChapter(c); }}>{c}</li>)}
                  </ul>
                )}
              </div>
            </div>
            <div className="form-row">
              <label className="label">{labels.topic}</label>
              <div className="input-with-hints">
                <input type="text" className="input" placeholder={`e.g. ${labels.topic}`} value={topic} onChange={(e) => setTopic(e.target.value)} onFocus={() => setShowTopicHints(true)} onBlur={() => setTimeout(() => setShowTopicHints(false), 120)} required autoComplete="off" />
                {showTopicHints && topicHints.length > 0 && (
                  <ul className="input-hints">
                    {topicHints.map((t) => <li key={t} onMouseDown={(e) => { e.preventDefault(); setTopic(t); }}>{t}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <label className="label">URL</label>
            <input type="url" className="input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="label">Display Title</label>
            <input type="text" className="input" placeholder="e.g. Reference Video" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {message && <p className={message.type === 'success' ? 'text-success' : 'text-danger'}>{message.text}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add Resource'}</button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Resource Library</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleDownloadPdf}>Download PDF Report</button>
        </div>

        {links.length === 0 ? <p className="text-muted">No resources saved yet.</p> : (
          <div className="syllabus-tree">
            {Object.entries(grouped).map(([paperKey, subjects]) => {
              const isPaperExpanded = expanded.has(paperKey);
              return (
                <div key={paperKey} className={`tree-node paper-node ${isPaperExpanded ? 'is-expanded' : ''}`}>
                  <div className="node-header" onClick={() => toggleExpand(paperKey)}>
                    <span className="node-toggle">{isPaperExpanded ? '▼' : '▶'}</span>
                    <span className="node-title">{getPaperName(paperKey)}</span>
                  </div>
                  {isPaperExpanded && (
                    <div className="node-children">
                      {Object.entries(subjects).map(([subjKey, chapters]) => {
                        const subjId = `${paperKey}-${subjKey}`;
                        const isSubjExpanded = expanded.has(subjId);
                        return (
                          <div key={subjKey} className={`tree-node section-node ${isSubjExpanded ? 'is-expanded' : ''}`}>
                            <div className="node-header" onClick={() => toggleExpand(subjId)}>
                              <span className="node-toggle">{isSubjExpanded ? '▼' : '▶'}</span>
                              <span className="node-title">{subjKey}</span>
                            </div>
                            {isSubjExpanded && (
                              <div className="node-children">
                                {Object.entries(chapters).map(([chapKey, topics]) => {
                                  const chapId = `${subjId}-${chapKey}`;
                                  const isChapExpanded = expanded.has(chapId);
                                  return (
                                    <div key={chapKey} className={`tree-node group-node ${isChapExpanded ? 'is-expanded' : ''}`}>
                                      <div className="group-label" onClick={() => toggleExpand(chapId)} style={{ cursor: 'pointer' }}>
                                        {isChapExpanded ? '▼ ' : '▶ '}{chapKey}
                                      </div>
                                      {isChapExpanded && (
                                        <div className="topic-items-grid" style={{ paddingLeft: '1rem' }}>
                                          {Object.entries(topics).map(([topKey, list]) => (
                                            <div key={topKey} className="resource-topic-block">
                                              <strong style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>{topKey}</strong>
                                              <ul className="notes-file-list" style={{ marginTop: '0.5rem' }}>
                                                {list.map(l => (
                                                  <li key={l.id} className="note-file-item">
                                                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="note-file-name" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                                                      🔗 {l.title || l.url}
                                                    </a>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(l.id)}>✕</button>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
