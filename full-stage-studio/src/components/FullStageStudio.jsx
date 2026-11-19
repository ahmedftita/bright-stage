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
  User,
  LogOut,
  Moon,
  Package,
  Eye,
  RotateCcw
} from 'lucide-react';

import FullStage3D from './FullStage3D';
import SaveConceptionModal from './SaveConceptionModal';
import SavedConceptionsModal from './SavedConceptionsModal';
import FullStageExportModal from './FullStageExportModal';
import LoginModal from './LoginModal';

import {
  STAGE_HEIGHTS,
  TRUSS_SERIES,
  LED_PITCHES,
  calculateFullConception
} from '../utils/conceptionLogic';
import { authService } from '../services/authService';

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
  // Auth
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!authService.isAuthenticated());

  // Event Context
  const [eventName, setEventName] = useState('Festival International de Carthage 2026 — Scène Complète');
  const [siteName, setSiteName] = useState('Amphithéâtre Romain de Carthage');
  const [activeConceptionId, setActiveConceptionId] = useState(null);

  // Active Tab: 'stage' | 'structure' | 'screen' | 'lighting' | 'bom'
  const [activeTab, setActiveTab] = useState('stage');

  // Studio Atmosphere
  const [nightMode, setNightMode] = useState(true);
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Captures
  const captureRef = useRef(null);
  const [capture3DUrl, setCapture3DUrl] = useState(null);
  const [capturePlanUrl, setCapturePlanUrl] = useState(null);

  // ==========================================
  // MASTER STUDIO CONFIGURATION STATE
  // ==========================================
  const [stageState, setStageState] = useState({
    enabled: true,
    lengthModules: 6,
    widthModules: 4,
    heightId: 'h75',
    hasStairs: true,
    stairsCount: 1,
    stairsSide: 'right',
    hasSkirting: true
  });

  const [structureState, setStructureState] = useState({
    enabled: true,
    structureType: 'grid',
    towerType: 'PT34',
    gridTypeL: 'HT44',
    gridTypeW: 'PT34',
    length: 9,
    width: 7,
    height: 6,
    totemsCount: 3,
    totemHeightM: 2.5
  });

  const [screenState, setScreenState] = useState({
    enabled: true,
    pitch: 'P3.9',
    mountType: 'suspended_truss',
    cabinetsW: 8, // 4.0m de largeur (8 dalles de 0.5m)
    cabinetsH: 5  // 2.5m de hauteur (5 dalles de 0.5m)
  });

  const [lightingState, setLightingState] = useState({
    enabled: true,
    beamsCount: 8,
    spotsCount: 6,
    washesCount: 8,
    ledBarsCount: 6,
    blindersCount: 4,
    hazerCount: 2,
    sideMatricesCount: 5, // 5 matrices à gauche + 5 à droite = 10 matrices !
    showBeams: true,
    beamColor: '#38bdf8'
  });

  // Calculate full unified conception
  const conception = useMemo(() => {
    return calculateFullConception({
      stage: stageState,
      structure: structureState,
      screen: screenState,
      lighting: lightingState
    });
  }, [stageState, structureState, screenState, lightingState]);

  // Handle Steppers
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

  // Presets Application
  const applyConceptionPreset = (preset) => {
    if (preset.eventName) setEventName(preset.eventName);
    if (preset.siteName) setSiteName(preset.siteName);
    if (preset.stage) setStageState(prev => ({ ...prev, ...preset.stage }));
    if (preset.structure) setStructureState(prev => ({ ...prev, ...preset.structure }));
    if (preset.screen) setScreenState(prev => ({ ...prev, ...preset.screen }));
    if (preset.lighting) setLightingState(prev => ({ ...prev, ...preset.lighting }));
  };

  // Load Saved Conception
  const handleLoadConception = (item) => {
    setActiveConceptionId(item._id);
    setEventName(item.eventName || 'Conception Scénique');
    setSiteName(item.siteName || '');

    if (item.stageConfig) {
      setStageState({
        enabled: item.stageConfig.enabled !== false,
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
        enabled: item.structureConfig.enabled !== false,
        structureType: item.structureConfig.structureType || 'grid',
        towerType: item.structureConfig.towerType || 'PT34',
        gridTypeL: item.structureConfig.gridTypeL || 'HT44',
        gridTypeW: item.structureConfig.gridTypeW || 'PT34',
        length: item.structureConfig.length || 10,
        width: item.structureConfig.width || 8,
        height: item.structureConfig.height || 6,
        totemsCount: item.structureConfig.totemsCount ?? (item.structureConfig.totems?.count ?? 0),
        totemHeightM: item.structureConfig.totemHeightM ?? (item.structureConfig.totems?.heightM ?? 2.5)
      });
    }

    if (item.screenConfig) {
      setScreenState({
        enabled: item.screenConfig.enabled !== false,
        pitch: item.screenConfig.pitch || 'P3.9',
        mountType: item.screenConfig.mountType || 'suspended_truss',
        cabinetsW: item.screenConfig.cabinetsW || 8,
        cabinetsH: item.screenConfig.cabinetsH || 5
      });
    }

    if (item.lightingConfig) {
      setLightingState({
        enabled: item.lightingConfig.enabled !== false,
        beamsCount: item.lightingConfig.beamsCount ?? 8,
        spotsCount: item.lightingConfig.spotsCount ?? 6,
        washesCount: item.lightingConfig.washesCount ?? 8,
        ledBarsCount: item.lightingConfig.ledBarsCount ?? 6,
        blindersCount: item.lightingConfig.blindersCount ?? 4,
        hazerCount: item.lightingConfig.hazerCount ?? 2,
        sideMatricesCount: item.lightingConfig.sideMatricesCount ?? 0,
        showBeams: item.lightingConfig.showBeams !== false,
        beamColor: item.lightingConfig.beamColor || '#38bdf8'
      });
    }
  };

  // Prepare Export
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
    <div className="structure-app-layout">
      {/* Top Navbar */}
      <header className="structure-navbar">
        <div className="navbar-left">
          <div className="navbar-logo-badge" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(99,102,241,0.3) 100%)' }}>
            <span style={{ color: '#ec4899', fontSize: '18px', fontWeight: 900 }}>B</span>
            <span style={{ color: '#818cf8', fontSize: '18px', fontWeight: 900 }}>S</span>
          </div>
          <div>
            <div className="navbar-brand">
              <span className="brand-title">Bright Stage</span>
              <span className="brand-tag" style={{ background: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.4)', color: '#f472b6' }}>
                STUDIO CONCEPTION SCÉNIQUE 3D
              </span>
            </div>
            <p className="navbar-sub">Scène • Structure Truss • Écran LED • Éclairage & Abaques Unifiés</p>
          </div>
        </div>

        {/* Center Event Pill */}
        <div className="navbar-event-pill" onClick={() => setIsSavedModalOpen(true)} title="Cliquez pour charger une conception d'événement">
          <Sparkles size={14} className="text-amber" />
          <div className="event-pill-text">
            <span className="event-pill-label">Événement Actif :</span>
            <span className="event-pill-name">{eventName}</span>
          </div>
          <ChevronDown size={14} className="text-muted" />
        </div>

        {/* Right Actions */}
        <div className="navbar-right">
          <button
            type="button"
            className="action-btn btn-secondary"
            onClick={() => setIsSavedModalOpen(true)}
          >
            <FolderOpen size={16} />
            <span className="btn-text">Conceptions (X)</span>
          </button>

          <button
            type="button"
            className="action-btn btn-secondary"
            onClick={() => setIsSaveModalOpen(true)}
          >
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
            <span className="btn-text">Fiche Technique Complète</span>
          </button>

          {currentUser && (
            <div className="user-profile-badge">
              <div className="user-avatar" style={{ background: 'rgba(236,72,153,0.2)', color: '#f472b6' }}>
                <User size={15} />
              </div>
              <div className="user-details-mini">
                <span className="user-name">{currentUser.name || 'Jilani Wahi'}</span>
                <span className="user-role">{currentUser.role || 'Production'}</span>
              </div>
              <button
                type="button"
                className="logout-mini-btn"
                title="Déconnexion"
                onClick={() => {
                  authService.logout();
                  setCurrentUser(null);
                  setIsAuthModalOpen(true);
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="structure-main-workspace">
        {/* Left Sidebar Configurator */}
        <aside className="structure-sidebar" style={{ width: '380px', minWidth: '340px' }}>
          {/* Quick Presets */}
          <div className="sidebar-section">
            <div className="section-header">
              <Sparkles size={14} className="text-amber" />
              <span className="section-title">Modèles Scéniques Clés en Main</span>
            </div>
            <div className="presets-pill-grid">
              {/* Preset Scène + Écran Seul */}
              <button
                type="button"
                className="preset-pill highlight"
                style={{ borderColor: '#10b981', color: '#10b981', fontWeight: 'bold', gridColumn: 'span 2' }}
                onClick={() => applyConceptionPreset({
                  eventName: 'Scène Podium + Écran LED Seul (Sans Truss ni Lumière)',
                  siteName: 'Conférence & Événement Sans Accroche',
                  stage: { enabled: true, lengthModules: 6, widthModules: 4, heightId: 'h75', hasStairs: true, stairsCount: 1, stairsSide: 'right', hasSkirting: true },
                  structure: { enabled: false, structureType: 'grid', towerType: 'PT34', gridTypeL: 'HT44', length: 9, width: 7, height: 6, totemsCount: 0 },
                  screen: { enabled: true, pitch: 'P3.9', mountType: 'ground_stack', cabinetsW: 8, cabinetsH: 5 },
                  lighting: { enabled: false, beamsCount: 0, spotsCount: 0, washesCount: 0, ledBarsCount: 0, blindersCount: 0, hazerCount: 0, sideMatricesCount: 0 }
                })}
              >
                ★ Scène + Écran seul (Sans Truss ni Lumière)
              </button>

              <button
                type="button"
                className="preset-pill highlight"
                style={{ borderColor: '#38bdf8', color: '#38bdf8', fontWeight: 'bold', gridColumn: 'span 2' }}
                onClick={() => applyConceptionPreset({
                  eventName: 'Scénographie Pro : Écran 4×2.5m + 10x 36LED Strobe Beam + 3 Totems Beam 280W',
                  siteName: 'Scène Festival & Live Show',
                  stage: { enabled: true, lengthModules: 6, widthModules: 4, heightId: 'h75', hasStairs: true, stairsCount: 1, stairsSide: 'right' },
                  structure: { enabled: true, structureType: 'grid', towerType: 'PT34', gridTypeL: 'HT44', length: 9, width: 7, height: 6, totemsCount: 3, totemHeightM: 2.5 },
                  screen: { enabled: true, pitch: 'P3.9', mountType: 'suspended_truss', cabinetsW: 8, cabinetsH: 5 }, // 4.0m × 2.5m !
                  lighting: {
                    enabled: true,
                    beamsCount: 8, spotsCount: 6, washesCount: 8, ledBarsCount: 6, blindersCount: 4, hazerCount: 2,
                    sideMatricesCount: 5, // 5 à gauche + 5 à droite = 10 matrices !
                    showBeams: true, beamColor: '#38bdf8'
                  }
                })}
              >
                ★ Setup Complet 4×2.5m + 36LED Strobe + Totems
              </button>

              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Festival International de Carthage 2026 — Scène Principale',
                  siteName: 'Amphithéâtre Romain',
                  stage: { enabled: true, lengthModules: 6, widthModules: 4, heightId: 'h75', hasStairs: true, stairsCount: 1 },
                  structure: { enabled: true, structureType: 'grid', towerType: 'PT34', gridTypeL: 'HT44', length: 10, width: 8, height: 6 },
                  screen: { enabled: true, pitch: 'P3.9', mountType: 'suspended_truss', cabinetsW: 12, cabinetsH: 6 },
                  lighting: { enabled: true, beamsCount: 8, spotsCount: 6, washesCount: 8, ledBarsCount: 6, blindersCount: 4, hazerCount: 2, showBeams: true, beamColor: '#38bdf8' }
                })}
              >
                Festival 8×6 (Carthage)
              </button>

              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Concert Symphonique Arena — Arche Goalpost',
                  siteName: 'Palais des Congrès',
                  stage: { enabled: true, lengthModules: 8, widthModules: 6, heightId: 'h100', hasStairs: true, stairsCount: 2 },
                  structure: { enabled: true, structureType: 'goalpost', towerType: 'PT34', gridTypeL: 'HT44', length: 10, width: 4, height: 7 },
                  screen: { enabled: true, pitch: 'P2.9', mountType: 'suspended_truss', cabinetsW: 16, cabinetsH: 8 },
                  lighting: { enabled: true, beamsCount: 6, spotsCount: 4, washesCount: 6, ledBarsCount: 8, blindersCount: 2, hazerCount: 1, showBeams: true, beamColor: '#f59e0b' }
                })}
              >
                Concert Arena 10×7
              </button>

              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Gala Prestige & Soirée Corporate',
                  siteName: 'Salle Polyvalente',
                  stage: { enabled: true, lengthModules: 4, widthModules: 3, heightId: 'h55', hasStairs: true, stairsCount: 1 },
                  structure: { enabled: true, structureType: 'grid', towerType: 'PT34', gridTypeL: 'PT34', length: 7, width: 5, height: 5 },
                  screen: { enabled: true, pitch: 'P2.6', mountType: 'ground_stack', cabinetsW: 8, cabinetsH: 5 },
                  lighting: { enabled: true, beamsCount: 4, spotsCount: 4, washesCount: 6, ledBarsCount: 4, blindersCount: 0, hazerCount: 1, showBeams: true, beamColor: '#a855f7' }
                })}
              >
                Gala Corporate 5×4
              </button>

              <button
                type="button"
                className="preset-pill"
                onClick={() => applyConceptionPreset({
                  eventName: 'Méga Concert Stadium Live Outdoor',
                  siteName: 'Stade Olympique',
                  stage: { enabled: true, lengthModules: 10, widthModules: 8, heightId: 'h100', hasStairs: true, stairsCount: 2 },
                  structure: { enabled: true, structureType: 'grid', towerType: 'HT44', gridTypeL: 'TT104', length: 14, width: 12, height: 8 },
                  screen: { enabled: true, pitch: 'P3.9', mountType: 'suspended_truss', cabinetsW: 20, cabinetsH: 10 },
                  lighting: { enabled: true, beamsCount: 16, spotsCount: 12, washesCount: 16, ledBarsCount: 12, blindersCount: 8, hazerCount: 4, showBeams: true, beamColor: '#38bdf8' }
                })}
              >
                Stadium Live 12×10
              </button>
            </div>
          </div>

          {/* Pillar Navigation Tabs */}
          <div className="segmented-toggle" style={{ background: 'rgba(0,0,0,0.4)', gap: '4px', padding: '4px' }}>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'stage' ? 'active' : ''}`}
              onClick={() => setActiveTab('stage')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              <Layers size={13} />
              <span>Scène</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                background: stageState.enabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                color: stageState.enabled ? '#34d399' : '#f87171',
                border: `1px solid ${stageState.enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                {stageState.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'structure' ? 'active' : ''}`}
              onClick={() => setActiveTab('structure')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              <Wrench size={13} />
              <span>Truss</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                background: structureState.enabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                color: structureState.enabled ? '#34d399' : '#f87171',
                border: `1px solid ${structureState.enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                {structureState.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'screen' ? 'active' : ''}`}
              onClick={() => setActiveTab('screen')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              <Monitor size={13} />
              <span>Écran</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                background: screenState.enabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                color: screenState.enabled ? '#34d399' : '#f87171',
                border: `1px solid ${screenState.enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                {screenState.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeTab === 'lighting' ? 'active' : ''}`}
              onClick={() => setActiveTab('lighting')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              <Sun size={13} />
              <span>Lumière</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                background: lightingState.enabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                color: lightingState.enabled ? '#34d399' : '#f87171',
                border: `1px solid ${lightingState.enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                {lightingState.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* TAB 1: SCÈNE */}
          {activeTab === 'stage' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Layers size={15} className="text-indigo" />
                <span className="section-title">Paramètres Podium & Scène</span>
              </div>

              {/* Module Toggle Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '14px',
                background: stageState.enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${stageState.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: stageState.enabled ? '#10b981' : '#ef4444',
                    boxShadow: stageState.enabled ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none'
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: stageState.enabled ? '#e2e8f0' : '#f87171' }}>
                      Module Scène {stageState.enabled ? 'Actif' : 'Désactivé'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {stageState.enabled ? 'Plateau & podium intégrés au devis' : 'Exclu du 3D, des charges et du BOM'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`action-btn ${stageState.enabled ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                  onClick={() => setStageState(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {stageState.enabled ? '✕ Masquer / Désactiver' : '✓ Activer la scène'}
                </button>
              </div>

              {!stageState.enabled ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  <Layers size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Scène actuellement désactivée</p>
                  <p style={{ fontSize: '11px', marginBottom: '12px' }}>
                    Aucun praticable, plateau ou escalier ne sera affiché ni comptabilisé dans le devis.
                  </p>
                  <button
                    type="button"
                    className="action-btn btn-primary"
                    style={{ margin: '0 auto', fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => setStageState(prev => ({ ...prev, enabled: true }))}
                  >
                    Activer la scène
                  </button>
                </div>
              ) : (
                <>
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

                  {/* Hauteurs Disponibles */}
                  <div className="form-group">
                    <label className="form-label">Hauteur Praticables (3 hauteurs standards)</label>
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

                  {/* Escalier & Options */}
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Escaliers de Scène</label>
                      <select
                        className="form-select"
                        value={stageState.stairsCount}
                        onChange={(e) => setStageState(prev => ({ ...prev, stairsCount: parseInt(e.target.value) }))}
                      >
                        <option value={0}>Aucun</option>
                        <option value={1}>1 Escalier</option>
                        <option value={2}>2 Escaliers (accès bilatéral)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Position Escalier</label>
                      <select
                        className="form-select"
                        value={stageState.stairsSide}
                        onChange={(e) => setStageState(prev => ({ ...prev, stairsSide: e.target.value }))}
                      >
                        <option value="right">Côté Droit (Jardin)</option>
                        <option value="left">Côté Gauche (Cour)</option>
                        <option value="both">Deux Côtés (Cour & Jardin)</option>
                      </select>
                    </div>
                  </div>

                  {/* Quantités Calculées */}
                  <div className="load-analysis-card">
                    <span className="analysis-title">Éléments de scène requis :</span>
                    <div className="analysis-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Plaques 18mm</span>
                        <span className="metric-val">{conception.stage.counts.stagePlaques} pcs</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Pieds vérins</span>
                        <span className="metric-val">{conception.stage.counts.stagePieds} pcs</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Côtés latéraux</span>
                        <span className="metric-val">{conception.stage.counts.stageCotes} pcs</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Surface utile</span>
                        <span className="metric-val highlight">{conception.stage.dimensions.surfaceM2} m²</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: STRUCTURE TRUSS */}
          {activeTab === 'structure' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Wrench size={15} className="text-cyan" />
                <span className="section-title">Paramètres Structure & Ponts</span>
              </div>

              {/* Module Toggle Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '14px',
                background: structureState.enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${structureState.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: structureState.enabled ? '#10b981' : '#ef4444',
                    boxShadow: structureState.enabled ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none'
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: structureState.enabled ? '#e2e8f0' : '#f87171' }}>
                      Structure Truss {structureState.enabled ? 'Active' : 'Désactivée'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {structureState.enabled ? 'Ponts, tours et totems intégrés' : 'Aucun pont ni tour de levage'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`action-btn ${structureState.enabled ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                  onClick={() => setStructureState(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {structureState.enabled ? '✕ Masquer / Désactiver' : '✓ Activer la structure'}
                </button>
              </div>

              {!structureState.enabled ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  <Wrench size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Structure Truss désactivée</p>
                  <p style={{ fontSize: '11px', marginBottom: '12px' }}>
                    Configuration autoportée sans structure d'accroche (ex. Scène + Écran posé au sol).
                  </p>
                  <button
                    type="button"
                    className="action-btn btn-primary"
                    style={{ margin: '0 auto', fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => setStructureState(prev => ({ ...prev, enabled: true }))}
                  >
                    Activer la structure Truss
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Architecture Structurelle</label>
                    <div className="segmented-toggle">
                      <button
                        type="button"
                        className={`segment-btn ${structureState.structureType === 'grid' ? 'active' : ''}`}
                        onClick={() => setStructureState(prev => ({ ...prev, structureType: 'grid' }))}
                      >
                        Gril (Box Grid 4 Tours)
                      </button>
                      <button
                        type="button"
                        className={`segment-btn ${structureState.structureType === 'goalpost' ? 'active' : ''}`}
                        onClick={() => setStructureState(prev => ({ ...prev, structureType: 'goalpost' }))}
                      >
                        Arche (Goalpost 2 Tours)
                      </button>
                    </div>
                  </div>

                  <div className="dimensions-box">
                    <div className="stepper-row">
                      <div className="stepper-meta">
                        <span className="stepper-title">Portée Longueur (m)</span>
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
                          <span className="stepper-title">Portée Largeur (m)</span>
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

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Série Tours</label>
                      <select
                        className="form-select"
                        value={structureState.towerType}
                        onChange={(e) => setStructureState(prev => ({ ...prev, towerType: e.target.value }))}
                      >
                        <option value="PT34">PT34 (Std 290)</option>
                        <option value="FT44">FT44 (Std 400)</option>
                        <option value="HT44">HT44 (Heavy 400)</option>
                        <option value="TT104">TT104 (1010 Monumental)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Série Poutres (L)</label>
                      <select
                        className="form-select"
                        value={structureState.gridTypeL}
                        onChange={(e) => setStructureState(prev => ({ ...prev, gridTypeL: e.target.value }))}
                      >
                        <option value="PT34">PT34 (Std 290)</option>
                        <option value="FT44">FT44 (Std 400)</option>
                        <option value="HT44">HT44 (Heavy 400)</option>
                        <option value="TT104">TT104 (Monumental)</option>
                      </select>
                    </div>
                  </div>

                  {/* Totems Scéniques de Fond de Scène */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                    <span className="section-title" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Wrench size={13} className="text-cyan" />
                      <span>Totems Truss Verticaux (Fond de Scène)</span>
                    </span>

                    <div className="dimensions-box">
                      <div className="stepper-row">
                        <div className="stepper-meta">
                          <span className="stepper-title">Nombre de Totems</span>
                          <span className="stepper-sub">Totems verticaux sur embases acier</span>
                        </div>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => setStructureState(prev => ({ ...prev, totemsCount: Math.max(0, (prev.totemsCount ?? 0) - 1) }))}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="stepper-input">{structureState.totemsCount ?? 0}</span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => setStructureState(prev => ({ ...prev, totemsCount: Math.min(8, (prev.totemsCount ?? 0) + 1) }))}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {(structureState.totemsCount ?? 0) > 0 && (
                        <div className="stepper-row">
                          <div className="stepper-meta">
                            <span className="stepper-title">Hauteur Totem (m)</span>
                            <span className="stepper-sub">Élévation fond de scène</span>
                          </div>
                          <div className="stepper-controls">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => setStructureState(prev => ({ ...prev, totemHeightM: Math.max(1, ((prev.totemHeightM ?? 2.5) - 0.5)) }))}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="stepper-input">{structureState.totemHeightM ?? 2.5}m</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => setStructureState(prev => ({ ...prev, totemHeightM: Math.min(5, ((prev.totemHeightM ?? 2.5) + 0.5)) }))}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {(structureState.totemsCount ?? 0) > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', background: 'rgba(56,189,248,0.08)', padding: '7px 10px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.2)' }}>
                        💡 <strong>Tête de Totem :</strong> Chaque totem est équipé d'une <strong>Moving Head Beam 280W (Robe Pointe)</strong> orientée vers le haut, d'une platine supérieure et d'une embase acier lestée 28 kg.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: ÉCRAN LED */}
          {activeTab === 'screen' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Monitor size={15} className="text-cyan" />
                <span className="section-title">Paramètres Mur Vidéo LED</span>
              </div>

              {/* Module Toggle Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '14px',
                background: screenState.enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${screenState.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: screenState.enabled ? '#10b981' : '#ef4444',
                    boxShadow: screenState.enabled ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none'
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: screenState.enabled ? '#e2e8f0' : '#f87171' }}>
                      Écran LED {screenState.enabled ? 'Actif' : 'Désactivé'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {screenState.enabled ? 'Mur vidéo, processeur et dalles inclus' : 'Aucun écran vidéo dans la scène'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`action-btn ${screenState.enabled ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                  onClick={() => setScreenState(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {screenState.enabled ? '✕ Masquer / Désactiver' : '✓ Activer l\'écran'}
                </button>
              </div>

              {!screenState.enabled ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  <Monitor size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Écran LED désactivé</p>
                  <p style={{ fontSize: '11px', marginBottom: '12px' }}>
                    Aucun mur vidéo LED n'est affiché ni comptabilisé dans le devis.
                  </p>
                  <button
                    type="button"
                    className="action-btn btn-primary"
                    style={{ margin: '0 auto', fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => setScreenState(prev => ({ ...prev, enabled: true }))}
                  >
                    Activer l'écran LED
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Pas de masque (Pitch)</label>
                      <select
                        className="form-select"
                        value={screenState.pitch}
                        onChange={(e) => setScreenState(prev => ({ ...prev, pitch: e.target.value }))}
                      >
                        <option value="P2.6">P2.6 (Haute Déf Indoor)</option>
                        <option value="P2.9">P2.9 (Concert Indoor)</option>
                        <option value="P3.9">P3.9 (Festival Outdoor standard)</option>
                        <option value="P4.8">P4.8 (Grand format Stadium)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mode de Fixation</label>
                      <select
                        className="form-select"
                        value={!structureState.enabled ? 'ground_stack' : screenState.mountType}
                        disabled={!structureState.enabled}
                        onChange={(e) => setScreenState(prev => ({ ...prev, mountType: e.target.value }))}
                      >
                        <option value="ground_stack">Posé au sol (Ground Stack)</option>
                        {structureState.enabled && <option value="suspended_truss">Suspendu au Pont Arrière</option>}
                      </select>
                      {!structureState.enabled && (
                        <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '3px' }}>
                          * Sans structure : écran posé au sol ou sur scène.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formats Rapides Écran */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="preset-pill"
                      style={{
                        flex: 1, minWidth: '95px', fontSize: '11px', textAlign: 'center',
                        borderColor: screenState.cabinetsW === 8 && screenState.cabinetsH === 5 ? '#38bdf8' : undefined,
                        color: screenState.cabinetsW === 8 && screenState.cabinetsH === 5 ? '#38bdf8' : undefined
                      }}
                      onClick={() => setScreenState(prev => ({ ...prev, cabinetsW: 8, cabinetsH: 5 }))}
                    >
                      4.0m × 2.5m (8×5)
                    </button>
                    <button
                      type="button"
                      className="preset-pill"
                      style={{
                        flex: 1, minWidth: '95px', fontSize: '11px', textAlign: 'center',
                        borderColor: screenState.cabinetsW === 10 && screenState.cabinetsH === 6 ? '#38bdf8' : undefined,
                        color: screenState.cabinetsW === 10 && screenState.cabinetsH === 6 ? '#38bdf8' : undefined
                      }}
                      onClick={() => setScreenState(prev => ({ ...prev, cabinetsW: 10, cabinetsH: 6 }))}
                    >
                      5.0m × 3.0m (10×6)
                    </button>
                    <button
                      type="button"
                      className="preset-pill"
                      style={{
                        flex: 1, minWidth: '95px', fontSize: '11px', textAlign: 'center',
                        borderColor: screenState.cabinetsW === 12 && screenState.cabinetsH === 7 ? '#38bdf8' : undefined,
                        color: screenState.cabinetsW === 12 && screenState.cabinetsH === 7 ? '#38bdf8' : undefined
                      }}
                      onClick={() => setScreenState(prev => ({ ...prev, cabinetsW: 12, cabinetsH: 7 }))}
                    >
                      6.0m × 3.5m (12×7)
                    </button>
                  </div>

                  <div className="dimensions-box">
                    <div className="stepper-row">
                      <div className="stepper-meta">
                        <span className="stepper-title">Largeur Écran</span>
                        <span className="stepper-sub">{conception.screen.dimensions.widthM} m ({screenState.cabinetsW} dalles)</span>
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
                        <span className="stepper-sub">{conception.screen.dimensions.heightM} m ({screenState.cabinetsH} dalles)</span>
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

                  <div className="load-analysis-card">
                    <span className="analysis-title">Caractéristiques Vidéo & Poids :</span>
                    <div className="analysis-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Résolution Pixels</span>
                        <span className="metric-val">{conception.screen.totalPixels.toLocaleString()} px</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Poids Écran</span>
                        <span className="metric-val">{conception.screen.screenWeightKg} kg</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Surface Vidéo</span>
                        <span className="metric-val highlight">{conception.screen.dimensions.areaM2} m²</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Consommation</span>
                        <span className="metric-val">{conception.screen.screenPowerKw} kW</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: LUMIÈRE */}
          {activeTab === 'lighting' && (
            <div className="sidebar-section">
              <div className="section-header">
                <Sun size={15} className="text-amber" />
                <span className="section-title">Parc Projecteurs & Éclairage</span>
              </div>

              {/* Module Toggle Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '14px',
                background: lightingState.enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${lightingState.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: lightingState.enabled ? '#10b981' : '#ef4444',
                    boxShadow: lightingState.enabled ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none'
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: lightingState.enabled ? '#e2e8f0' : '#f87171' }}>
                      Module Lumière {lightingState.enabled ? 'Actif' : 'Désactivé'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {lightingState.enabled ? 'Projecteurs, lyres, DMX et faisceaux inclus' : 'Aucun éclairage scénique'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`action-btn ${lightingState.enabled ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                  onClick={() => setLightingState(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {lightingState.enabled ? '✕ Masquer / Désactiver' : '✓ Activer la lumière'}
                </button>
              </div>

              {!lightingState.enabled ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  <Sun size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Éclairage scénique désactivé</p>
                  <p style={{ fontSize: '11px', marginBottom: '12px' }}>
                    Aucun projecteur, lyre asservie ou console DMX ne sera comptabilisé.
                  </p>
                  <button
                    type="button"
                    className="action-btn btn-primary"
                    style={{ margin: '0 auto', fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => setLightingState(prev => ({ ...prev, enabled: true }))}
                  >
                    Activer la lumière
                  </button>
                </div>
              ) : (
                <>
                  <div className="dimensions-box">
                    <div className="stepper-row">
                      <div className="stepper-meta">
                        <span className="stepper-title">Beams 7R / 10R (300W)</span>
                        <span className="stepper-sub">Faisceaux volumétriques pont arrière</span>
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
                        <span className="stepper-title">Spots Profile LED (350W)</span>
                        <span className="stepper-sub">Découpe artistes pont avant</span>
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
                        <span className="stepper-title">Washes LED RGBW (300W)</span>
                        <span className="stepper-sub">Bains de couleurs scène</span>
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
                        <span className="stepper-title">Barres LED / Sunstrips</span>
                        <span className="stepper-sub">Matrices dynamiques décoratives</span>
                      </div>
                      <div className="stepper-controls">
                        <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('ledBarsCount', -2)}>
                          <Minus size={14} />
                        </button>
                        <span className="stepper-input">{lightingState.ledBarsCount}</span>
                        <button type="button" className="stepper-btn" onClick={() => adjustLightingFixture('ledBarsCount', 2)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="stepper-row">
                      <div className="stepper-meta">
                        <span className="stepper-title">Blinders 4-Lite DWE</span>
                        <span className="stepper-sub">Impact aveuglant face public</span>
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

                    {/* Matrices LED Latérales */}
                    <div className="stepper-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                      <div className="stepper-meta">
                        <span className="stepper-title" style={{ color: '#38bdf8' }}>36LED Strobe Beam 220W (Flancs Écran)</span>
                        <span className="stepper-sub">
                          {lightingState.sideMatricesCount ?? 0} à gauche + {lightingState.sideMatricesCount ?? 0} à droite ({((lightingState.sideMatricesCount ?? 0) * 2)} au total)
                        </span>
                      </div>
                      <div className="stepper-controls">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => setLightingState(prev => ({ ...prev, sideMatricesCount: Math.max(0, (prev.sideMatricesCount ?? 0) - 1) }))}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="stepper-input">{lightingState.sideMatricesCount ?? 0}/côté</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => setLightingState(prev => ({ ...prev, sideMatricesCount: Math.min(10, (prev.sideMatricesCount ?? 0) + 1) }))}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {(lightingState.sideMatricesCount ?? 0) > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', background: 'rgba(56,189,248,0.08)', padding: '7px 10px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.2)' }}>
                        ⚡ <strong>36LED Strobe Beam 220W (LeLeght) :</strong> 36 LED Beams blanc chaud + 648 LED RGB Strobe • Tilt motorisé 180° • 220W • 16 canaux DMX.
                      </div>
                    )}
                  </div>

                  {/* Show Beams in 3D & Color picker */}
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
                        <span>{lightingState.showBeams ? 'Faisceaux Actifs' : 'Faisceaux Masqués'}</span>
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Teinte du Show</label>
                      <select
                        className="form-select"
                        value={lightingState.beamColor}
                        onChange={(e) => setLightingState(prev => ({ ...prev, beamColor: e.target.value }))}
                      >
                        <option value="#38bdf8">Cyan Électrique</option>
                        <option value="#fbbf24">Ambre Chaud (Concert)</option>
                        <option value="#ec4899">Magenta / Rose</option>
                        <option value="#a855f7">Pourpre / Violet</option>
                        <option value="#ffffff">Blanc Pur Intense</option>
                        <option value="#10b981">Vert Laser</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CONSOLIDATED GLOBAL SAFETY & POWER CARD */}
          <div className="load-analysis-card" style={{ marginTop: 'auto' }}>
            <div className="analysis-header">
              <Scale size={16} className="text-amber" />
              <span className="analysis-title">Bilan Global des Charges & Puissance</span>
            </div>

            <div className="analysis-metrics">
              <div className="metric-item">
                <span className="metric-label">Poids Total Suspendu</span>
                <span className="metric-val highlight">{conception.totalRigging.totalSuspendedLoadKg} kg</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Charge / Moteur 1T</span>
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

            <div className="safety-bar-wrapper">
              <div className="safety-bar-header">
                <span>Sécurité Palans : {conception.totalRigging.pointLoadPerMotorKg} kg / 1000 kg</span>
                <span className="safety-pct">{conception.totalRigging.motorSafetyPercentage}%</span>
              </div>
              <div className="safety-bar-track">
                <div
                  className={`safety-bar-fill ${conception.totalRigging.isOverload ? 'overload' : 'safe'}`}
                  style={{ width: `${Math.min(100, conception.totalRigging.motorSafetyPercentage)}%` }}
                ></div>
              </div>
            </div>

            <div className="safety-status-alert alert-success">
              <CheckCircle size={15} />
              <span>Conforme aux normes scéniques BGV-C1 (Armoire 63A Triphasé requise)</span>
            </div>
          </div>
        </aside>

        {/* Center / Right 3D Viewport */}
        <section className="structure-viewport-section">
          {/* Controls bar */}
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
              {/* Night Mode Toggle */}
              <button
                type="button"
                className="viewport-action-btn"
                title="Basculer ambiance concert / jour"
                onClick={() => setNightMode(!nightMode)}
              >
                <Moon size={14} />
                <span>{nightMode ? 'Ambiance Show Nuit' : 'Ambiance Jour'}</span>
              </button>

              <button
                type="button"
                className="viewport-action-btn"
                onClick={() => {
                  if (captureRef.current) {
                    captureRef.current.download(`Conception_Scenique_${eventName.slice(0, 20)}_3D.png`);
                  }
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
                    if (captureRef.current) {
                      captureRef.current.download(`Conception_Scenique_${eventName.slice(0, 20)}_Plan2D.png`);
                    }
                  }, 500);
                }}
              >
                <FileText size={14} />
                <span>Capture Plan 2D</span>
              </button>
            </div>
          </div>

          {/* 3D Canvas */}
          <div className="structure-canvas-container">
            <Suspense fallback={
              <div className="canvas-loading-spinner">
                <div className="loading-spinner"></div>
                <span>Chargement de la scène 3D complète...</span>
              </div>
            }>
              <Canvas gl={{ preserveDrawingBuffer: true, antialias: true }}>
                {viewMode === '3D' ? (
                  <PerspectiveCamera makeDefault position={[8.5, 6.5, 11]} fov={45} />
                ) : (
                  <OrthographicCamera makeDefault position={[0, 25, 0]} zoom={38} near={-50} far={200} />
                )}

                <ambientLight intensity={nightMode ? 0.45 : 0.9} />
                <directionalLight position={[15, 25, 15]} intensity={nightMode ? 0.9 : 1.5} castShadow />
                <directionalLight position={[-15, 12, -10]} intensity={nightMode ? 0.3 : 0.6} />

                {/* Ground technical grid */}
                <Grid
                  infiniteGrid
                  fadeDistance={60}
                  sectionColor={nightMode ? '#38bdf8' : '#ec4899'}
                  cellColor={nightMode ? '#1e293b' : '#cbd5e1'}
                  sectionSize={2.44}
                  cellSize={1.22}
                />

                <OrbitControls
                  makeDefault
                  target={[0, 2.2, 0]}
                  enableRotate={viewMode === '3D'}
                  enableZoom={true}
                  maxPolarAngle={Math.PI / 2 + 0.05}
                />

                <color attach="background" args={[nightMode ? '#05070d' : '#f8fafc']} />

                {/* Master Stage 3D Model */}
                <FullStage3D
                  conception={conception}
                  nightMode={nightMode}
                  showLabels={true}
                />

                <SceneCapture captureRef={captureRef} />
              </Canvas>
            </Suspense>

            {/* Floating Overview Pill */}
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
                  <span className="f-label">Surface :</span>
                  <span className="f-val">{conception.stage.dimensions.surfaceM2} m²</span>
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
                  <span className="f-label">Charge Suspendue :</span>
                  <span className="f-val">{conception.totalRigging.totalSuspendedLoadKg} kg</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Puissance Élec :</span>
                  <span className="f-val">{conception.totalPower.totalKw} kW</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Régie DMX :</span>
                  <span className="f-val">{conception.lighting.dmxUniverses} univers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated Master BOM Table */}
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
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isAuthModalOpen}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
        }}
      />

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
