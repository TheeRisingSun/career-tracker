import { useEffect, useState } from 'react';
import { useRole } from '../RoleContext';
import { api } from '../api';

export default function RoadmapView() {
  const { labels, roleConfig } = useRole();
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPdf = async () => {
      try {
        const blob = await api.docs.roadmapBlob();
        if (mounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('PDF Load Error:', err);
          setError(`Failed to load ${labels.moduleSyllabus} Map. Error: ${err.message}`);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      mounted = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [labels.moduleSyllabus]);

  if (loading) return (
    <div className="loading-container">
      <p className="text-muted">Loading {labels.moduleSyllabus} Map Reference...</p>
    </div>
  );

  if (error) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <p className="text-danger" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{error}</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <>
      <h1 className="page-title">{labels.moduleSyllabus} Reference</h1>
      <div className="card" style={{ height: 'calc(100vh - 200px)', padding: '0', overflow: 'hidden', background: '#333' }}>
        {blobUrl ? (
          <iframe
            src={`${blobUrl}#view=FitH&toolbar=0`}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Roadmap PDF"
          />
        ) : (
          <p className="text-muted" style={{ padding: '2rem' }}>Rendering PDF...</p>
        )}
      </div>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          Open PDF in new tab
        </a>
      </div>
    </>
  );
}
