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
  Zap,
  Monitor,
  Wrench,
  Sun
} from 'lucide-react';
import { conceptionService } from '../services/conceptionService';

export default function SavedConceptionsModal({
  isOpen,
  onClose,
  onLoadConception,
  onExportPdfForConception,
  activeConceptionId = null
}) {
  const [conceptions, setConceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadConceptions();
    }
  }, [isOpen]);

  const loadConceptions = async () => {
    setLoading(true);
    try {
      const data = await conceptionService.getConceptions();
      setConceptions(data);
    } catch (err) {
      console.error("Erreur chargement conceptions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette conception de scène ?")) return;

    setDeletingId(id);
    try {
      await conceptionService.deleteConception(id);
      setConceptions(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredConceptions = conceptions.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.eventName && c.eventName.toLowerCase().includes(q)) ||
      (c.siteName && c.siteName.toLowerCase().includes(q)) ||
      (c.createdByName && c.createdByName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-box saved-models-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(236, 72, 153, 0.18)', color: '#ec4899' }}>
              <FolderOpen size={20} />
            </div>
            <div>
              <h3>Conceptions Scéniques Enregistrées</h3>
              <p>{conceptions.length} conception{conceptions.length > 1 ? 's' : ''} complète{conceptions.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
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

        {/* List */}
        <div className="saved-models-body">
          {loading ? (
            <div className="saved-models-loading">
              <div className="loading-spinner"></div>
              <span>Chargement des conceptions...</span>
            </div>
          ) : filteredConceptions.length === 0 ? (
            <div className="saved-models-empty">
              <Sparkles size={36} className="empty-icon" />
              <h4>Aucune conception trouvée</h4>
              <p>{searchQuery ? "Aucune conception ne correspond à votre recherche." : "Vous n'avez pas encore enregistré de conception scénique complète."}</p>
            </div>
          ) : (
            <div className="saved-models-grid">
              {filteredConceptions.map((item) => {
                const isActive = activeConceptionId === item._id;
                const stageConf = item.stageConfig || {};
                const structConf = item.structureConfig || {};
                const screenConf = item.screenConfig || {};
                const lightConf = item.lightingConfig || {};
                const totalLightCount = (lightConf.beamsCount || 0) + (lightConf.spotsCount || 0) + (lightConf.washesCount || 0) + (lightConf.ledBarsCount || 0) + (lightConf.blindersCount || 0);

                return (
                  <div
                    key={item._id}
                    className={`saved-model-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      onLoadConception(item);
                      onClose();
                    }}
                  >
                    <div className="card-top-row">
                      <div className="event-info-block">
                        <div className="event-title-badge">
                          <span className="event-title">{item.eventName}</span>
                          {isActive && <span className="active-pill">Actif</span>}
                        </div>
                        {item.siteName && (
                          <div className="event-site">
                            <MapPin size={12} />
                            <span>{item.siteName}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-top-actions">
                        {onExportPdfForConception && (
                          <button
                            type="button"
                            className="card-icon-action"
                            title="Imprimer Fiche Technique Complète"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportPdfForConception(item);
                            }}
                          >
                            <Printer size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="card-icon-action danger"
                          title="Supprimer cette conception"
                          disabled={deletingId === item._id}
                          onClick={(e) => handleDelete(e, item._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* 4 Pillars Chips */}
                    <div className="card-specs-row">
                      <div className="spec-chip highlight">
                        <Layers size={12} />
                        <span>Scène {stageConf.lengthM || 7.32}×{stageConf.widthM || 4.88}m</span>
                      </div>
                      <div className="spec-chip">
                        <Wrench size={12} />
                        <span>Truss {structConf.length || 10}×{structConf.width || 8}m</span>
                      </div>
                      <div className="spec-chip">
                        <Monitor size={12} />
                        <span>LED {screenConf.screenWidthM || 6}×{screenConf.screenHeightM || 3}m ({screenConf.pitch || 'P3.9'})</span>
                      </div>
                      <div className="spec-chip">
                        <Sun size={12} />
                        <span>{totalLightCount} Projecteurs</span>
                      </div>
                      <div className="spec-chip">
                        <Zap size={12} />
                        <span>{item.totalPower?.totalKw || 23.4} kW</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="card-notes-snippet">« {item.notes} »</p>
                    )}

                    <div className="card-bottom-footer">
                      <div className="card-author-meta">
                        <span>Par {item.createdByName || 'Jilani Wahi'}</span>
                        {item.createdAt && (
                          <span className="card-date">
                            • {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>

                      <div className="card-apply-action">
                        <span>Charger le Studio</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
