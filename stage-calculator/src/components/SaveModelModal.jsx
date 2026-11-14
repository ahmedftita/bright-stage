import React, { useState } from 'react';
import { X, Save, Calendar, MapPin, FileText, Check, Layers, AlertCircle } from 'lucide-react';
import { stageModelService } from '../services/stageModelService';

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

  const { modules, physicalDimensions, counts, heightSpec, logistics } = calculation;
  const { length: L, width: l } = modules;
  const { lengthM, widthM, heightM, surfaceM2 } = physicalDimensions;

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
        length: L,
        width: l,
        heightId: heightSpec.id,
        heightM: heightM,
        surfaceM2: surfaceM2,
        includeStairs: counts.stairs > 0,
        stairsCount: counts.stairs || 1,
        includeGuardrails: counts.guardrails > 0,
        guardrailSides: 'back-sides',
        counts: {
          stagePlaques: counts.stagePlaques,
          stagePieds: counts.stagePieds,
          stageCotes: counts.stageCotes,
          stairs: counts.stairs,
          stairSteps: counts.stairSteps,
          guardrails: counts.guardrails
        },
        totalLoadCapacityKg: logistics.totalLoadCapacityKg,
        totalWeightKg: logistics.totalWeightKg,
        notes: notes.trim()
      };

      const saved = await stageModelService.saveModel(modelPayload);
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
              <h3>Enregistrer le Modèle de Scène</h3>
              <p>Sauvegardez cette configuration pour votre événement</p>
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
                <span className="recap-label">Dimensions</span>
                <span className="recap-val">{lengthM} m × {widthM} m</span>
                <span className="recap-sub">({L} × {l} modules)</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Hauteur</span>
                <span className="recap-val">{Math.round(heightM * 100)} cm</span>
                <span className="recap-sub">{heightSpec.label}</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Surface</span>
                <span className="recap-val">{surfaceM2} m²</span>
                <span className="recap-sub">{counts.stagePlaques} plaques</span>
              </div>
              <div className="recap-item">
                <span className="recap-label">Matériel requis</span>
                <span className="recap-val">{counts.stagePieds} pieds</span>
                <span className="recap-sub">{counts.stageCotes} côtés</span>
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
                placeholder="Ex: Festival de Carthage 2026, Gala Annuel, Concert..."
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
                placeholder="Ex: Amphithéâtre, Salle Omnisport, Théâtre de plein air..."
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>

            <div className="save-field-group">
              <label className="save-field-label">
                <FileText size={15} />
                <span>Notes & Instructions particulières</span>
              </label>
              <textarea
                className="save-textarea"
                rows="2"
                placeholder="Ex: Accès par la rampe droite, vérins à caler sur sol meuble..."
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
