import { useEffect, useState } from 'react';
import { AnalyticsSummary, Document, getAnalytics, getDocuments } from '../api/client';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

function HomePage({ onNavigate }: HomePageProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoadingAnalytics(false));

    getDocuments({ limit: 5 })
      .then(setRecentDocs)
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  return (
    <section className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <h1>AI-Powered Fact Extraction</h1>
        <p>Upload any PDF document and our LLM pipeline extracts structured facts, resolves entities, and discovers cross-document relationships automatically.</p>
        <button type="button" className="cta-button" onClick={() => onNavigate('upload')}>
          Upload a PDF →
        </button>
      </div>

      {/* Stats row */}
      <div className="home-stats-row">
        {[
          { icon: '📄', label: 'Documents', value: analytics?.totals.documents ?? '—', color: '#3b82f6' },
          { icon: '🔍', label: 'Facts', value: analytics?.totals.facts ?? '—', color: '#8b5cf6' },
          { icon: '🏢', label: 'Entities', value: analytics?.totals.entities ?? '—', color: '#10b981' },
          { icon: '🔗', label: 'Relationships', value: analytics?.totals.relationships ?? '—', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="home-stat-card">
            <div className="home-stat-icon">{stat.icon}</div>
            <div className="home-stat-value" style={{color: stat.color}}>
              {loadingAnalytics ? '…' : stat.value}
            </div>
            <div className="home-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="home-how-it-works">
        <h2>How it works</h2>
        <div className="home-steps">
          {[
            { num: 1, icon: '📤', title: 'Upload', desc: 'Drop any PDF document' },
            { num: 2, icon: '⚙️', title: 'Extract', desc: 'LLM extracts structured facts with evidence' },
            { num: 3, icon: '🔗', title: 'Compare', desc: 'Cross-document relationships detected' },
            { num: 4, icon: '🔍', title: 'Explore', desc: 'Search, filter and review all facts' },
          ].map(step => (
            <div key={step.num} className="home-step">
              <div className="home-step-num">{step.num}</div>
              <div className="home-step-icon">{step.icon}</div>
              <div className="home-step-title">{step.title}</div>
              <div className="home-step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent documents */}
      <div className="home-recent">
        <div className="home-recent-header">
          <h2>Recent Documents</h2>
          <button type="button" className="secondary-button" onClick={() => onNavigate('status')}>View all →</button>
        </div>
        {loadingDocs ? (
          <div className="empty-state">Loading…</div>
        ) : recentDocs.length === 0 ? (
          <div className="empty-state">No documents yet. Upload a PDF to get started.</div>
        ) : (
          <table className="home-recent-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.filename.replace(/^document:[a-f0-9]+_/, '')}</td>
                  <td>
                    <span className={`status-pill status-pill--${doc.status}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="link-button" onClick={() => onNavigate('status')}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default HomePage;
