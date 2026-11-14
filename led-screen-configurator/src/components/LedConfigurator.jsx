import React, { useState, useEffect, useMemo } from 'react';
import {
  Monitor,
  Settings,
  Zap,
  Layers,
  Grid,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Copy,
  Printer,
  Check,
  Cpu,
  Scale,
  ShieldAlert
} from 'lucide-react';
import {
  calculateLedConfig,
  generateSnakeRoute,
  CABINET_STANDARDS,
  LAYOUT_PRESETS,
  PORT_COLORS,
  POWER_COLORS
} from '../utils/ledCalcLogic';
import LedCanvas from './LedCanvas';
import LedExportModal from './LedExportModal';

export default function LedConfigurator() {
  // ── 1. Configuration State ──
  const [configType, setConfigType] = useState('Flat'); // 'Flat' | 'L-Shape' | 'Complex'
  const [faceA, setFaceA] = useState({ cols: 10, rows: 6 });
  const [faceB, setFaceB] = useState({ cols: 4, rows: 6 });
  const [screenElements, setScreenElements] = useState([
    { id: 'screen-main', name: 'Écran Principal', x: 180, y: 60, cols: 8, rows: 4 },
    { id: 'screen-dj', name: 'Façade DJ', x: 250, y: 240, cols: 4, rows: 2 }
  ]);
  const [selectedCabinetId, setSelectedCabinetId] = useState('p39-outdoor');

  // Custom Cabinet Override
  const [cabinetSpec, setCabinetSpec] = useState(CABINET_STANDARDS[0]);

  // ── 2. Cabling & Canvas State ──
  const [cablingMode, setCablingMode] = useState(true);
  const [viewMode, setViewMode] = useState('data'); // 'data' | 'power'
  const [activePort, setActivePort] = useState(1);
  const [signalPaths, setSignalPaths] = useState({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] });
  const [powerPaths, setPowerPaths] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [zoom, setZoom] = useState(1.0);

  // Dragging in complex mode
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Export Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  // Sync cabinet spec when dropdown changes
  const handleCabinetChange = (id) => {
    setSelectedCabinetId(id);
    const found = CABINET_STANDARDS.find(c => c.id === id);
    if (found) setCabinetSpec(found);
  };

  // Dynamic Calculation
  const stats = useMemo(() => {
    return calculateLedConfig({
      configType,
      faceA,
      faceB,
      screenElements,
      cabinetSpec
    });
  }, [configType, faceA, faceB, screenElements, cabinetSpec]);

  // Reset cabling on major shape change
  useEffect(() => {
    setSignalPaths({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] });
    setPowerPaths({ 1: [], 2: [], 3: [], 4: [] });
  }, [configType, faceA.cols, faceA.rows, faceB.cols, cabinetSpec.id]);

  // Keyboard navigation for precision routing
  useEffect(() => {
    if (!cablingMode) return;

    const handleKeyDown = (e) => {
      const activeSet = viewMode === 'data' ? signalPaths : powerPaths;
      const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;
      const currentPath = activeSet[activePort] || [];

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (currentPath.length > 0) {
          e.preventDefault();
          setFunction(prev => ({ ...prev, [activePort]: prev[activePort].slice(0, -1) }));
        }
        return;
      }

      if (currentPath.length === 0) return;
      const lastNode = currentPath[currentPath.length - 1];
      let { face, col, row } = lastNode;
      let nextFace = face;
      let nextCol = col;
      let nextRow = row;

      if (e.key === 'ArrowUp') nextRow -= 1;
      else if (e.key === 'ArrowDown') nextRow += 1;
      else if (e.key === 'ArrowLeft') nextCol -= 1;
      else if (e.key === 'ArrowRight') nextCol += 1;
      else return;

      // Bounds
      if (nextFace === 'A') {
        if (nextRow < 1 || nextRow > faceA.rows) return;
        if (nextCol < 1) return;
        if (nextCol > faceA.cols) {
          if (configType === 'L-Shape') {
            nextFace = 'B';
            nextCol = 1;
          } else {
            return;
          }
        }
      } else if (nextFace === 'B') {
        if (nextRow < 1 || nextRow > faceA.rows) return;
        if (nextCol > faceB.cols) return;
        if (nextCol < 1) {
          nextFace = 'A';
          nextCol = faceA.cols;
        }
      }

      e.preventDefault();
      handleTileClick(nextFace, nextCol, nextRow);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cablingMode, activePort, signalPaths, powerPaths, viewMode, faceA, faceB, configType]);

  // Click on tile to add or undo
  const handleTileClick = (face, col, row) => {
    if (!cablingMode) return;
    const id = `${face}-${col}-${row}`;
    const activeSet = viewMode === 'data' ? signalPaths : powerPaths;
    const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;
    const currentPath = activeSet[activePort] || [];

    const existingIndex = currentPath.findIndex(p => p.face === face && p.col === col && p.row === row);
    if (existingIndex !== -1) {
      if (existingIndex === currentPath.length - 1) {
        setFunction(prev => ({ ...prev, [activePort]: prev[activePort].slice(0, -1) }));
      } else {
        setFunction(prev => ({ ...prev, [activePort]: prev[activePort].slice(0, existingIndex + 1) }));
      }
      return;
    }

    // Check if tile already occupied in another port
    let isOccupied = false;
    Object.entries(activeSet).forEach(([port, path]) => {
      if (parseInt(port) !== activePort) {
        if (path.some(p => p.face === face && p.col === col && p.row === row)) {
          isOccupied = true;
        }
      }
    });

    if (isOccupied) return;

    // Check port capacity limit (approx 650 000 px or ~10m²)
    if (viewMode === 'data') {
      const tilePixels = stats.specs.pixelsPerTileTotal;
      const currentPixels = currentPath.length * tilePixels;
      if (currentPixels + tilePixels > 655360) {
        alert("Attention : La capacité maximale du port réseau Gigabit (650 000 px) est atteinte.");
        return;
      }
    }

    // Add to path
    setFunction(prev => ({
      ...prev,
      [activePort]: [...(prev[activePort] || []), { face, col, row, id }]
    }));
  };

  // Auto-cabling Snake Generators
  const handleGenerateSnake = (direction) => {
    const activeSet = viewMode === 'data' ? signalPaths : powerPaths;
    const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;
    const existingOccupied = Object.values(activeSet).flat();

    let newRoute = [];
    if (configType === 'Complex') {
      screenElements.forEach(el => {
        const seg = generateSnakeRoute({
          direction,
          faceName: el.id,
          cols: el.cols,
          rows: el.rows,
          existingPaths: existingOccupied
        });
        newRoute = [...newRoute, ...seg];
      });
    } else {
      const segA = generateSnakeRoute({
        direction,
        faceName: 'A',
        cols: faceA.cols,
        rows: faceA.rows,
        existingPaths: existingOccupied
      });
      newRoute = [...segA];

      if (configType === 'L-Shape') {
        const segB = generateSnakeRoute({
          direction,
          faceName: 'B',
          cols: faceB.cols,
          rows: faceA.rows,
          existingPaths: [...existingOccupied, ...newRoute]
        });
        newRoute = [...newRoute, ...segB];
      }
    }

    // Limit route to 650k px per port if data mode
    const maxTilesPerPort = Math.floor(650000 / stats.specs.pixelsPerTileTotal);
    const cappedRoute = newRoute.slice(0, maxTilesPerPort);

    setFunction(prev => ({
      ...prev,
      [activePort]: cappedRoute
    }));
  };

  const handleClearActivePort = () => {
    const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;
    setFunction(prev => ({ ...prev, [activePort]: [] }));
  };

  // Presets
  const handleApplyPreset = (preset) => {
    setConfigType(preset.configType);
    if (preset.faceA) setFaceA(preset.faceA);
    if (preset.faceB) setFaceB(preset.faceB);
    if (preset.screenElements) setScreenElements(preset.screenElements);
    if (preset.cabinetId) handleCabinetChange(preset.cabinetId);
  };

  // Drag in complex mode
  const handleMouseDown = (e, id) => {
    if (configType !== 'Complex' || cablingMode) return;
    setDraggingId(id);
    const el = screenElements.find(s => s.id === id);
    if (!el) return;
    setDragOffset({
      x: e.clientX - el.x,
      y: e.clientY - el.y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingId) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const snap = 38 / 2;
    const snappedX = Math.round(newX / snap) * snap;
    const snappedY = Math.round(newY / snap) * snap;

    setScreenElements(prev => prev.map(el =>
      el.id === draggingId ? { ...el, x: snappedX, y: snappedY } : el
    ));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleQuickCopy = async () => {
    const text = `Mur LED ${stats.dimensions.widthM}m × ${stats.dimensions.heightM}m (${stats.dimensions.surfaceM2} m²)\nRésolution: ${stats.resolution.totalW} × ${stats.resolution.totalH} px\n${stats.hardware.totalTiles} dalles ${cabinetSpec.name}\nPuissance max: ${stats.hardware.totalMaxPowerW}W (${stats.hardware.ampsAssuming230V}A)`;
    try {
      await navigator.clipboard.writeText(text);
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="led-app-layout" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Top Navbar */}
      <header className="led-navbar">
        <div className="navbar-left">
          <div className="navbar-logo-badge">
            <Monitor size={22} />
          </div>
          <div>
            <div className="navbar-brand">
              <span className="brand-title">LED Screen Configurator Pro</span>
              <span className="brand-tag">v2.0 Standalone</span>
            </div>
            <p className="navbar-sub">Cartographie, calcul photométrique & plan de câblage pour murs et scènes LED</p>
          </div>
        </div>

        <div className="navbar-right">
          <button
            type="button"
            className={`nav-btn btn-secondary ${quickCopied ? 'btn-success' : ''}`}
            onClick={handleQuickCopy}
          >
            {quickCopied ? <Check size={16} /> : <Copy size={16} />}
            <span>{quickCopied ? 'Copié !' : 'Copie Rapide'}</span>
          </button>
          <button
            type="button"
            className="nav-btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Printer size={16} />
            <span>Fiche Technique & Export</span>
          </button>
        </div>
      </header>

      {/* Quick Presets Bar */}
      <section className="presets-bar">
        <div className="presets-label">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Configurations Types :</span>
        </div>
        <div className="presets-scroll-list">
          {LAYOUT_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handleApplyPreset(p)}
              title={p.desc}
            >
              <span className="preset-name">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Workspace Layout */}
      <div className="led-workspace">
        {/* Left Control Sidebar */}
        <aside className="led-controls-panel">
          {/* Card: Layout Mode */}
          <div className="control-card">
            <div className="card-header">
              <div className="card-title">
                <span className="accent-pill" />
                <Grid size={16} className="text-blue" />
                <span>Format & Topologie</span>
              </div>
            </div>

            <div className="layout-modes-grid">
              <button
                type="button"
                className={`layout-mode-btn ${configType === 'Flat' ? 'active' : ''}`}
                onClick={() => setConfigType('Flat')}
              >
                <span>Mur Plat (16:9)</span>
                <small>Façade droite</small>
              </button>
              <button
                type="button"
                className={`layout-mode-btn ${configType === 'L-Shape' ? 'active' : ''}`}
                onClick={() => setConfigType('L-Shape')}
              >
                <span>Angle L (90°)</span>
                <small>Immersif 2 faces</small>
              </button>
              <button
                type="button"
                className={`layout-mode-btn ${configType === 'Complex' ? 'active' : ''}`}
                onClick={() => setConfigType('Complex')}
              >
                <span>Multi-Écrans</span>
                <small>Totems & Régie</small>
              </button>
            </div>
          </div>

          {/* Card: Modèle de Caisson LED */}
          <div className="control-card">
            <div className="card-header">
              <div className="card-title">
                <span className="accent-pill" />
                <Settings size={16} className="text-indigo" />
                <span>Spécification Caisson</span>
              </div>
            </div>

            <div className="form-group">
              <label className="field-label">Type de Panneau LED</label>
              <select
                className="select-custom"
                value={selectedCabinetId}
                onChange={(e) => handleCabinetChange(e.target.value)}
              >
                {CABINET_STANDARDS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.width}×{c.height}mm • {c.weight}kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="cabinet-info-box">
              <div className="info-chip">
                <span>Résolution native :</span>
                <strong>{stats.specs.pixelsPerTileW} × {stats.specs.pixelsPerTileH} px</strong>
              </div>
              <div className="info-chip">
                <span>Poids caisson :</span>
                <strong>{cabinetSpec.weight} kg</strong>
              </div>
              <div className="info-chip">
                <span>Puissance max :</span>
                <strong>{cabinetSpec.maxPower} W</strong>
              </div>
            </div>
          </div>

          {/* Card: Dimensions de l'Écran */}
          {configType !== 'Complex' ? (
            <div className="control-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="accent-pill" />
                  <Layers size={16} className="text-emerald" />
                  <span>Dimensions (Modules)</span>
                </div>
              </div>

              {/* Face A Width */}
              <div className="form-group">
                <div className="field-label-group">
                  <label className="field-label">Face A : Largeur</label>
                  <span className="field-conversion-badge">
                    {faceA.cols * (cabinetSpec.width / 1000)} m
                  </span>
                </div>
                <div className="stepper-box">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setFaceA(prev => ({ ...prev, cols: Math.max(1, prev.cols - 1) }))}
                  >
                    <Minus size={14} />
                  </button>
                  <div className="stepper-center">
                    <span className="stepper-val">{faceA.cols}</span>
                    <span className="stepper-unit">colonnes</span>
                  </div>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setFaceA(prev => ({ ...prev, cols: prev.cols + 1 }))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Face A Height */}
              <div className="form-group">
                <div className="field-label-group">
                  <label className="field-label">Face A : Hauteur</label>
                  <span className="field-conversion-badge">
                    {faceA.rows * (cabinetSpec.height / 1000)} m
                  </span>
                </div>
                <div className="stepper-box">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setFaceA(prev => ({ ...prev, rows: Math.max(1, prev.rows - 1) }))}
                  >
                    <Minus size={14} />
                  </button>
                  <div className="stepper-center">
                    <span className="stepper-val">{faceA.rows}</span>
                    <span className="stepper-unit">rangées</span>
                  </div>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setFaceA(prev => ({ ...prev, rows: prev.rows + 1 }))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Face B Width (if L-Shape) */}
              {configType === 'L-Shape' && (
                <div className="form-group">
                  <div className="field-label-group">
                    <label className="field-label">Face B : Retour (90°)</label>
                    <span className="field-conversion-badge">
                      {faceB.cols * (cabinetSpec.width / 1000)} m
                    </span>
                  </div>
                  <div className="stepper-box">
                    <button
                      type="button"
                      className="step-btn"
                      onClick={() => setFaceB(prev => ({ ...prev, cols: Math.max(1, prev.cols - 1) }))}
                    >
                      <Minus size={14} />
                    </button>
                    <div className="stepper-center">
                      <span className="stepper-val">{faceB.cols}</span>
                      <span className="stepper-unit">colonnes</span>
                    </div>
                    <button
                      type="button"
                      className="step-btn"
                      onClick={() => setFaceB(prev => ({ ...prev, cols: prev.cols + 1 }))}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Complex Elements Group Manager */
            <div className="control-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="accent-pill" />
                  <Layers size={16} className="text-emerald" />
                  <span>Blocs d'Écrans</span>
                </div>
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => setScreenElements(prev => [
                    ...prev,
                    {
                      id: `screen-${Date.now()}`,
                      name: `Écran ${prev.length + 1}`,
                      x: 100 + (prev.length * 30),
                      y: 100 + (prev.length * 30),
                      cols: 3,
                      rows: 3
                    }
                  ])}
                >
                  <Plus size={14} /> Ajouter Bloc
                </button>
              </div>

              <div className="complex-screens-list">
                {screenElements.map((el, i) => (
                  <div key={el.id} className="complex-screen-row">
                    <div className="complex-row-header">
                      <strong>{el.name}</strong>
                      <button
                        type="button"
                        className="del-icon-btn"
                        onClick={() => setScreenElements(screenElements.filter(s => s.id !== el.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="complex-inputs-pair">
                      <div>
                        <label>Cols</label>
                        <input
                          type="number"
                          value={el.cols}
                          min="1"
                          max="30"
                          onChange={(e) => {
                            const newCols = Math.max(1, parseInt(e.target.value) || 1);
                            setScreenElements(screenElements.map((s, idx) => idx === i ? { ...s, cols: newCols } : s));
                          }}
                        />
                      </div>
                      <div>
                        <label>Rows</label>
                        <input
                          type="number"
                          value={el.rows}
                          min="1"
                          max="20"
                          onChange={(e) => {
                            const newRows = Math.max(1, parseInt(e.target.value) || 1);
                            setScreenElements(screenElements.map((s, idx) => idx === i ? { ...s, rows: newRows } : s));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Câblage & Cartographie */}
          <div className="control-card">
            <div className="card-header">
              <div className="card-title">
                <span className="accent-pill" />
                <Zap size={16} className="text-amber" />
                <span>Câblage Signal & Puissance</span>
              </div>
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-pill ${viewMode === 'data' ? 'active-data' : ''}`}
                  onClick={() => setViewMode('data')}
                >
                  DATA (RJ45)
                </button>
                <button
                  type="button"
                  className={`view-pill ${viewMode === 'power' ? 'active-power' : ''}`}
                  onClick={() => setViewMode('power')}
                >
                  POWER (230V)
                </button>
              </div>
            </div>

            {/* Port Selector Chips */}
            <div className="ports-chips-grid">
              {(viewMode === 'data' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4]).map(p => {
                const currentPaths = viewMode === 'data' ? signalPaths : powerPaths;
                const portPath = currentPaths[p] || [];
                const color = viewMode === 'data' ? PORT_COLORS[p] : POWER_COLORS[p];
                const isSelected = activePort === p;

                return (
                  <button
                    key={p}
                    type="button"
                    className={`port-select-btn ${isSelected ? 'is-selected' : ''}`}
                    style={{
                      borderColor: color,
                      background: isSelected ? `${color}35` : 'transparent',
                      color: isSelected ? '#ffffff' : color
                    }}
                    onClick={() => setActivePort(p)}
                  >
                    <span className="port-number-tag">{viewMode === 'data' ? `P${p}` : `C${p}`}</span>
                    <span className="port-tiles-count">{portPath.length} caissons</span>
                  </button>
                );
              })}
            </div>

            {/* Auto Snake & Actions */}
            <div className="auto-snake-group">
              <span className="auto-label">Routage automatique du Port {activePort} :</span>
              <div className="auto-buttons-row">
                <button
                  type="button"
                  className="snake-btn"
                  onClick={() => handleGenerateSnake('horizontal')}
                >
                  <ArrowRight size={13} /> Snake Horizontal
                </button>
                <button
                  type="button"
                  className="snake-btn"
                  onClick={() => handleGenerateSnake('vertical')}
                >
                  <ArrowRight size={13} style={{ transform: 'rotate(90deg)' }} /> Snake Vertical
                </button>
              </div>
              <button
                type="button"
                className="clear-port-btn"
                onClick={handleClearActivePort}
              >
                <Trash2 size={13} /> Effacer le tracé du Port {activePort}
              </button>
            </div>
          </div>
        </aside>

        {/* Center / Right: Interactive Canvas & Viewport */}
        <main className="led-main-viewport">
          {/* Top Canvas Controls Bar */}
          <div className="viewport-top-bar">
            <div className="viewport-left-meta">
              <span className="meta-badge-view">
                Mode {viewMode === 'data' ? 'Signal Ethernet RJ45' : 'Alimentation Secteur 230V'}
              </span>
              <span className="meta-instructions">
                {cablingMode ? 'Cliquez sur les caissons ou utilisez les flèches du clavier' : 'Mode prévisualisation'}
              </span>
            </div>

            <div className="viewport-zoom-group">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                title="Zoom arrière"
              >
                <ZoomOut size={14} />
              </button>
              <span className="zoom-percentage">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
                title="Zoom avant"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoom(1.0)}
                title="Réinitialiser zoom"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Interactive LED Stage Canvas */}
          <div className="viewport-scrollable-stage">
            <LedCanvas
              configType={configType}
              faceA={faceA}
              faceB={faceB}
              screenElements={screenElements}
              stats={stats}
              cabinetSpec={cabinetSpec}
              cablingMode={cablingMode}
              viewMode={viewMode}
              activePort={activePort}
              signalPaths={signalPaths}
              powerPaths={powerPaths}
              zoom={zoom}
              onTileClick={handleTileClick}
              onMouseDown={handleMouseDown}
              draggingId={draggingId}
            />
          </div>

          {/* Bottom HUD Metrics Bar */}
          <footer className="led-bottom-hud">
            <div className="hud-metric">
              <span className="hud-label">Dimensions Hors-Tout</span>
              <strong className="hud-value text-blue">
                {stats.dimensions.widthM} m × {stats.dimensions.heightM} m
              </strong>
              <small className="hud-sub">{stats.dimensions.surfaceM2} m² • {stats.hardware.totalTiles} dalles</small>
            </div>

            <div className="hud-divider" />

            <div className="hud-metric">
              <span className="hud-label">Résolution Globale</span>
              <strong className="hud-value text-emerald">
                {stats.resolution.totalW} × {stats.resolution.totalH} px
              </strong>
              <small className="hud-sub">{stats.resolution.aspectRatio}</small>
            </div>

            <div className="hud-divider" />

            <div className="hud-metric">
              <span className="hud-label">Poids Total Suspendu</span>
              <strong className="hud-value text-purple">
                {stats.hardware.totalWeightKg} kg
              </strong>
              <small className="hud-sub">hors accroches</small>
            </div>

            <div className="hud-divider" />

            <div className="hud-metric">
              <span className="hud-label">Alimentation 230V</span>
              <strong className="hud-value text-amber">
                {stats.hardware.totalMaxPowerW.toLocaleString()} W
              </strong>
              <small className="hud-sub">{stats.hardware.ampsAssuming230V} A • {stats.hardware.recommendedCircuits16A} disjoncteurs 16A</small>
            </div>

            <div className="hud-divider" />

            <div className="hud-metric">
              <span className="hud-label">Processeur NovaStar</span>
              <strong className="hud-value text-indigo">
                {stats.hardware.requiredPortsEth} port(s) RJ45
              </strong>
              <small className="hud-sub">Gigabit Ethernet</small>
            </div>
          </footer>
        </main>
      </div>

      {/* Export Modal */}
      <LedExportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        stats={stats}
        configType={configType}
        cabinetSpec={cabinetSpec}
        faceA={faceA}
        faceB={faceB}
        screenElements={screenElements}
        signalPaths={signalPaths}
        powerPaths={powerPaths}
        viewMode={viewMode}
      />
    </div>
  );
}
