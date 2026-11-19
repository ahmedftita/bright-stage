import React from 'react';
import { X, Printer, Download, ShieldCheck, AlertTriangle, Layers, Wrench, CheckCircle } from 'lucide-react';

export default function StructureExportModal({
  isOpen,
  onClose,
  calculation,
  eventName = 'Événement Bright Stage',
  siteName = '',
  capture3DUrl = null,
  capturePlanUrl = null
}) {
  if (!isOpen || !calculation) return null;

  const {
    config,
    totals,
    towSpec,
    gridSpecL,
    gridSpecW,
    lenSpans,
    widSpans,
    numTowers,
    aluWeight,
    totalLoad,
    pointLoad,
    pointLoadLimit,
    loadPercentage,
    isOverload,
    equipmentBOM
  } = calculation;

  const isGoalpost = config.structureType === 'goalpost';
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="modal-dialog-box export-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '980px', width: '96vw', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal Top Bar (Hidden on print) */}
        <div className="modal-header no-print">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8' }}>
              <Printer size={20} />
            </div>
            <div>
              <h3>Fiche Technique Structure Truss</h3>
              <p>Aperçu avant impression ou export PDF technique</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="action-btn btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="printable-structure-doc" id="printable-doc">
          {/* Header */}
          <div className="print-header">
            <div className="print-brand-block">
              <div className="print-logo-badge">BS</div>
              <div>
                <h1 className="print-company-name">BRIGHT STAGE PRO</h1>
                <p className="print-company-sub">INGÉNIERIE SCÉNIQUE & STRUCTURES ALUMINIUM</p>
              </div>
            </div>
            <div className="print-meta-block">
              <div className="print-meta-title">FICHE TECHNIQUE STRUCTURE TRUSS</div>
              <div className="print-meta-sub">Date d'édition : {currentDate}</div>
              <div className="print-meta-sub">Réf : BS-STR-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Event Info Strip */}
          <div className="print-event-strip">
            <div className="strip-item">
              <span className="strip-label">ÉVÉNEMENT</span>
              <span className="strip-value">{eventName || 'Configuration Sans Titre'}</span>
            </div>
            {siteName && (
              <div className="strip-item">
                <span className="strip-label">LIEU / SITE</span>
                <span className="strip-value">{siteName}</span>
              </div>
            )}
            <div className="strip-item">
              <span className="strip-label">TYPE DE STRUCTURE</span>
              <span className="strip-value">{isGoalpost ? 'ARCHE GOALPOST' : 'GRIL BOX GRID'}</span>
            </div>
            <div className="strip-item">
              <span className="strip-label">DIMENSIONS (L × l × H)</span>
              <span className="strip-value">{config.length}m × {config.width}m × {config.height}m</span>
            </div>
          </div>

          {/* 2 Plans: Vue en Haut (2D) & Vue de Face / Élévation */}
          <div className="print-plans-grid">
            {/* Plan 1: Vue du Haut */}
            <div className="print-plan-box">
              <div className="plan-box-header">
                <div className="plan-box-title">
                  <span className="plan-num">1</span>
                  <span>VUE DU HAUT (Plan d'implantation 2D)</span>
                </div>
                <span className="plan-badge">{config.length}m × {config.width}m</span>
              </div>

              <div className="plan-diagram-content">
                {capturePlanUrl ? (
                  <img src={capturePlanUrl} alt="Vue en plan 2D" className="plan-capture-img" />
                ) : (
                  <div className="truss-2d-svg-container">
                    <svg
                      viewBox="-20 -20 280 200"
                      className="truss-schematic-svg"
                      style={{ width: '100%', maxHeight: '190px' }}
                    >
                      {/* Grid Outlines */}
                      <rect
                        x="20"
                        y="20"
                        width="200"
                        height={isGoalpost ? "20" : "140"}
                        fill="rgba(56, 189, 248, 0.08)"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeDasharray={isGoalpost ? "none" : "none"}
                        rx="4"
                      />
                      {/* Intermediate beams if multi-span */}
                      {!isGoalpost && lenSpans.length > 1 && (
                        <line x1="120" y1="20" x2="120" y2="160" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                      )}
                      {!isGoalpost && widSpans.length > 1 && (
                        <line x1="20" y1="90" x2="220" y2="90" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                      )}
                      {/* Towers / Corners */}
                      {isGoalpost ? (
                        <>
                          <circle cx="20" cy="30" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="220" cy="30" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                          {/* Outriggers */}
                          <line x1="20" y1="5" x2="20" y2="55" stroke="#ef4444" strokeWidth="4" />
                          <line x1="220" y1="5" x2="220" y2="55" stroke="#ef4444" strokeWidth="4" />
                        </>
                      ) : (
                        <>
                          <circle cx="20" cy="20" r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="220" cy="20" r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="20" cy="160" r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="220" cy="160" r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                          {lenSpans.length > 1 && (
                            <>
                              <circle cx="120" cy="20" r="5" fill="#6366f1" />
                              <circle cx="120" cy="160" r="5" fill="#6366f1" />
                            </>
                          )}
                          {widSpans.length > 1 && (
                            <>
                              <circle cx="20" cy="90" r="5" fill="#6366f1" />
                              <circle cx="220" cy="90" r="5" fill="#6366f1" />
                            </>
                          )}
                        </>
                      )}
                      {/* Dimension labels */}
                      <text x="120" y="12" fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle">
                        Longueur : {config.length} m
                      </text>
                      {!isGoalpost && (
                        <text x="10" y="95" fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 10 95)">
                          Largeur : {config.width} m
                        </text>
                      )}
                    </svg>
                  </div>
                )}
                <div className="plan-caption">
                  {isGoalpost
                    ? `Arche 2 tours espacées de ${config.length}m • Outriggers stabilisateurs au sol`
                    : `Gril 4+ tours • Poutres principales ${gridSpecL.name} • Portée max ${Math.max(...lenSpans)}m`}
                </div>
              </div>
            </div>

            {/* Plan 2: Vue de Face / Élévation */}
            <div className="print-plan-box">
              <div className="plan-box-header">
                <div className="plan-box-title">
                  <span className="plan-num">2</span>
                  <span>VUE DE FACE (Élévation & Hauteur de Levage)</span>
                </div>
                <span className="plan-badge">Hauteur : {config.height}m</span>
              </div>

              <div className="plan-diagram-content">
                {capture3DUrl ? (
                  <img src={capture3DUrl} alt="Vue 3D de face" className="plan-capture-img" />
                ) : (
                  <div className="truss-2d-svg-container">
                    <svg
                      viewBox="-20 -20 280 200"
                      className="truss-schematic-svg"
                      style={{ width: '100%', maxHeight: '190px' }}
                    >
                      {/* Ground line */}
                      <line x1="0" y1="170" x2="260" y2="170" stroke="#0f172a" strokeWidth="3" />
                      <text x="130" y="185" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">
                        NIVEAU DU SOL (0,00 m) • EMBASES LOURDES
                      </text>

                      {/* Towers */}
                      <rect x="30" y="30" width="12" height="140" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" />
                      <rect x="218" y="30" width="12" height="140" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" />

                      {/* Base plates */}
                      <rect x="22" y="165" width="28" height="5" fill="#0f172a" rx="1" />
                      <rect x="210" y="165" width="28" height="5" fill="#0f172a" rx="1" />

                      {/* Top Pulley head */}
                      <rect x="28" y="24" width="16" height="8" fill="#ef4444" />
                      <rect x="216" y="24" width="16" height="8" fill="#ef4444" />

                      {/* Main Horizontal Beam at height */}
                      <rect x="42" y="38" width="176" height="12" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" rx="2" />

                      {/* Suspended Load (Screen / Fixtures) */}
                      <rect x="75" y="55" width="110" height="70" fill="rgba(30, 27, 75, 0.85)" stroke="#6366f1" strokeWidth="1.5" rx="3" />
                      <text x="130" y="95" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                        ÉCRAN LED / CHARGE ({config.ledWeight} kg)
                      </text>

                      {/* Height marker */}
                      <line x1="245" y1="38" x2="245" y2="170" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="252" y="105" fill="#b45309" fontSize="9" fontWeight="bold">
                        H={config.height}m
                      </text>
                    </svg>
                  </div>
                )}
                <div className="plan-caption">
                  Tours de levage {towSpec.name} • Hauteur utile {config.height}m • Moteurs 1T synchronisés
                </div>
              </div>
            </div>
          </div>

          {/* Table: Équipements Requis (BOM) */}
          <div className="print-section-title">ÉQUIPEMENTS REQUIS</div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>DÉSIGNATION DE L'ÉQUIPEMENT</th>
                <th style={{ width: '43%' }}>SPÉCIFICATION TECHNIQUE OFFICIELLE</th>
                <th style={{ width: '15%', textAlign: 'right' }}>QUANTITÉ</th>
              </tr>
            </thead>
            <tbody>
              {equipmentBOM.map((item) => (
                <tr key={item.id}>
                  <td className="equipment-name-td">
                    <strong>{item.name}</strong>
                    <span className="td-category">{item.category}</span>
                  </td>
                  <td className="equipment-spec-td">{item.spec}</td>
                  <td className="equipment-qty-td">
                    <span className="qty-number">{item.quantity}</span>
                    <span className="qty-unit">pcs</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Charge Totale & Capacité */}
          <div className="print-section-title" style={{ marginTop: '16px' }}>
            CHARGE TOTALE & CAPACITÉ ADMISSIBLE
          </div>
          <div className="print-kpi-grid">
            <div className="print-kpi-box">
              <span className="kpi-label">POIDS PROPRE STRUCTURE</span>
              <span className="kpi-val">{aluWeight} kg</span>
              <span className="kpi-sub">Aluminium 6082-T6</span>
            </div>
            <div className="print-kpi-box">
              <span className="kpi-label">CHARGE SUSPENDUE (LED / AUDIO)</span>
              <span className="kpi-val">{config.ledWeight} kg</span>
              <span className="kpi-sub">Écran LED & Éclairage</span>
            </div>
            <div className="print-kpi-box">
              <span className="kpi-label">CHARGE TOTALE COMBINÉE</span>
              <span className="kpi-val highlight">{totalLoad} kg</span>
              <span className="kpi-sub">Poids total sur moteurs</span>
            </div>
            <div className="print-kpi-box">
              <span className="kpi-label">CHARGE PONCTUELLE / TOUR</span>
              <span className={`kpi-val ${isOverload ? 'critical' : 'success'}`}>
                {pointLoad} kg
              </span>
              <span className="kpi-sub">Limite max : {pointLoadLimit} kg ({loadPercentage}%)</span>
            </div>
          </div>

          {/* Safety Statement Stamp */}
          <div className={`print-safety-stamp ${isOverload ? 'is-warning' : 'is-conform'}`}>
            <div className="stamp-icon">
              {isOverload ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
            </div>
            <div>
              <div className="stamp-title">
                {isOverload
                  ? 'ATTENTION : SURCHARGE OU LIMITE DE PORTÉE DÉPASSÉE'
                  : 'CONFORME AUX NORMES DE SÉCURITÉ SCÉNIQUE BGV-C1 / EUROCODE 9'}
              </div>
              <div className="stamp-desc">
                {isOverload
                  ? 'La charge ponctuelle ou la portée dépasse les abaques constructeur. Réduisez le poids ou ajoutez des tours de renfort.'
                  : `Structure vérifiée sous coefficient de sécurité. Capacité résiduelle : ${(100 - loadPercentage).toFixed(1)}%. Matériel certifié TUV.`}
              </div>
            </div>
          </div>

          {/* Signature / Validation Footer */}
          <div className="print-signatures-row">
            <div className="sig-box">
              <span className="sig-label">RESPONSABLE TECHNIQUE BRIGHT STAGE</span>
              <div className="sig-line">Jilani Wahi — Ingénieur Scénique</div>
            </div>
            <div className="sig-box">
              <span className="sig-label">VISA DU CHARGÉ DE SÉCURITÉ / CLIENT</span>
              <div className="sig-line">Signature & Date : ____________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
