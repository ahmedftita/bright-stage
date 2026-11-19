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
  Scale,
  Wrench
} from 'lucide-react';
import { structureModelService } from '../services/structureModelService';

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
      const data = await structureModelService.getModels();
      setModels(data);
    } catch (err) {
      console.error("Erreur chargement modèles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle de structure ?")) return;

    setDeletingId(id);
    try {
      await structureModelService.deleteModel(id);
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
              <h3>Modèles de Structure Enregistrés</h3>
              <p>{models.length} configuration{models.length > 1 ? 's' : ''} truss enregistrée{models.length > 1 ? 's' : ''}</p>
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
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Models List */}
        <div className="saved-models-body">
          {loading ? (
            <div className="saved-models-loading">
              <div className="loading-spinner"></div>
              <span>Chargement des configurations...</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="saved-models-empty">
              <Layers size={36} className="empty-icon" />
              <h4>Aucun modèle trouvé</h4>
              <p>{searchQuery ? "Aucune configuration ne correspond à votre recherche." : "Vous n'avez pas encore enregistré de configuration pour un événement."}</p>
            </div>
          ) : (
            <div className="saved-models-grid">
              {filteredModels.map((model) => {
                const isActive = activeModelId === model._id;
                const isGoalpost = model.structureType === 'goalpost';

                return (
                  <div
                    key={model._id}
                    className={`saved-model-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      onLoadModel(model);
                      onClose();
                    }}
                  >
                    <div className="card-top-row">
                      <div className="event-info-block">
                        <div className="event-title-badge">
                          <span className="event-title">{model.eventName}</span>
                          {isActive && <span className="active-pill">Actif</span>}
                        </div>
                        {model.siteName && (
                          <div className="event-site">
                            <MapPin size={12} />
                            <span>{model.siteName}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-top-actions">
                        {onExportPdfForModel && (
                          <button
                            type="button"
                            className="card-icon-action"
                            title="Imprimer / Fiche technique"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportPdfForModel(model);
                            }}
                          >
                            <Printer size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="card-icon-action danger"
                          title="Supprimer ce modèle"
                          disabled={deletingId === model._id}
                          onClick={(e) => handleDelete(e, model._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Specs Pills */}
                    <div className="card-specs-row">
                      <div className="spec-chip highlight">
                        <Wrench size={12} />
                        <span>{isGoalpost ? 'Goalpost' : 'Box Grid'}</span>
                      </div>
                      <div className="spec-chip">
                        <span>{model.length}m × {model.width}m × {model.height}m</span>
                      </div>
                      <div className="spec-chip">
                        <span>{model.towerType} / {model.gridTypeL}</span>
                      </div>
                      <div className="spec-chip">
                        <Scale size={12} />
                        <span>Charge: {model.totalLoad} kg</span>
                      </div>
                    </div>

                    {/* BOM Summary Bar */}
                    <div className="card-bom-row">
                      <span>Poutres: <strong>{(model.totals?.s3 || 0) + (model.totals?.s2 || 0) + (model.totals?.s1 || 0)} pcs</strong></span>
                      <span>•</span>
                      <span>Moteurs: <strong>{model.totals?.motors || (isGoalpost ? 2 : 4)}</strong></span>
                      <span>•</span>
                      <span>Poids Alu: <strong>{model.aluWeight} kg</strong></span>
                    </div>

                    {model.notes && (
                      <p className="card-notes-snippet">« {model.notes} »</p>
                    )}

                    {/* Footer */}
                    <div className="card-bottom-footer">
                      <div className="card-author-meta">
                        <span>Par {model.createdByName || 'Jilani Wahi'}</span>
                        {model.createdAt && (
                          <span className="card-date">
                            • {new Date(model.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>

                      <div className="card-apply-action">
                        <span>Charger</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="action-btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
