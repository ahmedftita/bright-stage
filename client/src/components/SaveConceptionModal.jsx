import React, { useState } from 'react';
import { X, Save, Calendar, MapPin, FileText, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { conceptionService } from '../services/conceptionService';

export default function SaveConceptionModal({
  isOpen,
  onClose,
  conception,
  onConceptionSaved,
  currentEventName = ''
}) {
  const [eventName, setEventName] = useState(currentEventName || '');
  const [siteName, setSiteName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !conception) return null;

  const { stage, structure, screen, lighting, totalRigging, totalPower, equipmentBOM } = conception;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setError("Le nom de l'événement est obligatoire");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        eventName: eventName.trim(),
        siteName: siteName.trim(),
        stageConfig: {
          enabled: stage.enabled !== false,
          lengthModules: stage.modules.length,
          widthModules: stage.modules.width,
          lengthM: stage.dimensions.lengthM,
          widthM: stage.dimensions.widthM,
          heightM: stage.dimensions.heightM,
          surfaceM2: stage.dimensions.surfaceM2,
          hasStairs: stage.hasStairs,
          stairsCount: stage.counts.stairs,
          stairsSide: stage.counts.stairsSide,
          hasSkirting: stage.hasSkirting,
          counts: stage.counts,
          admissibleLoadKg: stage.admissibleStageLoadKg,
          totalWeightKg: stage.totalWeightKg
        },
        structureConfig: {
          enabled: structure.enabled !== false,
          structureType: structure.structureType,
          towerType: structure.series.towerType,
          gridTypeL: structure.series.gridTypeL,
          gridTypeW: structure.series.gridTypeW,
          length: structure.dimensions.length,
          width: structure.dimensions.width,
          height: structure.dimensions.height,
          aluWeight: structure.aluWeight,
          numTowers: structure.numTowers,
          totemsCount: structure.totems?.count || 0,
          totemHeightM: structure.totems?.heightM || 2.5,
          totems: structure.totems,
          totals: structure.totals
        },
        screenConfig: {
          enabled: screen.enabled !== false,
          pitch: screen.pitch,
          mountType: screen.mountType,
          cabinetsW: screen.cabinets.width,
          cabinetsH: screen.cabinets.height,
          screenWidthM: screen.dimensions.widthM,
          screenHeightM: screen.dimensions.heightM,
          totalPixels: screen.totalPixels,
          screenWeightKg: screen.screenWeightKg,
          powerConsumptionKw: screen.screenPowerKw
        },
        lightingConfig: {
          enabled: lighting.enabled !== false,
          beamsCount: lighting.counts.beams,
          spotsCount: lighting.counts.spots,
          washesCount: lighting.counts.washes,
          ledBarsCount: lighting.counts.ledBars,
          blindersCount: lighting.counts.blinders,
          hazerCount: lighting.counts.hazers,
          sideMatricesCount: lighting.sideMatricesCount || 0,
          sideMatricesFlancs: lighting.sideMatricesFlancs || 1,
          sideMatricesMargin: lighting.sideMatricesMargin ?? 0.4,
          sideMatricesFlancSpacing: lighting.sideMatricesFlancSpacing ?? 0.5,
          sideMatricesOrientation: lighting.sideMatricesOrientation || 'horizontal',
          sideMatricesPosition: lighting.sideMatricesPosition || 'lateral',
          sideFixtureType: lighting.sideFixtureType || 'cob_blinder_2eye',
          totalSideMatrices: lighting.totalSideMatrices || 0,
          totemBeamsCount: lighting.totemBeamsCount || 0,
          showBeams: lighting.showBeams,
          beamColor: lighting.beamColor,
          totalLightingWeightKg: lighting.totalLightingWeightKg,
          totalLightingPowerKw: lighting.totalLightingPowerKw,
          totalDmxChannels: lighting.totalDmxChannels
        },
        totalRigging,
        totalPower,
        equipmentBOM,
        notes: notes.trim()
      };

      const saved = await conceptionService.saveConception(payload);
      onConceptionSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement de la conception");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-box save-model-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(236, 72, 153, 0.18)', color: '#ec4899' }}>
              <Save size={20} />
            </div>
            <div>
              <h3>Enregistrer la Conception Complète</h3>
              <p>Sauvegarde unifiée : Scène, Structure, Écran LED & Éclairage</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="save-model-form">
          {error && (
            <div className="save-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Recap */}
          <div className="model-recap-card">
            <span className="recap-title">Synthèse de la configuration globale :</span>
            <div className="recap-grid">
              <div className="recap-item">
                <span className="recap-label">Scène</span>
                <span className="recap-val">{stage.dimensions.lengthM}m × {stage.dimensions.widthM}m</span>
                <span className="recap-sub">H={Math.round(stage.dimensions.heightM * 100)}cm • {stage.dimensions.surfaceM2}m²</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Structure Truss</span>
                <span className="recap-val">{structure.dimensions.length}m × {structure.dimensions.width}m</span>
                <span className="recap-sub">H={structure.dimensions.height}m • {structure.structureType === 'goalpost' ? 'Arche' : 'Gril'}</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Écran LED</span>
                <span className="recap-val">{screen.dimensions.widthM}m × {screen.dimensions.heightM}m</span>
                <span className="recap-sub">Pitch {screen.pitch} • {screen.screenWeightKg} kg</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Lumière & Puissance</span>
                <span className="recap-val">{lighting.counts.total} projecteurs</span>
                <span className="recap-sub">Puissance : {totalPower.totalKw} kW ({totalPower.triAmps380V}A Tri)</span>
              </div>
            </div>
          </div>

          <div className="save-fields-container">
            <div className="save-field-group">
              <label className="save-field-label">
                <Calendar size={15} />
                <span>Nom de l'Événement *</span>
              </label>
              <input
                type="text"
                required
                className="save-input-primary"
                placeholder="Ex: Carthage Festival 2026 — Scène Principale & Show Lumière"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="save-field-group">
              <label className="save-field-label">
                <MapPin size={15} />
                <span>Lieu / Site (Optionnel)</span>
              </label>
              <input
                type="text"
                className="save-input"
                placeholder="Ex: Amphithéâtre, Palais des Congrès, Esplanade..."
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>

            <div className="save-field-group">
              <label className="save-field-label">
                <FileText size={15} />
                <span>Consignes de Montage & Régie</span>
              </label>
              <textarea
                className="save-textarea"
                rows="2"
                placeholder="Ex: Arrivée électrique 63A à gauche de scène, accroche écran centrée, test DMX univers 1-3..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0 0', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="action-btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Enregistrer la Conception</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
