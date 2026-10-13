import { useEffect, useRef, useState } from 'react';

import {
  Document,
  Fact,
  getFact,
  getDocuments,
  getRelationships,
  Relationship,
} from '../api/client';
import RelationshipBadge from '../components/RelationshipBadge';

interface DocNode {
  x: number;
  y: number;
  label: string;
  factCount: number;
}

function getEdgeColor(relType: string): string {
  const t = relType.toLowerCase();
  if (t === 'corroboration' || t === 'corroborates') return '#10b981';
  if (t === 'contradiction' || t === 'contradicts') return '#ef4444';
  if (t === 'reconciliation' || t === 'reconciles') return '#f59e0b';
  return '#6366f1';
}

function RelationshipGraph() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [facts, setFacts] = useState<Record<string, Fact>>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedNodeDocId, setSelectedNodeDocId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; docId: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load document list for the filter dropdown
  useEffect(() => {
    getDocuments({ limit: 100 }).then(setDocuments).catch(() => {});
  }, []);

  useEffect(() => {
    const loadRelationships = async () => {
      setLoading(true);
      setError('');

      try {
        const relationshipResult = await getRelationships({
          document_id: selectedDocumentId || undefined,
          limit: 500,
          offset: 0,
        });

        setRelationships(relationshipResult);

        const neededIds = new Set<string>();
        for (const rel of relationshipResult) {
          neededIds.add(rel.source_fact_id);
          neededIds.add(rel.target_fact_id);
        }

        const factEntries = await Promise.allSettled(
          [...neededIds].map((id) => getFact(id)),
        );

        const factMap: Record<string, Fact> = {};
        for (const entry of factEntries) {
          if (entry.status === 'fulfilled') {
            factMap[entry.value.id] = entry.value;
          }
        }

        setFacts(factMap);
      } catch (loadError) {
        setRelationships([]);
        setFacts({});

        if (loadError instanceof Error && loadError.message) {
          setError(loadError.message);
        } else {
          setError(
            'Unable to load relationships. Make sure the FastAPI backend is running.',
          );
        }
      } finally {
        setLoading(false);
      }
    };

    void loadRelationships();
  }, [selectedDocumentId]);

  // Build SVG graph data
  const docNodes = new Map<string, DocNode>();
  if (!loading && relationships.length > 0) {
    // Collect unique doc IDs and fact counts per doc
    const docFactCount = new Map<string, number>();
    for (const rel of relationships) {
      const srcDocId = facts[rel.source_fact_id]?.document_id;
      const tgtDocId = facts[rel.target_fact_id]?.document_id;
      if (srcDocId) docFactCount.set(srcDocId, (docFactCount.get(srcDocId) ?? 0) + 1);
      if (tgtDocId) docFactCount.set(tgtDocId, (docFactCount.get(tgtDocId) ?? 0) + 1);
    }

    const uniqueDocIds = Array.from(docFactCount.keys());
    const N = uniqueDocIds.length;
    const radius = 180;
    const centerX = 400;
    const centerY = 250;

    uniqueDocIds.forEach((docId, i) => {
      const angle = i * (2 * Math.PI / N) - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const matchedDoc = documents.find((doc) => doc.id === docId);
      const rawName = matchedDoc ? matchedDoc.filename : docId.slice(0, 20);
      const label = rawName
        .replace(/^document:[a-f0-9]+_/, '')
        .replace('.pdf', '');

      docNodes.set(docId, {
        x,
        y,
        label,
        factCount: docFactCount.get(docId) ?? 0,
      });
    });
  }

  const filteredRelationships = relationships.filter((r) =>
    typeFilter ? r.relationship_type.toLowerCase() === typeFilter : true,
  );

  const getEdgeOpacity = (relId: string, srcDocId: string | undefined, tgtDocId: string | undefined): number => {
    if (selectedNodeDocId) {
      return (srcDocId === selectedNodeDocId || tgtDocId === selectedNodeDocId) ? 1 : 0.2;
    }
    if (selectedEdgeId) {
      return relId === selectedEdgeId ? 1 : 0.2;
    }
    return 0.7;
  };

  const selectedRel = relationships.find((r) => r.id === selectedEdgeId);
  const srcFact = selectedRel ? facts[selectedRel.source_fact_id] : undefined;
  const tgtFact = selectedRel ? facts[selectedRel.target_fact_id] : undefined;

  const tooltipNode = tooltip ? docNodes.get(tooltip.docId) : null;
  const tooltipLabel = tooltipNode?.label ?? tooltip?.docId ?? '';
  const tooltipFactCount = tooltipNode?.factCount ?? 0;

  return (
    <section className="relationship-graph">
      <div className="page-heading">
        <span className="eyebrow">Cross-document reasoning</span>

        <h2>Relationship Explorer</h2>

        <p>
          Inspect how extracted facts relate to one another across
          documents.
        </p>
      </div>

      {/* Document filter + type filter */}
      <div className="fact-filters">
        <div className="filter-field">
          <label htmlFor="doc-filter">Filter by document</label>
          <select
            id="doc-filter"
            value={selectedDocumentId}
            onChange={(e) => setSelectedDocumentId(e.target.value)}
          >
            <option value="">All documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename.replace(/^document:[a-f0-9]+_/, '')}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="type-filter">Filter by type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="corroborates">Corroborates</option>
            <option value="contradicts">Contradicts</option>
            <option value="reconciles">Reconciles</option>
          </select>
        </div>
      </div>

      <div className="relationship-summary">
        <div>
          <strong>{relationships.length}</strong>
          <span>Relationships</span>
        </div>

        <div>
          <strong>
            {
              relationships.filter(
                (item) => item.relationship_type.toLowerCase() === 'corroborates',
              ).length
            }
          </strong>
          <span>Corroborations</span>
        </div>

        <div>
          <strong>
            {
              relationships.filter(
                (item) => item.relationship_type.toLowerCase() === 'contradicts',
              ).length
            }
          </strong>
          <span>Contradictions</span>
        </div>

        <div>
          <strong>
            {
              relationships.filter(
                (item) => item.relationship_type.toLowerCase() === 'reconciles',
              ).length
            }
          </strong>
          <span>Reconciliations</span>
        </div>
      </div>

      {error && (
        <div className="page-message page-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="empty-state">
          Loading relationships...
        </div>
      )}

      {!loading && !error && relationships.length === 0 && (
        <div className="empty-state">
          No fact relationships have been created yet.
        </div>
      )}

      {/* SVG Graph */}
      {!loading && relationships.length > 0 && (
        <>
          {docNodes.size < 2 ? (
            <div className="empty-state">Not enough documents to draw a graph</div>
          ) : (
            <div className="svg-graph-container">
              <svg
                ref={svgRef}
                width="100%"
                height="500"
                viewBox="0 0 800 500"
                style={{ background: '#0f1117' }}
                onClick={() => {
                  setSelectedNodeDocId(null);
                  setSelectedEdgeId(null);
                }}
              >
                {/* edges */}
                {filteredRelationships.map((rel) => {
                  const srcDocId = facts[rel.source_fact_id]?.document_id;
                  const tgtDocId = facts[rel.target_fact_id]?.document_id;
                  const srcNode = srcDocId ? docNodes.get(srcDocId) : undefined;
                  const tgtNode = tgtDocId ? docNodes.get(tgtDocId) : undefined;
                  if (!srcNode || !tgtNode || srcDocId === tgtDocId) return null;

                  const color = getEdgeColor(rel.relationship_type);
                  const strokeWidth = 1 + rel.confidence * 3;
                  const opacity = getEdgeOpacity(rel.id, srcDocId, tgtDocId);

                  return (
                    <line
                      key={rel.id}
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(rel.id === selectedEdgeId ? null : rel.id);
                        setSelectedNodeDocId(null);
                      }}
                    />
                  );
                })}

                {/* nodes */}
                {Array.from(docNodes.entries()).map(([docId, node]) => (
                  <g
                    key={docId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeDocId(docId === selectedNodeDocId ? null : docId);
                      setSelectedEdgeId(null);
                    }}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, docId })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={28}
                      fill={selectedNodeDocId === docId ? '#818cf8' : '#6366f1'}
                      stroke={selectedNodeDocId === docId ? '#e0e7ff' : '#a5b4fc'}
                      strokeWidth={2}
                    />
                    <text
                      x={node.x}
                      y={node.y + 42}
                      textAnchor="middle"
                      fill="white"
                      fontSize={11}
                    >
                      {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Legend */}
              <div className="graph-legend">
                {[
                  { label: 'Corroboration', color: '#10b981' },
                  { label: 'Contradiction', color: '#ef4444' },
                  { label: 'Reconciliation', color: '#f59e0b' },
                  { label: 'Other', color: '#6366f1' },
                ].map((item) => (
                  <div key={item.label} className="graph-legend-item">
                    <span className="graph-legend-dot" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edge detail panel */}
          {selectedEdgeId && selectedRel && (
            <div className="graph-detail-panel">
              <h4>Relationship Detail</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <RelationshipBadge relationship={selectedRel} />
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                  Confidence: {Math.round(selectedRel.confidence * 100)}%
                </span>
              </div>
              {selectedRel.explanation && (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px' }}>
                  {selectedRel.explanation}
                </p>
              )}
              <div className="graph-detail-facts">
                <div className="graph-detail-fact">
                  <strong>{srcFact?.attribute ?? 'Fact ' + selectedRel.source_fact_id.slice(0, 8)}</strong>
                  <p>{srcFact ? `${String(srcFact.value)}${srcFact.unit ? ` ${srcFact.unit}` : ''}` : '—'}</p>
                </div>
                <div className="graph-detail-arrow">→</div>
                <div className="graph-detail-fact">
                  <strong>{tgtFact?.attribute ?? 'Fact ' + selectedRel.target_fact_id.slice(0, 8)}</strong>
                  <p>{tgtFact ? `${String(tgtFact.value)}${tgtFact.unit ? ` ${tgtFact.unit}` : ''}` : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="graph-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div style={{ fontWeight: 600 }}>{tooltipLabel || tooltip.docId}</div>
          <div style={{ color: '#94a3b8', marginTop: '2px' }}>{tooltipFactCount} facts</div>
        </div>
      )}

      {/* Card list */}
      {!loading && relationships.length > 0 && (
        <div className="relationship-list">
          {filteredRelationships.map((relationship) => {
            const sourceFact = facts[relationship.source_fact_id];
            const targetFact = facts[relationship.target_fact_id];

            return (
              <article
                className="relationship-card"
                key={relationship.id}
              >
                <div className="relationship-facts">
                  <div className="relationship-fact">
                    <span>Source fact</span>
                    <strong>
                      {sourceFact?.attribute ??
                        'Fact ' + relationship.source_fact_id.slice(0, 8)}
                    </strong>

                    {sourceFact && (
                      <p>
                        {String(sourceFact.value)}
                        {sourceFact.unit
                          ? ` ${sourceFact.unit}`
                          : ''}
                      </p>
                    )}
                  </div>

                  <div className="relationship-arrow">
                    →
                  </div>

                  <div className="relationship-fact">
                    <span>Target fact</span>
                    <strong>
                      {targetFact?.attribute ??
                        'Fact ' + relationship.target_fact_id.slice(0, 8)}
                    </strong>

                    {targetFact && (
                      <p>
                        {String(targetFact.value)}
                        {targetFact.unit
                          ? ` ${targetFact.unit}`
                          : ''}
                      </p>
                    )}
                  </div>
                </div>

                <RelationshipBadge
                  relationship={relationship}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RelationshipGraph;
