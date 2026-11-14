import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Search,
  Calendar,
  MapPin,
  Trash2,
  ArrowRight,
  Printer,
  Sparkles,
  Layers,
  Scale
} from 'lucide-react';
import { stageModelService } from '../services/stageModelService';

export default function SavedModelsModal({
  isOpen,
  onClose,
  onLoadModel,
  onExportPdfForModel,
  activeModelId = null
}) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await stageModelService.getModels();
      setModels(data);
    } catch (err) {
      console.error("Erreur chargement modèles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle d'événement ?")) return;

    setDeletingId(id);
    try {
      await stageModelService.deleteModel(id);
      setModels(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredModels = models.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      (m.eventName && m.eventName.toLowerCase().includes(q)) ||
      (m.siteName && m.siteName.toLowerCase().includes(q)) ||
      (m.createdByName && m.createdByName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-box saved-models-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8' }}>
              <FolderOpen size={20} />
            </div>
            <div>
              <h3>Modèles d'Événements Enregistrés</h3>
              <p>{models.length} configuration{models.length > 1 ? 's' : ''} enregistrée{models.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="saved-models-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher par nom d'événement, lieu, organisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Models List */}
        <div className="saved-models-list-scroll">
          {loading ? (
            <div className="models-empty-state">
              <span>Chargement des modèles...</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="models-empty-state">
              <FolderOpen size={36} style={{ color: 'var(--text-dim)', marginBottom: 8 }} />
              <h4>Aucun modèle trouvé</h4>
              <p>
                {searchQuery
                  ? "Aucun événement ne correspond à votre recherche."
                  : "Enregistrez votre première configuration de scène en cliquant sur 'Enregistrer ce modèle'."}
              </p>
            </div>
          ) : (
            <div className="models-grid">
              {filteredModels.map((item) => {
                const isActive = activeModelId === item._id;
                const lengthM = (item.length * 1.22).toFixed(2);
                const widthM = (item.width * 1.22).toFixed(2);
                const heightCm = Math.round((item.heightM || 0.55) * 100);

                return (
                  <div
                    key={item._id}
                    className={`saved-model-card ${isActive ? 'active-model-card' : ''}`}
                  >
                    {/* Top Row: Event Name & Badges */}
                    <div className="model-card-header">
                      <div className="model-title-group">
                        <h4 className="model-event-title">{item.eventName}</h4>
                        {item.siteName && (
                          <div className="model-site-line">
                            <MapPin size={12} />
                            <span>{item.siteName}</span>
                          </div>
                        )}
                      </div>

                      <div className="model-badges-group">
                        {isActive && (
                          <span className="badge-active-loaded">Actif</span>
                        )}
                        <span className="model-dims-badge">
                          {lengthM} × {widthM} m
                        </span>
                      </div>
                    </div>

                    {/* Specs Row */}
                    <div className="model-specs-strip">
                      <div className="spec-pill">
                        <span className="spec-label">Modules :</span>
                        <strong className="spec-val">{item.length} × {item.width}</strong>
                      </div>
                      <div className="spec-pill">
                        <span className="spec-label">Hauteur :</span>
                        <strong className="spec-val">{heightCm} cm</strong>
                      </div>
                      <div className="spec-pill">
                        <span className="spec-label">Surface :</span>
                        <strong className="spec-val">{item.surfaceM2 || (item.length * item.width * 1.4884).toFixed(2)} m²</strong>
                      </div>
                      {item.counts && (
                        <div className="spec-pill">
                          <span className="spec-label">Plaques :</span>
                          <strong className="spec-val">{item.counts.stagePlaques || item.length * item.width}</strong>
                        </div>
                      )}
                    </div>

                    {/* Meta info footer */}
                    <div className="model-card-footer">
                      <div className="model-meta-info">
                        <span>Créé par <strong>{item.createdByName || 'Bright Stage'}</strong></span>
                        {item.createdAt && (
                          <>
                            <span className="meta-sep">•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                          </>
                        )}
                      </div>

                      <div className="model-card-actions">
                        {onExportPdfForModel && (
                          <button
                            type="button"
                            className="model-action-btn btn-icon-only"
                            title="Aperçu & PDF"
                            onClick={() => onExportPdfForModel(item)}
                          >
                            <Printer size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="model-action-btn btn-danger-icon"
                          title="Supprimer ce modèle"
                          disabled={deletingId === item._id}
                          onClick={(e) => handleDelete(e, item._id)}
                        >
                          <Trash2 size={15} />
                        </button>

                        <button
                          type="button"
                          className={`model-action-btn btn-load ${isActive ? 'btn-loaded' : ''}`}
                          onClick={() => {
                            onLoadModel(item);
                            onClose();
                          }}
                        >
                          <span>{isActive ? 'Actif' : 'Charger'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
