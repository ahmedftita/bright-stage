import React from 'react';
import { PORT_COLORS, POWER_COLORS } from '../utils/ledCalcLogic';

export default function LedCanvas({
  configType,
  faceA,
  faceB,
  screenElements,
  stats,
  cabinetSpec,
  cablingMode,
  viewMode, // 'data' | 'power'
  activePort,
  signalPaths,
  powerPaths,
  zoom,
  onTileClick,
  onMouseDown,
  draggingId
}) {
  const pxPerTile = 38; // Pixels per module in viewport
  const pathsToRender = viewMode === 'data' ? signalPaths : powerPaths;
  const colorsToRender = viewMode === 'data' ? PORT_COLORS : POWER_COLORS;
  const strokeWidth = viewMode === 'power' ? 3.5 : 2.5;

  return (
    <div
      id="led-canvas-export"
      className="led-canvas-board"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'center center'
      }}
    >
      {/* Dynamic Diagram Title (Visible on Export / Print) */}
      <div className="canvas-header-stamp">
        <span className="stamp-title">
          {viewMode === 'data' ? 'SCHÉMA DE CÂBLAGE SIGNAL (RJ45 / DATA)' : 'SCHÉMA DE DISTRIBUTION ÉLECTRIQUE (POWER)'}
        </span>
        <span className="stamp-sub">
          {configType === 'Complex'
            ? 'Configuration Multi-Écrans Déstructurée'
            : configType === 'L-Shape'
            ? `Angle en L 90° • Face A (${faceA.cols}×${faceA.rows}) + Face B (${faceB.cols}×${faceA.rows})`
            : `Mur Plat • ${faceA.cols}×${faceA.rows} caissons (${stats.dimensions.widthM}m × ${stats.dimensions.heightM}m)`}
          {' • '}Module {cabinetSpec.name}
        </span>
      </div>

      {/* Main Grid Wrapper with SVG Overlay */}
      <div className="canvas-elements-stage">
        {/* SVG CABLING OVERLAY */}
        <svg className="cabling-svg-layer">
          <defs>
            {Object.entries(PORT_COLORS).map(([port, color]) => (
              <marker
                key={`arrow-data-${port}`}
                id={`arrow-data-${port}`}
                markerWidth="5"
                markerHeight="5"
                refX="3"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L0,5 L5,2.5 z" fill={color} />
              </marker>
            ))}
            {Object.entries(POWER_COLORS).map(([circuit, color]) => (
              <marker
                key={`arrow-power-${circuit}`}
                id={`arrow-power-${circuit}`}
                markerWidth="5"
                markerHeight="5"
                refX="3"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L0,5 L5,2.5 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* Render Vector Cabling Paths */}
          {cablingMode && Object.entries(pathsToRender).map(([port, path]) => {
            const color = colorsToRender[port];
            return (
              <g key={`${viewMode}-${port}`}>
                {path.map((node, i) => {
                  if (i === 0) return null;
                  const prev = path[i - 1];

                  const getCoords = (n) => {
                    if (configType === 'Complex') {
                      const el = screenElements.find(s => s.id === n.face);
                      if (!el) return { x: 0, y: 0 };
                      return {
                        x: el.x + (n.col - 1) * pxPerTile + pxPerTile / 2,
                        y: el.y + (n.row - 1) * pxPerTile + pxPerTile / 2
                      };
                    }
                    const xBase = n.face === 'A' ? 0 : (faceA.cols * pxPerTile + 8);
                    return {
                      x: xBase + (n.col - 1) * pxPerTile + pxPerTile / 2,
                      y: (n.row - 1) * pxPerTile + pxPerTile / 2
                    };
                  };

                  const start = getCoords(prev);
                  const end = getCoords(node);

                  return (
                    <line
                      key={`${viewMode}-${port}-${i}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      markerEnd={`url(#arrow-${viewMode}-${port})`}
                      strokeDasharray={viewMode === 'power' ? '6,3' : 'none'}
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* 1. COMPLEX MODE ELEMENTS */}
        {configType === 'Complex' && screenElements.map((el) => (
          <div
            key={el.id}
            onMouseDown={(e) => onMouseDown && onMouseDown(e, el.id)}
            className={`complex-block-element ${draggingId === el.id ? 'is-dragging' : ''}`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.cols * pxPerTile}px`,
              height: `${el.rows * pxPerTile}px`,
              gridTemplateColumns: `repeat(${el.cols}, 1fr)`,
              gridTemplateRows: `repeat(${el.rows}, 1fr)`,
              cursor: cablingMode ? 'crosshair' : 'grab'
            }}
          >
            <div className="block-title-tag">{el.name} ({el.cols}×{el.rows})</div>
            {Array.from({ length: el.rows }).map((_, r) =>
              Array.from({ length: el.cols }).map((_, c) => {
                const row = r + 1;
                const col = c + 1;
                let occupiedPort = null;
                let pathIndex = -1;

                Object.entries(pathsToRender).forEach(([port, path]) => {
                  const idx = path.findIndex(p => p.face === el.id && p.col === col && p.row === row);
                  if (idx !== -1) {
                    occupiedPort = port;
                    pathIndex = idx;
                  }
                });

                return (
                  <div
                    key={`${el.id}-${col}-${row}`}
                    onClick={() => onTileClick && onTileClick(el.id, col, row)}
                    className="cabinet-tile"
                    style={{
                      background: occupiedPort ? `${colorsToRender[occupiedPort]}35` : 'rgba(255, 255, 255, 0.03)',
                      borderColor: occupiedPort ? colorsToRender[occupiedPort] : 'rgba(59, 130, 246, 0.3)'
                    }}
                    title={`${el.name} • C${col}:R${row}`}
                  >
                    {occupiedPort && (
                      <span className="cable-node-badge" style={{ color: colorsToRender[occupiedPort] }}>
                        {pathIndex + 1}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}

        {/* 2. FLAT & L-SHAPE MODE */}
        {configType !== 'Complex' && (
          <div className="standard-screens-row">
            {/* FACE A (MAIN) */}
            <div
              className="screen-face face-a"
              style={{
                width: `${faceA.cols * pxPerTile}px`,
                height: `${faceA.rows * pxPerTile}px`,
                gridTemplateColumns: `repeat(${faceA.cols}, 1fr)`,
                gridTemplateRows: `repeat(${faceA.rows}, 1fr)`
              }}
            >
              <div className="face-header-label face-a-label">
                FACE A (Façade Principale : {faceA.cols * (cabinetSpec.width / 1000)}m × {faceA.rows * (cabinetSpec.height / 1000)}m)
              </div>

              {Array.from({ length: faceA.rows }).map((_, r) =>
                Array.from({ length: faceA.cols }).map((_, c) => {
                  const row = r + 1;
                  const col = c + 1;
                  let occupiedPort = null;
                  let pathIndex = -1;

                  Object.entries(pathsToRender).forEach(([port, path]) => {
                    const idx = path.findIndex(p => p.face === 'A' && p.col === col && p.row === row);
                    if (idx !== -1) {
                      occupiedPort = port;
                      pathIndex = idx;
                    }
                  });

                  return (
                    <div
                      key={`A-${col}-${row}`}
                      onClick={() => onTileClick && onTileClick('A', col, row)}
                      className="cabinet-tile"
                      style={{
                        background: occupiedPort ? `${colorsToRender[occupiedPort]}35` : 'rgba(30, 41, 59, 0.4)',
                        borderColor: occupiedPort ? colorsToRender[occupiedPort] : 'rgba(99, 102, 241, 0.35)'
                      }}
                      title={`Face A • Col ${col}, Rang ${row} • ${(col - 1) * (cabinetSpec.width / 1000)}m`}
                    >
                      {occupiedPort ? (
                        <span className="cable-node-badge" style={{ color: colorsToRender[occupiedPort] }}>
                          {pathIndex + 1}
                        </span>
                      ) : (
                        <span className="tile-pos-hint">{col},{row}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* FACE B (RETURN IF L-SHAPE) */}
            {configType === 'L-Shape' && (
              <div
                className="screen-face face-b"
                style={{
                  width: `${faceB.cols * pxPerTile}px`,
                  height: `${faceA.rows * pxPerTile}px`,
                  gridTemplateColumns: `repeat(${faceB.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${faceA.rows}, 1fr)`
                }}
              >
                <div className="face-header-label face-b-label">
                  FACE B (Retour Angle 90° : {faceB.cols * (cabinetSpec.width / 1000)}m)
                </div>

                {Array.from({ length: faceA.rows }).map((_, r) =>
                  Array.from({ length: faceB.cols }).map((_, c) => {
                    const row = r + 1;
                    const col = c + 1;
                    let occupiedPort = null;
                    let pathIndex = -1;

                    Object.entries(pathsToRender).forEach(([port, path]) => {
                      const idx = path.findIndex(p => p.face === 'B' && p.col === col && p.row === row);
                      if (idx !== -1) {
                        occupiedPort = port;
                        pathIndex = idx;
                      }
                    });

                    return (
                      <div
                        key={`B-${col}-${row}`}
                        onClick={() => onTileClick && onTileClick('B', col, row)}
                        className="cabinet-tile"
                        style={{
                          background: occupiedPort ? `${colorsToRender[occupiedPort]}35` : 'rgba(6, 182, 212, 0.1)',
                          borderColor: occupiedPort ? colorsToRender[occupiedPort] : 'rgba(6, 182, 212, 0.35)'
                        }}
                        title={`Face B • Col ${col}, Rang ${row}`}
                      >
                        {occupiedPort ? (
                          <span className="cable-node-badge" style={{ color: colorsToRender[occupiedPort] }}>
                            {pathIndex + 1}
                          </span>
                        ) : (
                          <span className="tile-pos-hint">{col},{row}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Human Scale Reference (1.80 m) */}
      <div className="human-scale-reference" title="Échelle humaine 1.80 m">
        <div className="person-figure" style={{ height: `${(1.8 / (cabinetSpec.height / 1000)) * pxPerTile}px` }}>
          <div className="person-head" />
          <div className="person-body" />
        </div>
        <span className="scale-label">1.80 m</span>
      </div>
    </div>
  );
}
