import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useRole } from '../RoleContext';

export default function Topics() {
  const [syllabus, setSyllabus] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { labels } = useRole();
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.syllabus.get(),
      api.links.list()
    ]).then(([sData, lData]) => {
      setSyllabus(sData);
      setLinks(lData);
      // Auto-expand first paper
      if (sData?.papers?.length > 0) {
        setExpanded(new Set([sData.papers[0].id]));
      }
    }).finally(() => setLoading(false));
  }, []);

  const linksByTopic = useMemo(() => {
    const map = {};
    links.forEach(l => {
      if (l.topic) {
        const key = l.topic.toLowerCase().trim();
        map[key] ??= [];
        map[key].push(l);
      }
    });
    return map;
  }, [links]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setTopicCompleted = async (topicId, completed) => {
    try {
      await api.syllabus.setTopicCompleted(topicId, completed);
      setSyllabus((prev) => {
        const next = { ...prev };
        for (const paper of next.papers || []) {
          for (const section of paper.sections || []) {
            for (const group of section.topicGroups || []) {
              const t = (group.topics || []).find(x => x.id === topicId);
              if (t) t.completed = completed;
            }
          }
        }
        return next;
      });
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="loading-container"><p className="text-muted">Loading {labels.moduleSyllabus} Tree...</p></div>;

  const calculateProgress = (items) => {
    let total = 0, completed = 0;
    const process = (p) => {
      if (p.topics) {
        p.topics.forEach(t => { total++; if (t.completed) completed++; });
      } else if (p.topicGroups) {
        p.topicGroups.forEach(process);
      } else if (p.sections) {
        p.sections.forEach(process);
      } else if (p.papers) {
        p.papers.forEach(process);
      }
    };
    process({ papers: items });
    return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  };

  const overall = calculateProgress(syllabus?.papers || []);

  return (
    <div className="topics-page">
      <div className="topics-header">
        <h1 className="page-title">{labels.moduleSyllabus} Coverage</h1>
        <div className="overall-stats-card card">
          <div className="stats-main">
            <div className="stats-info">
              <span className="stats-label">Overall Completion</span>
              <span className="stats-value">{overall.percent}%</span>
            </div>
            <div className="stats-progress-container">
              <div className="stats-progress-bar" style={{ width: `${overall.percent}%` }} />
            </div>
          </div>
          <p className="stats-footer">{overall.completed} / {overall.total} total {labels.topic.toLowerCase()}s mastered</p>
        </div>
      </div>

      <div className="syllabus-tree">
        {(syllabus?.papers || []).map((paper) => {
          const isExpanded = expanded.has(paper.id);
          const prog = calculateProgress([paper]);
          
          return (
            <div key={paper.id} className={`tree-node paper-node ${isExpanded ? 'is-expanded' : ''}`}>
              <div className="node-header" onClick={() => toggleExpand(paper.id)}>
                <span className="node-toggle">{isExpanded ? '▼' : '▶'}</span>
                <div className="node-content">
                  <span className="node-title">{paper.name}</span>
                  <div className="node-badge">{prog.percent}%</div>
                </div>
              </div>

              {isExpanded && (
                <div className="node-children">
                  {paper.sections.map((section) => {
                    const isSecExpanded = expanded.has(section.id);
                    const secProg = calculateProgress([{ sections: [section] }]);
                    
                    return (
                      <div key={section.id} className={`tree-node section-node ${isSecExpanded ? 'is-expanded' : ''}`}>
                        <div className="node-header" onClick={() => toggleExpand(section.id)}>
                          <span className="node-toggle">{isSecExpanded ? '▼' : '▶'}</span>
                          <div className="node-content">
                            <span className="node-title">{section.name}</span>
                            <div className="node-mini-progress">
                              <div className="mini-fill" style={{ width: `${secProg.percent}%` }} />
                            </div>
                          </div>
                        </div>

                        {isSecExpanded && (
                          <div className="node-children">
                            {section.topicGroups.map((group, gi) => (
                              <div key={gi} className="tree-node group-node">
                                {group.name && <div className="group-label">{group.name}</div>}
                                <div className="topic-items-grid">
                                  {group.topics.map((topic) => {
                                    const topicLinks = linksByTopic[topic.name.toLowerCase().trim()] || [];
                                    return (
                                      <div key={topic.id} className="topic-card-wrapper">
                                        <div className={`topic-check-item ${topic.completed ? 'is-completed' : ''}`}>
                                          <input 
                                            type="checkbox" 
                                            id={topic.id}
                                            checked={!!topic.completed}
                                            onChange={(e) => setTopicCompleted(topic.id, e.target.checked)}
                                          />
                                          <label htmlFor={topic.id}>{topic.name}</label>
                                        </div>
                                        {topicLinks.length > 0 && (
                                          <div className="topic-linked-resources">
                                            {topicLinks.map(l => (
                                              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" title={l.title || l.url}>
                                                🔗 {l.title || 'Link'}
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
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
    </div>
  );
}
