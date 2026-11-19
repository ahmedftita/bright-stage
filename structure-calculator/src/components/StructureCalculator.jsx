import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Package,
  Camera,
  FileText,
  Layers,
  Save,
  FolderOpen,
  Printer,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  LogOut,
  User,
  Scale,
  Maximize2,
  Sliders,
  CheckCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

import Truss3D from './Truss3D';
import SaveModelModal from './SaveModelModal';
import SavedModelsModal from './SavedModelsModal';
import StructureExportModal from './StructureExportModal';
import LoginModal from './LoginModal';

import {
  TRUSS_SERIES,
  calculateStructure
} from '../utils/trussCalcLogic';
import { authService } from '../services/authService';

// Scene capture helper inside Canvas
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

export default function StructureCalculator() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!authService.isAuthenticated());

  // Configuration State
  const [config, setConfig] = useState({
    structureType: 'grid', // 'grid' or 'goalpost'
    towerType: 'PT34',
    gridTypeL: 'PT34',
    gridTypeW: 'PT34',
    length: 8,
    width: 6,
    height: 6,
    ledWeight: 500
  });

  // Event Context
  const [activeModel, setActiveModel] = useState(null);
  const [eventName, setEventName] = useState('Festival International de Carthage — Gril 10×8');
  const [siteName, setSiteName] = useState('Amphithéâtre Romain');

  // View & UI State
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [activeTab, setActiveTab] = useState('config'); // 'config' or 'bom'
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedModelsModalOpen, setIsSavedModelsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Captures
  const [capture3DUrl, setCapture3DUrl] = useState(null);
  const [capturePlanUrl, setCapturePlanUrl] = useState(null);
  const captureRef = useRef(null);

  // Calculation memo
  const calculation = useMemo(() => {
    return calculateStructure(config);
  }, [config]);

  // Auth check
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Steppers handler
  const adjustValue = (field, delta, min = 1, max = 50) => {
    setConfig(prev => {
      const nextVal = Math.min(max, Math.max(min, (parseFloat(prev[field]) || 0) + delta));
      return { ...prev, [field]: nextVal };
    });
  };

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['structureType', 'towerType', 'gridTypeL', 'gridTypeW'].includes(name)) {
      setConfig(prev => ({ ...prev, [name]: value }));
    } else {
      const numVal = parseFloat(value) || 0;
      setConfig(prev => ({ ...prev, [name]: Math.max(0, numVal) }));
    }
  };

  // Presets
  const applyPreset = (preset) => {
    setConfig(prev => ({
      ...prev,
      ...preset
    }));
    if (preset.presetName) {
      setEventName(preset.presetName);
    }
  };

  // Model loading
  const handleLoadModel = (model) => {
    setActiveModel(model);
    setEventName(model.eventName || 'Modèle de Structure');
    setSiteName(model.siteName || '');
    setConfig({
      structureType: model.structureType || 'grid',
      towerType: model.towerType || 'PT34',
      gridTypeL: model.gridTypeL || 'PT34',
      gridTypeW: model.gridTypeW || 'PT34',
      length: model.length || 8,
      width: model.width || 6,
      height: model.height || 6,
      ledWeight: model.ledWeight || 500
    });
  };

  // Snapshot handling for export
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
        console.warn("Capture warning:", e);
      }
    }
    setIsExportModalOpen(true);
  };

  return (
    <div className="structure-app-layout">
      {/* Top Navbar */}
      <header className="structure-navbar">
        <div className="navbar-left">
          <div className="navbar-logo-badge">
            <span className="logo-b">B</span>
            <span className="logo-s">S</span>
          </div>
          <div>
            <div className="navbar-brand">
              <span className="brand-title">Bright Stage</span>
              <span className="brand-tag">STRUCTURE & TRUSS PRO</span>
            </div>
            <p className="navbar-sub">Calculateur de Ponts Truss, Grils Scéniques & Abaques de Charge</p>
          </div>
        </div>

        {/* Center Event Pill */}
        <div className="navbar-event-pill" onClick={() => setIsSavedModelsModalOpen(true)} title="Cliquez pour changer d'événement">
          <Sparkles size={14} className="text-amber" />
          <div className="event-pill-text">
            <span className="event-pill-label">Événement en cours :</span>
            <span className="event-pill-name">{eventName}</span>
          </div>
          <ChevronDown size={14} className="text-muted" />
        </div>

        {/* Right Actions */}
        <div className="navbar-right">
          <button
            type="button"
            className="action-btn btn-secondary"
            onClick={() => setIsSavedModelsModalOpen(true)}
          >
            <FolderOpen size={16} />
            <span className="btn-text">Modèles Enregistrés</span>
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
            onClick={prepareExport}
          >
            <Printer size={16} />
            <span className="btn-text">Fiche Technique / PDF</span>
          </button>

          {/* User profile & Logout */}
          {currentUser && (
            <div className="user-profile-badge">
              <div className="user-avatar">
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
                onClick={handleLogout}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="structure-main-workspace">
        {/* Left Config Sidebar */}
        <aside className="structure-sidebar">
          {/* Quick Presets */}
          <div className="sidebar-section">
            <div className="section-header">
              <span className="section-title">Configurations Rapides</span>
            </div>
            <div className="presets-pill-grid">
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyPreset({
                  structureType: 'grid',
                  towerType: 'PT34',
                  gridTypeL: 'PT34',
                  gridTypeW: 'PT34',
                  length: 8,
                  width: 6,
                  height: 6,
                  ledWeight: 500,
                  presetName: 'Gril Scénique Standard 8×6m'
                })}
              >
                Gril 8×6m
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyPreset({
                  structureType: 'grid',
                  towerType: 'PT34',
                  gridTypeL: 'HT44',
                  gridTypeW: 'PT34',
                  length: 10,
                  width: 8,
                  height: 6,
                  ledWeight: 800,
                  presetName: 'Festival Carthage — Gril 10×8m'
                })}
              >
                Gril 10×8m
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyPreset({
                  structureType: 'grid',
                  towerType: 'PT34',
                  gridTypeL: 'HT44',
                  gridTypeW: 'HT44',
                  length: 12,
                  width: 10,
                  height: 7,
                  ledWeight: 1400,
                  presetName: 'Grand Gril Scénique 12×10m'
                })}
              >
                Gril 12×10m
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => applyPreset({
                  structureType: 'goalpost',
                  towerType: 'PT34',
                  gridTypeL: 'HT44',
                  gridTypeW: 'PT34',
                  length: 8,
                  width: 4,
                  height: 6,
                  ledWeight: 600,
                  presetName: 'Arche Goalpost Écran LED 8×6m'
                })}
              >
                Goalpost 8×6m
              </button>
            </div>
          </div>

          {/* Form Settings */}
          <div className="sidebar-section">
            <div className="section-header">
              <Sliders size={16} className="text-indigo" />
              <span className="section-title">Paramètres de Structure</span>
            </div>

            {/* Structure Type Select */}
            <div className="form-group">
              <label className="form-label">Type d'Architecture</label>
              <div className="segmented-toggle">
                <button
                  type="button"
                  className={`segment-btn ${config.structureType === 'grid' ? 'active' : ''}`}
                  onClick={() => setConfig(prev => ({ ...prev, structureType: 'grid' }))}
                >
                  Gril (Box Grid)
                </button>
                <button
                  type="button"
                  className={`segment-btn ${config.structureType === 'goalpost' ? 'active' : ''}`}
                  onClick={() => setConfig(prev => ({ ...prev, structureType: 'goalpost' }))}
                >
                  Arche (Goalpost)
                </button>
              </div>
            </div>

            {/* Truss Series Selectors */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Série Tours (Poteaux)</label>
                <select
                  name="towerType"
                  value={config.towerType}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="PT34">PT34 (Std 290)</option>
                  <option value="FT44">FT44 (Std 400)</option>
                  <option value="HT44">HT44 (Heavy 400)</option>
                  <option value="TT104">TT104 (1010 Monumental)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Série Poutres (Longueur)</label>
                <select
                  name="gridTypeL"
                  value={config.gridTypeL}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="PT34">PT34 (Std 290)</option>
                  <option value="FT44">FT44 (Std 400)</option>
                  <option value="HT44">HT44 (Heavy 400)</option>
                  <option value="TT104">TT104 (Monumental)</option>
                </select>
              </div>
            </div>

            {config.structureType === 'grid' && (
              <div className="form-group">
                <label className="form-label">Série Poutres (Largeur / Traverses)</label>
                <select
                  name="gridTypeW"
                  value={config.gridTypeW}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="PT34">PT34 (Std 290)</option>
                  <option value="FT44">FT44 (Std 400)</option>
                  <option value="HT44">HT44 (Heavy 400)</option>
                  <option value="TT104">TT104 (Monumental)</option>
                </select>
              </div>
            )}

            {/* Dimensional Steppers */}
            <div className="dimensions-box">
              <div className="stepper-row">
                <div className="stepper-meta">
                  <span className="stepper-title">Longueur de portée</span>
                  <span className="stepper-sub">Axe principal (m)</span>
                </div>
                <div className="stepper-controls">
                  <button type="button" className="stepper-btn" onClick={() => adjustValue('length', -1, 2, 40)}>
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    name="length"
                    value={config.length}
                    onChange={handleChange}
                    className="stepper-input"
                  />
                  <button type="button" className="stepper-btn" onClick={() => adjustValue('length', 1, 2, 40)}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {config.structureType === 'grid' && (
                <div className="stepper-row">
                  <div className="stepper-meta">
                    <span className="stepper-title">Largeur de gril</span>
                    <span className="stepper-sub">Profondeur scène (m)</span>
                  </div>
                  <div className="stepper-controls">
                    <button type="button" className="stepper-btn" onClick={() => adjustValue('width', -1, 2, 30)}>
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      name="width"
                      value={config.width}
                      onChange={handleChange}
                      className="stepper-input"
                    />
                    <button type="button" className="stepper-btn" onClick={() => adjustValue('width', 1, 2, 30)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="stepper-row">
                <div className="stepper-meta">
                  <span className="stepper-title">Hauteur sous pont</span>
                  <span className="stepper-sub">Dégagement utile (m)</span>
                </div>
                <div className="stepper-controls">
                  <button type="button" className="stepper-btn" onClick={() => adjustValue('height', -0.5, 2, 16)}>
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    name="height"
                    value={config.height}
                    onChange={handleChange}
                    className="stepper-input"
                  />
                  <button type="button" className="stepper-btn" onClick={() => adjustValue('height', 0.5, 2, 16)}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Suspended Load (LED / Audio / Light) */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label">Charge Suspendue (Écran LED / Projecteurs)</label>
                <span className="load-badge">{config.ledWeight} kg</span>
              </div>
              <input
                type="range"
                name="ledWeight"
                min="0"
                max="3000"
                step="50"
                value={config.ledWeight}
                onChange={handleChange}
                className="form-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                <span>0 kg</span>
                <span>1500 kg</span>
                <span>3000 kg</span>
              </div>
            </div>
          </div>

          {/* Load & Safety Analysis Panel */}
          <div className={`load-analysis-card ${calculation.isOverload ? 'is-critical' : ''}`}>
            <div className="analysis-header">
              <Scale size={16} className="text-amber" />
              <span className="analysis-title">Analyse des Charges & Sécurité</span>
            </div>

            <div className="analysis-metrics">
              <div className="metric-item">
                <span className="metric-label">Poids Alu Structure</span>
                <span className="metric-val">{calculation.aluWeight} kg</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Charge Totale</span>
                <span className="metric-val font-bold">{calculation.totalLoad} kg</span>
              </div>
            </div>

            {/* Safety Progress Bar */}
            <div className="safety-bar-wrapper">
              <div className="safety-bar-header">
                <span>Charge Moteur : {calculation.pointLoad} kg / tour</span>
                <span className="safety-pct">{calculation.loadPercentage}%</span>
              </div>
              <div className="safety-bar-track">
                <div
                  className={`safety-bar-fill ${calculation.isOverload ? 'overload' : (calculation.loadPercentage > 80 ? 'warning' : 'safe')}`}
                  style={{ width: `${Math.min(100, calculation.loadPercentage)}%` }}
                ></div>
              </div>
              <div className="safety-bar-footer">
                <span>Capacité palan : {calculation.pointLoadLimit} kg</span>
                <span>{calculation.numTowers} moteurs 1T</span>
              </div>
            </div>

            {/* Status Alert Badge */}
            <div className={`safety-status-alert ${calculation.isOverload ? 'alert-danger' : 'alert-success'}`}>
              {calculation.isOverload ? (
                <>
                  <AlertTriangle size={15} />
                  <span>Surcharge ou portée limite dépassée ! Vérifiez la configuration.</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Conforme aux normes scéniques BGV-C1 (Marge : {(100 - calculation.loadPercentage).toFixed(0)}%)</span>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Center / Right Viewport Area */}
        <section className="structure-viewport-section">
          {/* Viewport Top Bar */}
          <div className="viewport-controls-bar">
            {/* View Mode Toggle */}
            <div className="segmented-toggle small">
              <button
                type="button"
                className={`segment-btn ${viewMode === '3D' ? 'active' : ''}`}
                onClick={() => setViewMode('3D')}
              >
                Vue 3D Perspective
              </button>
              <button
                type="button"
                className={`segment-btn ${viewMode === '2D' ? 'active' : ''}`}
                onClick={() => setViewMode('2D')}
              >
                Vue Plan 2D (Top)
              </button>
            </div>

            {/* Visualizer Snapshot Actions */}
            <div className="viewport-actions">
              <button
                type="button"
                className="viewport-action-btn"
                title="Capturer l'image 3D"
                onClick={() => {
                  if (captureRef.current) {
                    captureRef.current.download(`Structure_Truss_${config.structureType}_3D.png`);
                  }
                }}
              >
                <Camera size={14} />
                <span>Capture 3D</span>
              </button>
              <button
                type="button"
                className="viewport-action-btn"
                title="Basculer en 2D et capturer le plan"
                onClick={() => {
                  setViewMode('2D');
                  setTimeout(() => {
                    if (captureRef.current) {
                      captureRef.current.download(`Structure_Truss_${config.structureType}_Plan2D.png`);
                    }
                  }, 500);
                }}
              >
                <FileText size={14} />
                <span>Capture Plan 2D</span>
              </button>
            </div>
          </div>

          {/* 3D Canvas Container */}
          <div className="structure-canvas-container">
            <Suspense fallback={
              <div className="canvas-loading-spinner">
                <div className="loading-spinner"></div>
                <span>Initialisation du moteur 3D Three.js...</span>
              </div>
            }>
              <Canvas gl={{ preserveDrawingBuffer: true, antialias: true }}>
                {viewMode === '3D' ? (
                  <PerspectiveCamera makeDefault position={[12, 11, 14]} fov={45} />
                ) : (
                  <OrthographicCamera makeDefault position={[0, 30, 0]} zoom={35} near={-50} far={200} />
                )}

                <ambientLight intensity={0.65} />
                <directionalLight position={[15, 25, 15]} intensity={1.2} castShadow />
                <directionalLight position={[-15, 10, -10]} intensity={0.4} />

                {/* Technical Floor Grid */}
                <Grid
                  infiniteGrid
                  fadeDistance={60}
                  sectionColor="#38bdf8"
                  cellColor="#1e293b"
                  sectionSize={2}
                  cellSize={1}
                />

                <OrbitControls
                  makeDefault
                  enableRotate={viewMode === '3D'}
                  enableZoom={true}
                  maxPolarAngle={Math.PI / 2 + 0.05}
                />

                <color attach="background" args={['#07080e']} />

                {/* Truss Model */}
                <Truss3D
                  length={config.length}
                  width={config.width}
                  height={config.height}
                  sectionSize={calculation.gridSpecL.sectionSize}
                  tubeSize={0.05}
                  isOverload={calculation.isOverload}
                  grid={{
                    isGoalpost: config.structureType === 'goalpost',
                    lenSpans: calculation.lenSpans,
                    widSpans: calculation.widSpans
                  }}
                  towSpec={calculation.towSpec}
                  gridSpecL={calculation.gridSpecL}
                  gridSpecW={calculation.gridSpecW}
                  showLabels={true}
                />

                {/* Capture Handler */}
                <SceneCapture captureRef={captureRef} />
              </Canvas>
            </Suspense>

            {/* Real-time Floating BOM Summary Card */}
            <div className="floating-equipment-summary">
              <div className="floating-header">
                <Layers size={14} className="text-indigo" />
                <span>SYNTHÈSE DU MATÉRIEL REQUIS</span>
              </div>
              <div className="floating-grid">
                <div className="floating-item">
                  <span className="f-label">Poutres 3m :</span>
                  <span className="f-val">{calculation.totals.s3}</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Poutres 2m :</span>
                  <span className="f-val">{calculation.totals.s2}</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Poutres 1m :</span>
                  <span className="f-val">{calculation.totals.s1}</span>
                </div>
                {calculation.totals.s05 > 0 && (
                  <div className="floating-item">
                    <span className="f-label">Poutres 0.5m :</span>
                    <span className="f-val">{calculation.totals.s05}</span>
                  </div>
                )}
                <div className="floating-item">
                  <span className="f-label">Angles Box Corner :</span>
                  <span className="f-val">{calculation.totals.corners}</span>
                </div>
                {calculation.totals.tJunctions > 0 && (
                  <div className="floating-item">
                    <span className="f-label">Jonctions T :</span>
                    <span className="f-val">{calculation.totals.tJunctions}</span>
                  </div>
                )}
                <div className="floating-item">
                  <span className="f-label">Embases Lourdes :</span>
                  <span className="f-val">{calculation.totals.bases}</span>
                </div>
                <div className="floating-item">
                  <span className="f-label">Moteurs / Palans 1T :</span>
                  <span className="f-val highlight">{calculation.totals.motors}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom BOM Technical Equipment Table */}
          <div className="viewport-bom-section">
            <div className="bom-section-header">
              <div className="bom-header-info">
                <Package size={17} className="text-indigo" />
                <h3>Nomenclature Détaillée & Colisage (BOM)</h3>
                <span className="bom-count-pill">{calculation.equipmentBOM.length} références</span>
              </div>
              <div className="bom-header-total">
                <span>Poids Total Équipements : <strong>{calculation.equipmentBOM.reduce((sum, item) => sum + item.totalWeightKg, 0).toFixed(0)} kg</strong></span>
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
                  {calculation.equipmentBOM.map(item => (
                    <tr key={item.id}>
                      <td className="bom-cat-td">{item.category}</td>
                      <td className="bom-name-td"><strong>{item.name}</strong></td>
                      <td className="bom-spec-td">{item.spec}</td>
                      <td className="bom-qty-td">
                        <span className="qty-tag">{item.quantity}</span>
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
        onLoginSuccess={handleLoginSuccess}
      />

      <SaveModelModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        calculation={calculation}
        onModelSaved={(saved) => {
          setActiveModel(saved);
          setEventName(saved.eventName);
          setSiteName(saved.siteName || '');
        }}
        currentEventName={eventName}
      />

      <SavedModelsModal
        isOpen={isSavedModelsModalOpen}
        onClose={() => setIsSavedModelsModalOpen(false)}
        onLoadModel={handleLoadModel}
        onExportPdfForModel={(model) => {
          handleLoadModel(model);
          setIsExportModalOpen(true);
        }}
        activeModelId={activeModel?._id}
      />

      <StructureExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        calculation={calculation}
        eventName={eventName}
        siteName={siteName}
        capture3DUrl={capture3DUrl}
        capturePlanUrl={capturePlanUrl}
      />
    </div>
  );
}
