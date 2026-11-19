import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import {
  Layers,
  Wrench,
  Monitor,
  Sun,
  Zap,
  Scale,
  Save,
  FolderOpen,
  Printer,
  Sparkles,
  Camera,
  FileText,
  Sliders,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Moon,
  Package,
  Eye
} from 'lucide-react';

import FullStage3D from './FullStage3D';
import SaveConceptionModal from './SaveConceptionModal';
import SavedConceptionsModal from './SavedConceptionsModal';
import FullStageExportModal from './FullStageExportModal';

import {
  STAGE_HEIGHTS,
  TRUSS_SERIES,
  LED_PITCHES,
  calculateFullConception
} from '../utils/conceptionLogic';
import './FullStageStudio.css';

// Scene capture helper
const SceneCapture = ({ captureRef }) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    captureRef.current = {
      captureToDataUrl: () => {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      },
      download: (filename) => {
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      }
    };
  }, [gl, scene, camera]);

  return null;
};

export default function FullStageStudio() {
  // Event Context
  const [eventName, setEventName] = useState('Festival International de Carthage 2026 — Scène Complète');
  const [siteName, setSiteName] = useState('Amphithéâtre Romain de Carthage');
  const [activeConceptionId, setActiveConceptionId] = useState(null);

  // Active Tab: 'stage' | 'structure' | 'screen' | 'lighting'
  const [activeTab, setActiveTab] = useState('stage');

  // Studio Atmosphere
  const [nightMode, setNightMode] = useState(true);
  const [viewMode, setViewMode] = useState('3D');

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Captures
  const captureRef = useRef(null);
  const [capture3DUrl, setCapture3DUrl] = useState(null);
  const [capturePlanUrl, setCapturePlanUrl] = useState(null);

  // CONFIGURATION STATE
  const [stageState, setStageState] = useState({
    lengthModules: 6,
    widthModules: 4,
    heightId: 'h75',
    hasStairs: true,
    stairsCount: 1,
    stairsSide: 'right',
    hasSkirting: true
  });

  const [structureState, setStructureState] = useState({
    structureType: 'grid',
    towerType: 'PT34',
    gridTypeL: 'HT44',
    gridTypeW: 'PT34',
    length: 10,
    width: 8,
    height: 6
  });

  const [screenState, setScreenState] = useState({
    pitch: 'P3.9',
    mountType: 'suspended_truss',
    cabinetsW: 12,
    cabinetsH: 6
  });

  const [lightingState, setLightingState] = useState({
    beamsCount: 8,
    spotsCount: 6,
    washesCount: 8,
    ledBarsCount: 6,
    blindersCount: 4,
    hazerCount: 2,
    showBeams: true,
    beamColor: '#38bdf8'
  });

  const conception = useMemo(() => {
    return calculateFullConception({
      stage: stageState,
      structure: structureState,
      screen: screenState,
      lighting: lightingState
    });
  }, [stageState, structureState, screenState, lightingState]);

  const adjustStageModules = (field, delta) => {
    setStageState(prev => ({
      ...prev,
      [field]: Math.max(1, Math.min(20, (prev[field] || 1) + delta))
    }));
  };

  const adjustStructureDim = (field, delta) => {
    setStructureState(prev => ({
      ...prev,
      [field]: Math.max(3, Math.min(40, (parseFloat(prev[field]) || 0) + delta))
    }));
  };

  const adjustScreenCabinets = (field, delta) => {
    setScreenState(prev => ({
      ...prev,
      [field]: Math.max(2, Math.min(30, (prev[field] || 2) + delta))
    }));
  };

  const adjustLightingFixture = (field, delta) => {
    setLightingState(prev => ({
      ...prev,
      [field]: Math.max(0, Math.min(32, (prev[field] || 0) + delta))
    }));
  };

  const applyConceptionPreset = (preset) => {
    if (preset.eventName) setEventName(preset.eventName);
    if (preset.siteName) setSiteName(preset.siteName);
    if (preset.stage) setStageState(prev => ({ ...prev, ...preset.stage }));
    if (preset.structure) setStructureState(prev => ({ ...prev, ...preset.structure }));
    if (preset.screen) setScreenState(prev => ({ ...prev, ...preset.screen }));
    if (preset.lighting) setLightingState(prev => ({ ...prev, ...preset.lighting }));
  };

  const handleLoadConception = (item) => {
    setActiveConceptionId(item._id);
    setEventName(item.eventName || 'Conception Scénique');
    setSiteName(item.siteName || '');

    if (item.stageConfig) {
      setStageState({
        lengthModules: item.stageConfig.lengthModules || 6,
        widthModules: item.stageConfig.widthModules || 4,
        heightId: item.stageConfig.heightM === 0.55 ? 'h55' : (item.stageConfig.heightM === 1.0 ? 'h100' : 'h75'),
        hasStairs: item.stageConfig.hasStairs !== false,
        stairsCount: item.stageConfig.stairsCount || 1,
        stairsSide: item.stageConfig.stairsSide || 'right',
        hasSkirting: item.stageConfig.hasSkirting !== false
      });
    }

    if (item.structureConfig) {
      setStructureState({
        structureType: item.structureConfig.structureType || 'grid',
        towerType: item.structureConfig.towerType || 'PT34',
        gridTypeL: item.structureConfig.gridTypeL || 'HT44',
        gridTypeW: item.structureConfig.gridTypeW || 'PT34',
        length: item.structureConfig.length || 10,
        width: item.structureConfig.width || 8,
        height: item.structureConfig.height || 6
      });
    }

    if (item.screenConfig) {
      setScreenState({
        pitch: item.screenConfig.pitch || 'P3.9',
        mountType: item.screenConfig.mountType || 'suspended_truss',
        cabinetsW: item.screenConfig.cabinetsW || 12,
        cabinetsH: item.screenConfig.cabinetsH || 6
      });
    }

    if (item.lightingConfig) {
      setLightingState({
        beamsCount: item.lightingConfig.beamsCount ?? 8,
        spotsCount: item.lightingConfig.spotsCount ?? 6,
        washesCount: item.lightingConfig.washesCount ?? 8,
        ledBarsCount: item.lightingConfig.ledBarsCount ?? 6,
        blindersCount: item.lightingConfig.blindersCount ?? 4,
        hazerCount: item.lightingConfig.hazerCount ?? 2,
        showBeams: item.lightingConfig.showBeams !== false,
        beamColor: item.lightingConfig.beamColor || '#38bdf8'
      });
    }
  };

  const prepareExport = () => {
    if (captureRef.current) {
      try {
        const url = captureRef.current.captureToDataUrl();
        if (viewMode === '3D') {
          setCapture3DUrl(url);
        } else {
          setCapturePlanUrl(url);
        }
      } catch (e) {
        console.warn("Capture error:", e);
      }
    }
    setIsExportModalOpen(true);
  };

  return (
    <div className="structure-app-layout" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top Bar inside client */}
      <div className="structure-navbar" style={{ position: 'relative' }}>
        <div className="navbar-left">
          <div className="navbar-logo-badge" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(99,102,241,0.3) 100%)' }}>
            <span style={{ color: '#ec4899', fontSize: '18px', fontWeight: 900 }}>B</span>
            <span style={{ color: '#818cf8', fontSize: '18px', fontWeight: 900 }}>S</span>
          </div>
          <div>
            <div className="navbar-brand">
              <span className="brand-title">Studio Conception Scénique 3D</span>
              <span className="brand-tag" style={{ background: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.4)', color: '#f472b6' }}>
                SCÈNE • TRUSS • LED • LUMIÈRE
              </span>
            </div>
          </div>
        </div>

        <div className="navbar-event-pill" onClick={() => setIsSavedModalOpen(true)} title="Changer d'événement">
          <Sparkles size={14} className="text-amber" />
          <div className="event-pill-text">
            <span className="event-pill-label">Événement Actif :</span>
            <span className="event-pill-name">{eventName}</span>
          </div>
          <ChevronDown size={14} className="text-muted" />
        </div>

        <div className="navbar-right">
          <button type="button" className="action-btn btn-secondary" onClick={() => setIsSavedModalOpen(true)}>
            <FolderOpen size={16} />
            <span className="btn-text">Modèles Enregistrés</span>
          </button>
          <button type="button" className="action-btn btn-secondary" onClick={() => setIsSaveModalOpen(true)}>
            <Save size={16} />
            <span className="btn-text">Enregistrer</span>
          </button>
          <button
            type="button"
            className="action-btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
            onClick={prepareExport}
          >
            <Printer size={16} />
            <span className="btn-text">Fiche Technique PDF</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="structure-main-workspace">
        {/* Left Sidebar */}
        <aside className="structure-sidebar" style={{ width: '380px', minWidth: '340px' }}>
          {/* Quick Presets */}
          <div className="sidebar-section">
            <div className="section-header">
              <Sparkles size={14} className="text-amber" />
              <span className="section-title">Presets Scéniques</span>
            </div>
            <div className="presets-pill-grid">
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Festival International de Carthage 2026 — Scène Principale',
                  siteName: 'Amphithéâtre Romain',
                  stage: { lengthModules: 6, widthModules: 4, heightId: 'h75', hasStairs: true, stairsCount: 1 },
                  structure: { structureType: 'grid', towerType: 'PT34', gridTypeL: 'HT44', length: 10, width: 8, height: 6 },
                  screen: { pitch: 'P3.9', mountType: 'suspended_truss', cabinetsW: 12, cabinetsH: 6 },
                  lighting: { beamsCount: 8, spotsCount: 6, washesCount: 8, ledBarsCount: 6, blindersCount: 4, hazerCount: 2, showBeams: true, beamColor: '#38bdf8' }
                })}
              >
                Festival 8×6
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Concert Symphonique Arena — Arche Goalpost',
                  siteName: 'Palais des Congrès',
                  stage: { lengthModules: 8, widthModules: 6, heightId: 'h100', hasStairs: true, stairsCount: 2 },
                  structure: { structureType: 'goalpost', towerType: 'PT34', gridTypeL: 'HT44', length: 10, width: 4, height: 7 },
                  screen: { pitch: 'P2.9', mountType: 'suspended_truss', cabinetsW: 16, cabinetsH: 8 },
                  lighting: { beamsCount: 6, spotsCount: 4, washesCount: 6, ledBarsCount: 8, blindersCount: 2, hazerCount: 1, showBeams: true, beamColor: '#f59e0b' }
                })}
              >
                Arena 10×7
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Gala Prestige & Soirée Corporate',
                  siteName: 'Salle Polyvalente',
                  stage: { lengthModules: 4, widthModules: 3, heightId: 'h55', hasStairs: true, stairsCount: 1 },
                  structure: { structureType: 'grid', towerType: 'PT34', gridTypeL: 'PT34', length: 7, width: 5, height: 5 },
                  screen: { pitch: 'P2.6', mountType: 'ground_stack', cabinetsW: 8, cabinetsH: 5 },
                  lighting: { beamsCount: 4, spotsCount: 4, washesCount: 6, ledBarsCount: 4, blindersCount: 0, hazerCount: 1, showBeams: true, beamColor: '#a855f7' }
                })}
              >
                Gala 5×4
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Stadium Live Outdoor',
                  siteName: 'Stade Olympique',
                  stage: { lengthModules: 10, widthModules: 8, heightId: 'h100', hasStairs: true, stairsCount: 2 },
                  structure: { structureType: 'grid', towerType: 'HT44', gridTypeL: 'TT104', length: 14, width: 12, height: 8 },
                  screen: { pitch: 'P3.9', mountType: 'suspended_truss', cabinetsW: 20, cabinetsH: 10 },
                  lighting: { beamsCount: 16, spotsCount: 12, washesCount: 16, ledBarsCount: 12, blindersCount: 8, hazerCount: 4, showBeams: true, beamColor: '#38bdf8' }
                })}
              >
                Stadium 12×10
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="segmented-toggle">
            <button
              type="button"
              className={`segment-btn ${activeTab === 'stage' ? 'active' : ''}`}
              onClick={() => setActiveTab('stage')}
            >
              <Layers size={13} />
              <span>Scène</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'structure' ? 'active' : ''}`}
              onClick={() => setActiveTab('structure')}
            >
              <Wrench size={13} />
              <span>Truss</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'screen' ? 'active' : ''}`}
              onClick={() => setActiveTab('screen')}
            >
              <Monitor size={13} />
              <span>Écran</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'lighting' ? 'active' : ''}`}
              onClick={() => setActiveTab('lighting')}
            >
              <Sun size={13} />
              <span>Lumière</span>
            </button>
          </div>

          {/* TAB 1: SCÈNE */}
          {activeTab === 'stage' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Layers size={15} className="text-indigo" />
                <span className="section-title">Paramètres Podium Scénique</span>
              </div>

              <div className="dimensions-box">
                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Longueur Scène</span>
                    <span className="stepper-sub">{conception.stage.dimensions.lengthM} m ({stageState.lengthModules} modules)</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustStageModules('lengthModules', -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{stageState.lengthModules}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustStageModules('lengthModules', 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Largeur Scène</span>
                    <span className="stepper-sub">{conception.stage.dimensions.widthM} m ({stageState.widthModules} modules)</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustStageModules('widthModules', -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{stageState.widthModules}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustStageModules('widthModules', 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hauteur Praticables</label>
                <div className="segmented-toggle">
                  {Object.values(STAGE_HEIGHTS).map(h => (
                    <button
                      key={h.id}
                      type="button"
                      className={`segment-btn ${stageState.heightId === h.id ? 'active' : ''}`}
                      onClick={() => setStageState(prev => ({ ...prev, heightId: h.id }))}
                    >
                      {Math.round(h.heightM * 100)} cm
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Escalier</label>
                  <select
                    className="form-select"
                    value={stageState.stairsCount}
                    onChange={(e) => setStageState(prev => ({ ...prev, stairsCount: parseInt(e.target.value) }))}
                  >
                    <option value={0}>Aucun</option>
                    <option value={1}>1 Escalier</option>
                    <option value={2}>2 Escaliers</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    className="form-select"
                    value={stageState.stairsSide}
                    onChange={(e) => setStageState(prev => ({ ...prev, stairsSide: e.target.value }))}
                  >
                    <option value="right">Côté Droit</option>
                    <option value="left">Côté Gauche</option>
                    <option value="both">Deux Côtés</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Wrench size={15} className="text-cyan" />
                <span className="section-title">Paramètres Structure Truss</span>
              </div>

              <div className="form-group">
                <label className="form-label">Type d'Architecture</label>
                <div className="segmented-toggle">
                  <button
                    type="button"
                    className={`segment-btn ${structureState.structureType === 'grid' ? 'active' : ''}`}
                    onClick={() => setStructureState(prev => ({ ...prev, structureType: 'grid' }))}
                  >
                    Gril (Box Grid)
                  </button>
                  <button
                    type="button"
                    className={`segment-btn ${structureState.structureType === 'goalpost' ? 'active' : ''}`}
                    onClick={() => setStructureState(prev => ({ ...prev, structureType: 'goalpost' }))}
                  >
                    Arche (Goalpost)
                  </button>
                </div>
              </div>

              <div className="dimensions-box">
                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Longueur Portée (m)</span>
                    <span className="stepper-sub">Axe principal</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustStructureDim('length', -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{structureState.length}m</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustStructureDim('length', 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {structureState.structureType === 'grid' && (
                  <div className="stepper-row">
                    <div className="stepper-meta">
                      <span className="stepper-title">Largeur Portée (m)</span>
                      <span className="stepper-sub">Profondeur gril</span>
                    </div>
                    <div className="stepper-controls">
                      <button type="button" className="stepper-btn" onClick={() => adjustStructureDim('width', -1)}>
                        <Minus size={14} />
                      </button>
                      <span className="stepper-input">{structureState.width}m</span>
                      <button type="button" className="stepper-btn" onClick={() => adjustStructureDim('width', 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Hauteur Dégagement (m)</span>
                    <span className="stepper-sub">Hauteur sous pont</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustStructureDim('height', -0.5)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{structureState.height}m</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustStructureDim('height', 0.5)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ÉCRAN LED */}
          {activeTab === 'screen' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Monitor size={15} className="text-cyan" />
                <span className="section-title">Paramètres Écran LED</span>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Pitch</label>
                  <select
                    className="form-select"
                    value={screenState.pitch}
                    onChange={(e) => setScreenState(prev => ({ ...prev, pitch: e.target.value }))}
                  >
                    <option value="P2.6">P2.6 (Haute Déf)</option>
                    <option value="P2.9">P2.9 (Concert)</option>
                    <option value="P3.9">P3.9 (Festival Standard)</option>
                    <option value="P4.8">P4.8 (Stadium)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fixation</label>
                  <select
                    className="form-select"
                    value={screenState.mountType}
                    onChange={(e) => setScreenState(prev => ({ ...prev, mountType: e.target.value }))}
                  >
                    <option value="suspended_truss">Suspendu Pont</option>
                    <option value="ground_stack">Posé au sol</option>
                  </select>
                </div>
              </div>

              <div className="dimensions-box">
                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Largeur Écran</span>
                    <span className="stepper-sub">{conception.screen.dimensions.widthM}m ({screenState.cabinetsW} dalles)</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustScreenCabinets('cabinetsW', -2)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{screenState.cabinetsW}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustScreenCabinets('cabinetsW', 2)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Hauteur Écran</span>
                    <span className="stepper-sub">{conception.screen.dimensions.heightM}m ({screenState.cabinetsH} dalles)</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustScreenCabinets('cabinetsH', -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{screenState.cabinetsH}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustScreenCabinets('cabinetsH', 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LUMIÈRE */}
          {activeTab === 'lighting' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Sun size={15} className="text-amber" />
                <span className="section-title">Parc Projecteurs & Show</span>
              </div>

              <div className="dimensions-box">
                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Beams 7R / 10R</span>
                    <span className="stepper-sub">Faisceaux pont arrière</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('beamsCount', -2)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{lightingState.beamsCount}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('beamsCount', 2)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Spots Profile LED</span>
                    <span className="stepper-sub">Découpe pont avant</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('spotsCount', -2)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{lightingState.spotsCount}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('spotsCount', 2)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Washes LED RGBW</span>
                    <span className="stepper-sub">Bains de couleurs</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('washesCount', -2)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{lightingState.washesCount}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('washesCount', 2)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Blinders 4-Lite</span>
                    <span className="stepper-sub">Face public</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('blindersCount', -2)}>
                      <Minus size={14} />
                    </button>
                    <span className="stepper-input">{lightingState.blindersCount}</span>
                    <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('blindersCount', 2)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Faisceaux 3D</label>
                  <button
                    type="button"
                    className={`action-btn ${lightingState.showBeams ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setLightingState(prev => ({ ...prev, showBeams: !prev.showBeams }))}
                  >
                    <Eye size={14} />
                    <span>{lightingState.showBeams ? 'Actifs' : 'Masqués'}</span>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Teinte</label>
                  <select
                    className="form-select"
                    value={lightingState.beamColor}
                    onChange={(e) => setLightingState(prev => ({ ...prev, beamColor: e.target.value }))}
                  >
                    <option value="#38bdf8">Cyan Électrique</option>
                    <option value="#fbbf24">Ambre Concert</option>
                    <option value="#ec4899">Magenta</option>
                    <option value="#a855f7">Pourpre</option>
                    <option value="#ffffff">Blanc Pur</option>
                    <option value="#10b981">Vert Laser</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Consolidated Metrics */}
          <div className="load-analysis-card" style={{ marginTop: 'auto' }}>
            <div className="analysis-header">
              <Scale size={16} className="text-amber" />
              <span className="analysis-title">Bilan Global des Charges & Puissance</span>
            </div>

            <div className="analysis-metrics">
              <div className="metric-item">
                <span className="metric-label">Charge Suspendue</span>
                <span className="metric-val highlight">{conception.totalRigging.totalSuspendedLoadKg} kg</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Charge / Palan 1T</span>
                <span className="metric-val">{conception.totalRigging.pointLoadPerMotorKg} kg</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Puissance Totale</span>
                <span className="metric-val highlight">{conception.totalPower.totalKw} kW</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Courant 380V Tri</span>
                <span className="metric-val">{conception.totalPower.triAmps380V} A</span>
              </div>
            </div>

            <div className="safety-status-alert alert-success">
              <CheckCircle size={15} />
              <span>Conforme BGV-C1 • Armoire 63A Triphasé requise</span>
            </div>
          </div>
        </aside>

        {/* Center / Right 3D Viewport */}
        <section className="structure-viewport-section">
          <div className="viewport-controls-bar">
            <div className="segmented-toggle small">
              <button
                type="button"
                className={`segment-btn ${viewMode === '3D' ? 'active' : ''}`}
                onClick={() => setViewMode('3D')}
              >
                Vue 3D Studio
              </button>
              <button
                type="button"
                className={`segment-btn ${viewMode === '2D' ? 'active' : ''}`}
                onClick={() => setViewMode('2D')}
              >
                Vue Plan 2D (Top)
              </button>
            </div>

            <div className="viewport-actions">
              <button
                type="button"
                className="viewport-action-btn"
                onClick={() => setNightMode(!nightMode)}
              >
                <Moon size={14} />
                <span>{nightMode ? 'Ambiance Nuit' : 'Ambiance Jour'}</span>
              </button>
              <button
                type="button"
                className="viewport-action-btn"
                onClick={() => {
                  if (captureRef.current) captureRef.current.download(`Conception_3D.png`);
                }}
              >
                <Camera size={14} />
                <span>Capture 3D</span>
              </button>
              <button
                type="button"
                className="viewport-action-btn"
                onClick={() => {
                  setViewMode('2D');
                  setTimeout(() => {
                    if (captureRef.current) captureRef.current.download(`Conception_Plan2D.png`);
                  }, 500);
                }}
              >
                <FileText size={14} />
                <span>Capture Plan 2D</span>
              </button>
            </div>
          </div>

          <div className="structure-canvas-container">
            <Suspense fallback={<div className="canvas-loading-spinner">Chargement 3D...</div>}>
              <Canvas gl={{ preserveDrawingBuffer: true, antialias: true }}>
                {viewMode === '3D' ? (
                  <PerspectiveCamera makeDefault position={[12, 11, 16]} fov={45} />
                ) : (
                  <OrthographicCamera makeDefault position={[0, 35, 0]} zoom={30} near={-50} far={200} />
                )}

                <ambientLight intensity={nightMode ? 0.35 : 0.8} />
                <directionalLight position={[15, 25, 15]} intensity={nightMode ? 0.8 : 1.4} />
                <directionalLight position={[-15, 12, -10]} intensity={nightMode ? 0.2 : 0.5} />

                <Grid infiniteGrid fadeDistance={70} sectionColor="#ec4899" cellColor="#1e293b" sectionSize={2.44} cellSize={1.22} />
                <OrbitControls makeDefault enableRotate={viewMode === '3D'} enableZoom={true} maxPolarAngle={Math.PI / 2 + 0.05} />
                <color attach="background" args={[nightMode ? '#05070d' : '#f8fafc']} />

                <FullStage3D conception={conception} nightMode={nightMode} showLabels={true} />
                <SceneCapture captureRef={captureRef} />
              </Canvas>
            </Suspense>

            {/* Floating Overview */}
            <div className="floating-equipment-summary">
              <div className="floating-header" style={{ color: '#ec4899' }}>
                <Sparkles size={14} />
                <span>SYNTHÈSE SCÉNIQUE COMPLÈTE</span>
              </div>
              <div className="floating-grid">
                <div className="floating-item">
                  <span className="f-label">Scène :</span>
                  <span className="f-val">{conception.stage.dimensions.lengthM}×{conception.stage.dimensions.widthM}m</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Structure :</span>
                  <span className="f-val">{conception.structure.dimensions.length}×{conception.structure.dimensions.width}m</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Écran LED :</span>
                  <span className="f-val highlight">{conception.screen.dimensions.widthM}×{conception.screen.dimensions.heightM}m</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Projecteurs :</span>
                  <span className="f-val highlight">{conception.lighting.counts.total} pcs</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Charge Palans :</span>
                  <span className="f-val">{conception.totalRigging.totalSuspendedLoadKg} kg</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Puissance :</span>
                  <span className="f-val">{conception.totalPower.totalKw} kW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom BOM table */}
          <div className="viewport-bom-section">
            <div className="bom-section-header">
              <div className="bom-header-info">
                <Package size={17} style={{ color: '#ec4899' }} />
                <h3>Nomenclature Globale du Matériel & Colisage</h3>
                <span className="bom-count-pill" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
                  {conception.equipmentBOM.length} références consolidées
                </span>
              </div>
              <div className="bom-header-total">
                <span>Poids Total du Matériel : <strong>{conception.equipmentBOM.reduce((acc, i) => acc + (i.totalWeightKg || 0), 0).toFixed(0)} kg</strong></span>
              </div>
            </div>

            <div className="bom-table-wrapper">
              <table className="structure-bom-table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Désignation de la pièce</th>
                    <th>Spécification technique</th>
                    <th style={{ textAlign: 'center' }}>Quantité</th>
                    <th style={{ textAlign: 'right' }}>Poids unitaire</th>
                    <th style={{ textAlign: 'right' }}>Poids total</th>
                  </tr>
                </thead>
                <tbody>
                  {conception.equipmentBOM.map(item => (
                    <tr key={item.id}>
                      <td className="bom-cat-td">{item.category}</td>
                      <td className="bom-name-td"><strong>{item.name}</strong></td>
                      <td className="bom-spec-td">{item.spec}</td>
                      <td className="bom-qty-td">
                        <span className="qty-tag" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="bom-num-td">{item.unitWeightKg} kg</td>
                      <td className="bom-num-td font-semibold">{item.totalWeightKg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <SaveConceptionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        conception={conception}
        currentEventName={eventName}
        onConceptionSaved={(saved) => {
          setActiveConceptionId(saved._id);
          setEventName(saved.eventName);
          setSiteName(saved.siteName || '');
        }}
      />

      <SavedConceptionsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onLoadConception={handleLoadConception}
        onExportPdfForConception={(item) => {
          handleLoadConception(item);
          setIsExportModalOpen(true);
        }}
        activeConceptionId={activeConceptionId}
      />

      <FullStageExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        conception={conception}
        eventName={eventName}
        siteName={siteName}
        capture3DUrl={capture3DUrl}
        capturePlanUrl={capturePlanUrl}
      />
    </div>
  );
}
