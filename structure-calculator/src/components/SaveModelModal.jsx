import React, { useState } from 'react';
import { X, Save, Calendar, MapPin, FileText, AlertCircle, Wrench, ShieldCheck } from 'lucide-react';
import { structureModelService } from '../services/structureModelService';

export default function SaveModelModal({
  isOpen,
  onClose,
  calculation,
  onModelSaved,
  currentEventName = ''
}) {
  const [eventName, setEventName] = useState(currentEventName || '');
  const [siteName, setSiteName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !calculation) return null;

  const {
    config,
    totals,
    towSpec,
    gridSpecL,
    gridSpecW,
    aluWeight,
    totalLoad,
    pointLoad,
    pointLoadLimit,
    loadPercentage,
    isOverload
  } = calculation;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setError("Le nom de l'événement est obligatoire");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const modelPayload = {
        eventName: eventName.trim(),
        siteName: siteName.trim(),
        structureType: config.structureType,
        towerType: config.towerType,
        gridTypeL: config.gridTypeL,
        gridTypeW: config.gridTypeW,
        length: config.length,
        width: config.width,
        height: config.height,
        ledWeight: config.ledWeight,
        totals,
        aluWeight,
        totalLoad,
        pointLoad,
        pointLoadLimit,
        loadPercentage,
        isOverload,
        notes: notes.trim()
      };

      const saved = await structureModelService.saveModel(modelPayload);
      onModelSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement du modèle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-box save-model-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24' }}>
              <Save size={20} />
            </div>
            <div>
              <h3>Enregistrer le Modèle de Structure</h3>
              <p>Sauvegardez cette configuration truss pour votre événement</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="save-model-form">
          {error && (
            <div className="save-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Config Recap */}
          <div className="model-recap-card">
            <span className="recap-title">Configuration à enregistrer :</span>
            <div className="recap-grid">
              <div className="recap-item">
                <span className="recap-label">Type & Dimensions</span>
                <span className="recap-val">{config.structureType === 'goalpost' ? 'Arche Goalpost' : 'Gril Box Grid'}</span>
                <span className="recap-sub">{config.length}m (L) × {config.width}m (l) × {config.height}m (H)</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Séries Truss</span>
                <span className="recap-val">{towSpec.shortName || towSpec.name}</span>
                <span className="recap-sub">Gril: {gridSpecL.shortName || gridSpecL.name}</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Poutres modulaires</span>
                <span className="recap-val">{totals.s3 + totals.s2 + totals.s1 + totals.s05} éléments</span>
                <span className="recap-sub">{totals.s3}×3m • {totals.s2}×2m • {totals.s1}×1m</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Charge & Poids</span>
                <span className="recap-val">{totalLoad} kg</span>
                <span className="recap-sub">Palan: {pointLoad} kg/tour</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
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
                placeholder="Ex: Carthage Festival 2026 — Gril Principal, Concert Arena..."
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="save-field-group">
              <label className="save-field-label">
                <MapPin size={15} />
                <span>Lieu / Scène / Salle (Optionnel)</span>
              </label>
              <input
                type="text"
                className="save-input"
                placeholder="Ex: Scène Principale, Salle Polyvalente, Hall A..."
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>

            <div className="save-field-group">
              <label className="save-field-label">
                <FileText size={15} />
                <span>Notes & Consignes de montage</span>
              </label>
              <textarea
                className="save-textarea"
                rows="2"
                placeholder="Ex: Calage vérins obligatoire, suspension écran LED centrée, sécurisation par élingues acier..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
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
                  <span>Enregistrer le Modèle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
