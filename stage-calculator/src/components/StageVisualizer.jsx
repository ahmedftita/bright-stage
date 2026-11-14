import React, { useState } from 'react';
import { Eye, Layers, ZoomIn, ZoomOut, RotateCcw, Box } from 'lucide-react';

export default function StageVisualizer({ calculation }) {
  const [showLegs, setShowLegs] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [viewMode, setViewMode] = useState('2d'); // '2d' (plan) | 'elevation' (coupe de profil)
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!calculation) return null;

  const { modules, physicalDimensions, counts, heightSpec } = calculation;
  const { length: L, width: W } = modules;
  const { lengthM, widthM, heightM } = physicalDimensions;

  const totalTiles = L * W;

  return (
    <div className="visualizer-container">
      {/* Visualizer Top Bar */}
      <div className="visualizer-header">
        <div className="visualizer-tabs">
          <button
            type="button"
            className={`vis-tab-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            <Layers size={15} />
            <span>Vue en Plan (2D)</span>
          </button>
          <button
            type="button"
            className={`vis-tab-btn ${viewMode === 'elevation' ? 'active' : ''}`}
            onClick={() => setViewMode('elevation')}
          >
            <Box size={15} />
            <span>Vue Élévation (Profil)</span>
          </button>
        </div>

        {/* View Options */}
        <div className="visualizer-actions">
          {viewMode === '2d' && (
            <>
              <button
                type="button"
                className={`vis-toggle-pill ${showLegs ? 'active' : ''}`}
                onClick={() => setShowLegs(!showLegs)}
                title="Afficher/Masquer les points d'ancrage des pieds"
              >
                <span className="pill-dot" style={{ background: showLegs ? '#10b981' : '#64748b' }} />
                <span>Stage pieds ({counts.stagePieds})</span>
              </button>
              <button
                type="button"
                className={`vis-toggle-pill ${showNumbers ? 'active' : ''}`}
                onClick={() => setShowNumbers(!showNumbers)}
                title="Numéroter les praticables"
              >
                <span className="pill-dot" style={{ background: showNumbers ? '#818cf8' : '#64748b' }} />
                <span>Numéros</span>
              </button>
              <div className="vis-zoom-controls">
                <button
                  type="button"
                  className="vis-zoom-btn"
                  onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.15))}
                  title="Zoom -"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  className="vis-zoom-btn"
                  onClick={() => setZoomLevel(1)}
                  title="Réinitialiser zoom"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  type="button"
                  className="vis-zoom-btn"
                  onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.15))}
                  title="Zoom +"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="visualizer-canvas-wrapper">
        {viewMode === '2d' ? (
          <div className="plan-view" style={{ transform: `scale(${zoomLevel})` }}>
            {/* Stage Orientation: Backstage / Fond de Scène */}
            <div className="stage-marker back-marker">
              <span>▲ FOND DE SCÈNE / RÉGIE</span>
            </div>

            {/* Stage Dimension Top */}
            <div className="dim-axis dim-horizontal">
              <span className="dim-line-left" />
              <span className="dim-badge">
                Longueur (L) : <strong>{lengthM} m</strong> ({L} modules × 1,22 m)
              </span>
              <span className="dim-line-right" />
            </div>

            {/* Stage Grid Layout with Side Dimension */}
            <div className="stage-board-with-axis">
              {/* Left dimension (Width) */}
              <div className="dim-axis dim-vertical">
                <span className="dim-badge-vertical">
                  Largeur (l) : <strong>{widthM} m</strong> ({W} modules × 1,22 m)
                </span>
              </div>

              {/* Grid of Decks */}
              <div
                className="deck-interactive-grid"
                style={{
                  gridTemplateColumns: `repeat(${L}, minmax(36px, 64px))`,
                  gridTemplateRows: `repeat(${W}, minmax(36px, 64px))`
                }}
              >
                {Array.from({ length: totalTiles }).map((_, index) => {
                  const col = (index % L) + 1;
                  const row = Math.floor(index / L) + 1;
                  return (
                    <div
                      key={index}
                      className="deck-tile-cell"
                      title={`Stage plaque #${index + 1} (Col ${col}, Rang ${row}) — 1,22 × 1,22 m`}
                    >
                      {showNumbers && <span className="deck-number-label">#{index + 1}</span>}
                      <span className="deck-sub-dim">1.22m</span>
                    </div>
                  );
                })}

                {/* Overlaid Leg Markers at Nodes */}
                {showLegs && (
                  <div
                    className="legs-overlay-grid"
                    style={{
                      gridTemplateColumns: `repeat(${L + 1}, 1fr)`,
                      gridTemplateRows: `repeat(${W + 1}, 1fr)`
                    }}
                  >
                    {Array.from({ length: (L + 1) * (W + 1) }).map((_, legIdx) => (
                      <div
                        key={legIdx}
                        className="leg-node-marker"
                        title={`Stage pied #${legIdx + 1} (Tube Ø 50mm × 3mm avec vérin)`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Stairs indicator if included */}
              {counts.stairs > 0 && (
                <div className="stairs-blueprint-indicator" title={`Escalier de scène (${counts.stairSteps} marches)`}>
                  <div className="stair-steps-mini">
                    {Array.from({ length: Math.min(counts.stairSteps, 5) }).map((_, s) => (
                      <div key={s} className="stair-step-line" />
                    ))}
                  </div>
                  <span className="stair-label">Escalier</span>
                </div>
              )}
            </div>

            {/* Stage Front: Public / Face Scène */}
            <div className="stage-marker front-marker">
              <span>▼ FACE SCÈNE / PUBLIC</span>
            </div>
          </div>
        ) : (
          /* Elevation / Profile View */
          <div className="elevation-view">
            <div className="elevation-card">
              <div className="elevation-title">
                <span>Élévation Frontale & Profil Technique</span>
                <span className="elevation-badge">Hauteur sous plancher : {Math.round(heightM * 100)} cm</span>
              </div>

              <div className="elevation-drawing">
                {/* Surface line */}
                <div className="elevation-stage-deck">
                  <div className="deck-top-surface">
                    <span className="surface-text">Stage plaques antidérapantes 18 mm ({lengthM} m)</span>
                  </div>

                  {/* Legs profile */}
                  <div className="elevation-legs-row">
                    {Array.from({ length: Math.min(L + 1, 10) }).map((_, idx) => (
                      <div key={idx} className="elevation-leg" title="Stage pied Tube Ø 50mm × 3mm avec vérin">
                        <div className="leg-foot" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stairs profile if attached */}
                {counts.stairs > 0 && (
                  <div className="elevation-stairs-side">
                    {Array.from({ length: counts.stairSteps }).map((_, sIdx) => (
                      <div
                        key={sIdx}
                        className="elevation-stair-step"
                        style={{ height: `${(counts.stairSteps - sIdx) * 18}px` }}
                      />
                    ))}
                    <span className="elevation-stair-title">Escalier</span>
                  </div>
                )}
              </div>

              {/* Ground level line */}
              <div className="elevation-ground-line">
                <span>NIVEAU DU SOL (0.00 m) • VÉRINS RÉGLABLES</span>
              </div>

              {/* Technical Specifications Summary Footer */}
              <div className="elevation-specs-pills">
                <div className="elev-pill">
                  <span className="elev-pill-title">Hauteur sol-scène :</span>
                  <span className="elev-pill-val">{Math.round(heightM * 100)} cm</span>
                </div>
                <div className="elev-pill">
                  <span className="elev-pill-title">Stage plaques en longueur :</span>
                  <span className="elev-pill-val">{L} plaques</span>
                </div>
                <div className="elev-pill">
                  <span className="elev-pill-title">Total Stage pieds :</span>
                  <span className="elev-pill-val">{counts.stagePieds} pieds</span>
                </div>
                <div className="elev-pill">
                  <span className="elev-pill-title">Total Stage côtés :</span>
                  <span className="elev-pill-val">{counts.stageCotes} cadres</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visualizer Footer Metadata */}
      <div className="visualizer-footer">
        <div className="vis-stat-group">
          <span className="vis-stat-label">Configuration :</span>
          <strong className="vis-stat-value">{L} × {W} modules</strong>
          <span className="vis-dot">•</span>
          <span className="vis-stat-label">Dimensions réelles :</span>
          <strong className="vis-stat-value">{lengthM} × {widthM} m</strong>
          <span className="vis-dot">•</span>
          <span className="vis-stat-label">Surface totale :</span>
          <strong className="vis-stat-value text-emerald">{physicalDimensions.surfaceM2} m²</strong>
        </div>

        <div className="vis-legend">
          <span className="legend-item">
            <span className="legend-box deck-box" /> Stage plaque ({counts.stagePlaques})
          </span>
          <span className="legend-item">
            <span className="legend-box leg-box" /> Stage pied ({counts.stagePieds})
          </span>
          <span className="legend-item">
            <span className="legend-box" style={{ background: '#f59e0b', borderRadius: '2px' }} /> Stage côté ({counts.stageCotes})
          </span>
        </div>
      </div>
    </div>
  );
}
