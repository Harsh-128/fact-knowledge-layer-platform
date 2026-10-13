import { useState } from 'react';
import React from 'react';

import DocumentView from './pages/DocumentView';
import FactExplorer from './pages/FactExplorer';
import RelationshipGraph from './pages/RelationshipGraph';
import UploadPage from './pages/UploadPage';
import ComparePage from './pages/ComparePage';
import StatusDashboard from './pages/StatusDashboard';
import ReviewQueue from './pages/ReviewQueue';
import EntityExplorer from './pages/EntityExplorer';
import AnalyticsPage from './pages/AnalyticsPage';
import HomePage from './pages/HomePage';
import { ToastProvider } from './components/Toast';

import './App.css';

type Page =
  | 'home'
  | 'upload'
  | 'facts'
  | 'document'
  | 'relationships'
  | 'compare'
  | 'status'
  | 'review'
  | 'entities'
  | 'analytics';

// Clean SVG icons — one consistent style, no emojis
const Icons: Record<string, React.ReactElement> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  upload: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  status: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  facts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  entities: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  review: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  document: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  relationships: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  compare: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>
    </svg>
  ),
};

const navigation: { id: Page; label: string }[] = [
  { id: 'home',          label: 'Home'          },
  { id: 'upload',        label: 'Upload'        },
  { id: 'status',        label: 'Status'        },
  { id: 'analytics',     label: 'Analytics'     },
  { id: 'facts',         label: 'Fact Explorer' },
  { id: 'entities',      label: 'Entities'      },
  { id: 'review',        label: 'Review Queue'  },
  { id: 'document',      label: 'Document View' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'compare',       label: 'Compare'       },
];

function App() {
  const [activePage, setActivePage] =
    useState<Page>('home');

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
      case 'home':
        return <HomePage onNavigate={(p) => setActivePage(p as Page)} />;

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
        return <StatusDashboard onDocumentSelect={handleDocumentSelect} />;

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
    <ToastProvider>
      <div className="app">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
              </div>
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
                <span className="nav-icon">{Icons[item.id]}</span>
                <span className="nav-label">{item.label}</span>
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
    </ToastProvider>
  );
}

export default App;
