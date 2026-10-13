import { useState } from 'react';

import DocumentView from './pages/DocumentView';
import FactExplorer from './pages/FactExplorer';
import RelationshipGraph from './pages/RelationshipGraph';
import UploadPage from './pages/UploadPage';
import ComparePage from './pages/ComparePage';
import StatusDashboard from './pages/StatusDashboard';
import ReviewQueue from './pages/ReviewQueue';
import EntityExplorer from './pages/EntityExplorer';
import AnalyticsPage from './pages/AnalyticsPage';

import './App.css';

type Page =
  | 'upload'
  | 'facts'
  | 'document'
  | 'relationships'
  | 'compare'
  | 'status'
  | 'review'
  | 'entities'
  | 'analytics';

const navigation: { id: Page; label: string; icon: string }[] = [
  { id: 'upload',        label: 'Upload',        icon: '⬆️' },
  { id: 'status',        label: 'Status',         icon: '📊' },
  { id: 'analytics',    label: 'Analytics',      icon: '📈' },
  { id: 'facts',         label: 'Fact Explorer',  icon: '🔎' },
  { id: 'entities',     label: 'Entities',       icon: '🏢' },
  { id: 'review',        label: 'Review Queue',   icon: '✅' },
  { id: 'document',     label: 'Document View',  icon: '📄' },
  { id: 'relationships', label: 'Relationships',  icon: '🔗' },
  { id: 'compare',       label: 'Compare',        icon: '⚖️' },
];

function App() {
  const [activePage, setActivePage] =
    useState<Page>('upload');

  const [documentId, setDocumentId] = useState('');
  const [documentFilename, setDocumentFilename] = useState('');

  const handleDocumentUploaded = (id: string, filename?: string) => {
    setDocumentId(id);
    if (filename) setDocumentFilename(filename);
  };

  const handleDocumentSelect = (id: string, filename?: string) => {
    setDocumentId(id);
    if (filename) setDocumentFilename(filename);
    // Empty string means "go back to document list"
    if (id === '') {
      setDocumentFilename('');
    }
    setActivePage('document');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'upload':
        return (
          <UploadPage
            onDocumentUploaded={handleDocumentUploaded}
          />
        );

      case 'facts':
        return <FactExplorer />;

      case 'document':
        return (
          <DocumentView
            documentId={documentId}
            documentFilename={documentFilename}
            onDocumentSelect={handleDocumentSelect}
          />
        );

      case 'relationships':
        return <RelationshipGraph />;

      case 'compare':
        return <ComparePage />;

      case 'status':
        return <StatusDashboard />;

      case 'review':
        return <ReviewQueue />;

      case 'entities':
        return <EntityExplorer />;

      case 'analytics':
        return <AnalyticsPage />;

      default:
        return <UploadPage />;
    }
  };

  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⬡</div>
            <span className="sidebar-logo-text">Fact Layer</span>
          </div>
          <div className="sidebar-tagline">Knowledge extraction platform</div>
        </div>
        <nav className="app-navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activePage === item.id ? 'nav-button active' : 'nav-button'}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="app-content">
        <main className="app-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
