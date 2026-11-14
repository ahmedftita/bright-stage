import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Grid,
  Plus,
  Minus,
  Calculator,
  Box,
  Sliders,
  Sparkles,
  Printer,
  Copy,
  Table,
  Check,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wrench,
  ChevronRight,
  Info,
  Save,
  FolderOpen,
  LogOut,
  User,
  Calendar
} from 'lucide-react';
import {
  calculateStage,
  HARDWARE_SPECS,
  PRECALCULATED_CONFIGURATIONS,
  HEIGHT_OPTIONS
} from '../utils/stageCalcLogic';
import StageVisualizer from './StageVisualizer';
import ExportSummaryModal from './ExportSummaryModal';
import LoginModal from './LoginModal';
import SaveModelModal from './SaveModelModal';
import SavedModelsModal from './SavedModelsModal';
import { authService } from '../services/authService';
import { stageModelService } from '../services/stageModelService';

export default function StageCalculator() {
  // Auth state
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!authService.isAuthenticated());

  // Event Models state
  const [activeEventName, setActiveEventName] = useState('');
  const [activeModelId, setActiveModelId] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedModelsModalOpen, setIsSavedModelsModalOpen] = useState(false);
  const [savedModelsCount, setSavedModelsCount] = useState(0);

  // Config state
  const [length, setLength] = useState(6); // L modules
  const [width, setWidth] = useState(4);   // l modules
  const [heightId, setHeightId] = useState('h55');
  const [includeStairs, setIncludeStairs] = useState(true);
  const [stairsCount, setStairsCount] = useState(1);
  const [includeGuardrails, setIncludeGuardrails] = useState(false);
  const [guardrailSides, setGuardrailSides] = useState('back-sides');
  const [activeTab, setActiveTab] = useState('calc'); // 'calc' | 'precalc-table'

  // Modal export
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedQuick, setCopiedQuick] = useState(false);

  // Load saved models count on mount
  useEffect(() => {
    stageModelService.getModels().then(list => {
      setSavedModelsCount(list.length);
    }).catch(() => {});
  }, []);

  // Dynamic Calculation
  const calculation = useMemo(() => {
    return calculateStage({
      length,
      width,
      heightId,
      includeStairs,
      stairsCount,
      includeGuardrails,
      guardrailSides
    });
  }, [
    length,
    width,
    heightId,
    includeStairs,
    stairsCount,
    includeGuardrails,
    guardrailSides
  ]);

  const numL = Math.max(1, parseInt(length) || 1);
  const numW = Math.max(1, parseInt(width) || 1);

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsLoginModalOpen(true);
  };

  // Event Model Handlers
  const handleModelSaved = (savedModel) => {
    setActiveEventName(savedModel.eventName);
    setActiveModelId(savedModel._id);
    stageModelService.getModels().then(list => setSavedModelsCount(list.length));
  };

  const handleLoadModel = (model) => {
    setLength(model.length);
    setWidth(model.width);
    if (model.heightId) setHeightId(model.heightId);
    setIncludeStairs(!!model.includeStairs);
    if (model.stairsCount) setStairsCount(model.stairsCount);
    setIncludeGuardrails(!!model.includeGuardrails);
    if (model.guardrailSides) setGuardrailSides(model.guardrailSides);
    setActiveEventName(model.eventName);
    setActiveModelId(model._id);
    setActiveTab('calc');
  };

  const handleExportPdfForModel = (model) => {
    handleLoadModel(model);
    setModalOpen(true);
  };

  const handleClearActiveEvent = () => {
    setActiveEventName('');
    setActiveModelId(null);
  };

  // Apply row from precalculated table
  const handleSelectPrecalculated = (row) => {
    setLength(row.length);
    setWidth(row.width);
  };

  const handleReset = () => {
    setLength(6);
    setWidth(4);
    setHeightId('h55');
    setIncludeStairs(true);
    setStairsCount(1);
    setIncludeGuardrails(false);
    setActiveEventName('');
    setActiveModelId(null);
  };

  const handleQuickCopy = async () => {
    if (!calculation) return;
    const prefix = activeEventName ? `[${activeEventName.toUpperCase()}]\n` : '';
    const text = `${prefix}Scène ${calculation.physicalDimensions.lengthM}m × ${calculation.physicalDimensions.widthM}m (${calculation.physicalDimensions.surfaceM2} m²)\n• Stage plaques : ${calculation.counts.stagePlaques}\n• Stage pieds : ${calculation.counts.stagePieds}\n• Stage côtés : ${calculation.counts.stageCotes}\nHauteur: ${Math.round(calculation.physicalDimensions.heightM * 100)} cm`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuick(true);
      setTimeout(() => setCopiedQuick(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="stage-app-layout">
      {/* Top Application Bar */}
      <header className="stage-navbar">
        <div className="navbar-left">
          <div className="navbar-logo-badge">
            <Layers size={22} className="logo-icon" />
          </div>
          <div>
            <div className="navbar-brand">
              <span className="brand-title">Stage Calculator Pro</span>
              <span className="brand-tag">Standard 1.22 × 1.22 m</span>
            </div>
            <p className="navbar-sub">
              Calculateur certifié Bright Stage pour scènes, praticables, pieds et cadres latéraux
            </p>
          </div>
        </div>

        <div className="navbar-right">
          {/* Button: Modèles d'événements */}
          <button
            type="button"
            className="nav-btn btn-secondary"
            onClick={() => setIsSavedModelsModalOpen(true)}
            title="Consulter et charger les modèles de scènes enregistrés"
          >
            <FolderOpen size={16} />
            <span className="btn-label-desktop">Modèles ({savedModelsCount})</span>
            <span className="btn-label-mobile">({savedModelsCount})</span>
          </button>

          {/* Button: Enregistrer ce modèle */}
          <button
            type="button"
            className="nav-btn btn-secondary"
            onClick={() => setIsSaveModalOpen(true)}
            title="Enregistrer la configuration actuelle sous le nom d'un événement"
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
          >
            <Save size={16} />
            <span className="btn-label-desktop">Enregistrer modèle</span>
            <span className="btn-label-mobile">Sauver</span>
          </button>

          {/* Button: Tableau des Métrages */}
          <button
            type="button"
            className={`nav-btn btn-secondary ${activeTab === 'precalc-table' ? 'active-tab-nav' : ''}`}
            onClick={() => setActiveTab(activeTab === 'precalc-table' ? 'calc' : 'precalc-table')}
          >
            <Table size={16} />
            <span className="btn-label-desktop">{activeTab === 'precalc-table' ? 'Calculateur' : 'Tableau (10)'}</span>
            <span className="btn-label-mobile">{activeTab === 'precalc-table' ? 'Calcul' : 'Tableau'}</span>
          </button>

          {/* Button: Copie Rapide */}
          <button
            type="button"
            className={`nav-btn btn-secondary ${copiedQuick ? 'btn-success' : ''}`}
            onClick={handleQuickCopy}
          >
            {copiedQuick ? <Check size={16} /> : <Copy size={16} />}
            <span className="btn-label-desktop">{copiedQuick ? 'Copié !' : 'Copie'}</span>
            <span className="btn-label-mobile">{copiedQuick ? 'OK' : 'Copier'}</span>
          </button>

          {/* Button: Fiche Technique / Export PDF */}
          <button
            type="button"
            className="nav-btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Printer size={16} />
            <span className="btn-label-desktop">Fiche Technique & Export</span>
            <span className="btn-label-mobile">Fiche PDF</span>
          </button>

          {/* User Account Badge */}
          {user ? (
            <div className="user-account-badge">
              <div className="user-avatar-circle" title={user.name}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info-text">
                <span className="user-name">{user.name || 'Utilisateur'}</span>
                <span className="user-role-tag">{user.role || 'Bright Stage'}</span>
              </div>
              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
                title="Déconnexion"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={() => setIsLoginModalOpen(true)}
              style={{ fontSize: '12px' }}
            >
              <User size={15} />
              <span>Connexion</span>
            </button>
          )}
        </div>
      </header>

      {/* Active Event Banner (si un modèle d'événement est chargé) */}
      {activeEventName && (
        <div className="active-event-banner">
          <div className="event-banner-left">
            <span className="event-badge-label">Événement Associé</span>
            <span className="event-name-display">{activeEventName}</span>
            <span className="event-site-tag">• Modèle actif chargé</span>
          </div>
          <div className="event-banner-actions">
            <button
              type="button"
              className="btn-event-action btn-event-new"
              onClick={handleClearActiveEvent}
              title="Détacher du modèle et commencer un projet libre"
            >
              <span>Nouveau Projet Libre</span>
            </button>
            <button
              type="button"
              className="btn-event-action btn-event-new"
              onClick={() => setIsSaveModalOpen(true)}
              style={{ borderColor: '#f59e0b', color: '#fbbf24' }}
            >
              <Save size={13} />
              <span>Enregistrer Modifications</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      {activeTab === 'precalc-table' ? (
        /* Full View: Tableau des métrages et quantités précalculées */
        <main className="precalc-full-view">
          <div className="precalc-container-box">
            <div className="precalc-header-row">
              <div>
                <h2>Tableau des Métrages et Quantités Précalculées</h2>
                <p>Sélectionnez une configuration type pour charger instantanément les dimensions dans le calculateur</p>
              </div>
              <button
                type="button"
                className="action-btn btn-primary"
                onClick={() => setActiveTab('calc')}
              >
                <span>Ouvrir dans le Visualiseur 2D</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="precalc-table-wrapper">
              <table className="precalc-table">
                <thead>
                  <tr>
                    <th>Configuration (Modules)</th>
                    <th>Dimensions Réelles (L × l)</th>
                    <th style={{ textAlign: 'right' }}>Surface Totale</th>
                    <th style={{ textAlign: 'right' }}>Stage plaques (L × l)</th>
                    <th style={{ textAlign: 'right' }}>Stage pieds ((L+1)×(l+1))</th>
                    <th style={{ textAlign: 'right' }}>Stage côtés (L(l+1)+l(L+1))</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {PRECALCULATED_CONFIGURATIONS.map((row, idx) => {
                    const isCurrent = numL === row.length && numW === row.width;
                    return (
                      <tr
                        key={idx}
                        className={`precalc-row ${isCurrent ? 'is-current-active' : ''}`}
                        onClick={() => handleSelectPrecalculated(row)}
                      >
                        <td>
                          <div className="config-name-cell">
                            <strong className="config-badge">{row.length} × {row.width}</strong>
                            <span className="config-label">{row.label}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-bold">{row.dims}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-emerald">{row.surfaceM2} m²</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="badge-count badge-indigo">{row.plaques}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="badge-count badge-emerald">{row.pieds}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="badge-count badge-amber">{row.cotes}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={`select-config-btn ${isCurrent ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPrecalculated(row);
                              setActiveTab('calc');
                            }}
                          >
                            {isCurrent ? 'Actif' : 'Sélectionner'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Hardware Specifications Reference Card */}
            <div className="hardware-specs-banner">
              <h3>Spécifications Techniques Officielles du Matériel</h3>
              <div className="hardware-cards-grid">
                <div className="hardware-spec-card">
                  <div className="spec-card-icon text-indigo">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h4>Stage plaque (Plateau)</h4>
                    <p>{HARDWARE_SPECS.plaque.spec}</p>
                    <span className="spec-badge">Dimensions 1,22 × 1,22 m • Poids 31,5 kg</span>
                  </div>
                </div>

                <div className="hardware-spec-card">
                  <div className="spec-card-icon text-emerald">
                    <Box size={20} />
                  </div>
                  <div>
                    <h4>Stage pied (Poteau + vérin)</h4>
                    <p>{HARDWARE_SPECS.pied.spec}</p>
                    <span className="spec-badge">Vérin ajustable • Embase filetée</span>
                  </div>
                </div>

                <div className="hardware-spec-card">
                  <div className="spec-card-icon text-amber">
                    <Grid size={20} />
                  </div>
                  <div>
                    <h4>Stage côté (Cadre latéral)</h4>
                    <p>{HARDWARE_SPECS.cote.spec}</p>
                    <span className="spec-badge">Liaison traverses 50 mm & diagonales 25 mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Workspace 2 Columns */
        <main className="stage-workspace">
          {/* LEFT COLUMN: Controls & Technical Formulas */}
          <aside className="stage-sidebar-controls">
            {/* Card: Dimensions de la Scène */}
            <div className="control-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="accent-pill" />
                  <Grid size={17} className="text-indigo" />
                  <span>Dimensions de Scène (1.22m)</span>
                </div>
                <button
                  type="button"
                  className="reset-icon-btn"
                  onClick={handleReset}
                  title="Réinitialiser"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Stepper: Longueur L */}
              <div className="form-group">
                <div className="field-label-group">
                  <label className="field-label">Longueur (L)</label>
                  <span className="field-conversion-badge">
                    L × 1,22 m = <strong>{calculation.physicalDimensions.lengthM} m</strong>
                  </span>
                </div>
                <div className="stepper-box">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setLength(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                    disabled={numL <= 1}
                  >
                    <Minus size={15} />
                  </button>
                  <div className="stepper-center">
                    <input
                      type="number"
                      className="stepper-input"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      min="1"
                      max="50"
                    />
                    <span className="stepper-unit">modules</span>
                  </div>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setLength(prev => (parseInt(prev) || 0) + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Stepper: Largeur l */}
              <div className="form-group">
                <div className="field-label-group">
                  <label className="field-label">Largeur (l)</label>
                  <span className="field-conversion-badge">
                    l × 1,22 m = <strong>{calculation.physicalDimensions.widthM} m</strong>
                  </span>
                </div>
                <div className="stepper-box">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setWidth(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                    disabled={numW <= 1}
                  >
                    <Minus size={15} />
                  </button>
                  <div className="stepper-center">
                    <input
                      type="number"
                      className="stepper-input"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      min="1"
                      max="50"
                    />
                    <span className="stepper-unit">modules</span>
                  </div>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setWidth(prev => (parseInt(prev) || 0) + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Formulas Display Callout */}
              <div className="formula-callout-box">
                <div className="callout-title">
                  <Info size={14} />
                  <span>Formules officielles appliquées</span>
                </div>
                <ul className="callout-formulas-list">
                  <li>Surface totale : <code>{numL} × {numW} × 1,4884 = {calculation.physicalDimensions.surfaceM2} m²</code></li>
                  <li>Stage plaques : <code>L × l = {calculation.counts.stagePlaques}</code></li>
                  <li>Stage pieds : <code>({numL}+1) × ({numW}+1) = {calculation.counts.stagePieds}</code></li>
                  <li>Stage côtés : <code>{numL}×({numW}+1) + {numW}×({numL}+1) = {calculation.counts.stageCotes}</code></li>
                </ul>
              </div>
            </div>

            {/* Card: Hauteur & Vérins */}
            <div className="control-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="accent-pill" />
                  <Sliders size={17} className="text-emerald" />
                  <span>Hauteur & Vérins</span>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">Hauteur de Scène (H)</label>
                <select
                  className="select-custom"
                  value={heightId}
                  onChange={(e) => setHeightId(e.target.value)}
                >
                  {HEIGHT_OPTIONS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hardware Spec: Stage Pied */}
              <div className="hardware-inline-note">
                <strong>Stage pied :</strong> {HARDWARE_SPECS.pied.spec}
              </div>
            </div>

            {/* Card: Options & Finitions */}
            <div className="control-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="accent-pill" />
                  <ShieldCheck size={17} className="text-purple" />
                  <span>Accessoires Scène</span>
                </div>
              </div>

              <div className="option-toggle-row">
                <div className="option-info">
                  <span className="option-title">Escalier d'accès</span>
                  <span className="option-desc">
                    {calculation.heightSpec.steps > 0
                      ? `${calculation.heightSpec.steps} marche(s) pour H=${Math.round(calculation.physicalDimensions.heightM * 100)}cm`
                      : 'Non nécessaire pour H=20cm'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="custom-switch"
                  checked={includeStairs}
                  onChange={(e) => setIncludeStairs(e.target.checked)}
                  disabled={calculation.heightSpec.steps === 0}
                />
              </div>

              <div className="option-toggle-row">
                <div className="option-info">
                  <span className="option-title">Garde-corps sécurité</span>
                  <span className="option-desc">Norme ERP</span>
                </div>
                <input
                  type="checkbox"
                  className="custom-switch"
                  checked={includeGuardrails}
                  onChange={(e) => setIncludeGuardrails(e.target.checked)}
                />
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: KPI Metrics + Interactive Visualizer + BOM */}
          <section className="stage-main-display">
            {/* Top 3 Official Hardware KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card highlight-indigo">
                <div className="kpi-icon-wrapper">
                  <Layers size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Stage plaques (Plateau)</span>
                  <div className="kpi-value-row">
                    <span className="kpi-number">{calculation.counts.stagePlaques}</span>
                    <span className="kpi-unit">plaques</span>
                  </div>
                  <span className="kpi-sub">
                    Surface : <strong>{calculation.physicalDimensions.surfaceM2} m²</strong> (L × l × 1,4884)
                  </span>
                </div>
              </div>

              <div className="kpi-card highlight-emerald">
                <div className="kpi-icon-wrapper">
                  <Box size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Stage pieds (Poteau + Vérin)</span>
                  <div className="kpi-value-row">
                    <span className="kpi-number">{calculation.counts.stagePieds}</span>
                    <span className="kpi-unit">pieds</span>
                  </div>
                  <span className="kpi-sub">
                    Formule : <strong>({numL}+1) × ({numW}+1)</strong>
                  </span>
                </div>
              </div>

              <div className="kpi-card highlight-amber">
                <div className="kpi-icon-wrapper">
                  <Grid size={22} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Stage côtés (Cadre latéral)</span>
                  <div className="kpi-value-row">
                    <span className="kpi-number">{calculation.counts.stageCotes}</span>
                    <span className="kpi-unit">côtés</span>
                  </div>
                  <span className="kpi-sub">
                    L(l+1) + l(L+1) = <strong>{calculation.counts.stageCotes}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Visualizer Canvas */}
            <div className="display-card">
              <StageVisualizer calculation={calculation} />
            </div>

            {/* Hardware Nomenclature Summary Table */}
            <div className="display-card bom-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="accent-pill" />
                  <Wrench size={17} className="text-emerald" />
                  <span>Détail du Matériel & Spécifications</span>
                </div>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setModalOpen(true)}
                >
                  <span>Fiche technique complète & impression</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="bom-quick-list">
                {calculation.billOfMaterials.map((item, idx) => (
                  <div key={idx} className="bom-quick-row">
                    <div className="bom-quick-info">
                      <span className="bom-cat-indicator">{item.category}</span>
                      <strong className="bom-quick-name">{item.name}</strong>
                      <span className="bom-quick-spec">{item.spec}</span>
                    </div>
                    <div className="bom-quick-qty-box">
                      <span className="bom-qty-num">{item.quantity}</span>
                      <span className="bom-qty-unit">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Export / Printable Modal Dialog */}
      <ExportSummaryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        calculation={calculation}
        projectName={activeEventName || "Fiche Technique Scène Modulaire"}
      />

      {/* Save Model Modal Dialog */}
      <SaveModelModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        calculation={calculation}
        onModelSaved={handleModelSaved}
        currentEventName={activeEventName}
      />

      {/* Saved Models List / Loader Dialog */}
      <SavedModelsModal
        isOpen={isSavedModelsModalOpen}
        onClose={() => setIsSavedModelsModalOpen(false)}
        onLoadModel={handleLoadModel}
        onExportPdfForModel={handleExportPdfForModel}
        activeModelId={activeModelId}
      />

      {/* Bright Stage Auth / Login Guard Dialog */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
