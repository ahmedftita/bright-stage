import React from 'react';
import { X, Printer, ShieldCheck, AlertTriangle, Layers, Wrench, Monitor, Zap, Sun, CheckCircle } from 'lucide-react';
import { getFixtureTypeForPosition, SIDE_FIXTURE_SPECS } from '../utils/conceptionLogic';

const getPrintCss = () => `
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5px;
    line-height: 1.3;
  }
  .printable-structure-doc {
    width: 100%;
    background: #ffffff;
    color: #0f172a;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .no-print {
    display: none !important;
  }

  .print-page-break {
    page-break-before: always !important;
    break-before: page !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }

  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .print-brand-block {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .print-logo-badge {
    width: 38px;
    height: 38px;
    background: #0f172a;
    color: #ffffff;
    font-weight: 900;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }
  .print-company-name {
    margin: 0;
    font-size: 17px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0f172a;
  }
  .print-company-sub {
    margin: 2px 0 0 0;
    font-size: 8.5px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.5px;
  }
  .print-meta-block {
    text-align: right;
  }
  .print-meta-title {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
  }
  .print-meta-sub {
    font-size: 9px;
    color: #64748b;
  }

  .print-event-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 6px;
    background: #f1f5f9;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .strip-item {
    display: flex;
    flex-direction: column;
  }
  .strip-label {
    font-size: 8px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.5px;
  }
  .strip-value {
    font-size: 10px;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .print-plans-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .print-plan-box {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #ffffff;
  }
  .plan-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
  }
  .plan-box-title {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 800;
    color: #0f172a;
  }
  .plan-num {
    width: 15px;
    height: 15px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 50%;
    font-size: 8.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  .plan-badge {
    font-size: 9px;
    font-weight: 700;
    background: #e2e8f0;
    padding: 1px 5px;
    border-radius: 4px;
  }
  .plan-diagram-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 125px;
    max-height: 125px;
    overflow: hidden;
  }
  .plan-capture-img {
    max-width: 100% !important;
    max-height: 115px !important;
    height: auto !important;
    object-fit: contain !important;
    display: block !important;
    margin: 0 auto !important;
  }
  .truss-2d-svg-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .truss-2d-svg-container svg {
    width: 100% !important;
    max-height: 115px !important;
    display: block !important;
    margin: 0 auto !important;
  }
  .plan-caption {
    font-size: 8px;
    color: #64748b;
    text-align: center;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .print-section-title {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #0f172a;
    border-bottom: 1.5px solid #0f172a;
    padding-bottom: 2px;
    margin-top: 2px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .print-kpi-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 6px !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .print-kpi-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
  }
  .kpi-label {
    font-size: 7.5px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.4px;
  }
  .kpi-val {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    margin: 1px 0;
  }
  .kpi-val.highlight { color: #be185d; }
  .kpi-val.success { color: #059669; }
  .kpi-val.critical { color: #dc2626; }
  .kpi-sub {
    font-size: 7.5px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .print-page-2-header {
    margin-top: 2px;
    margin-bottom: 4px;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .print-table th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 800;
    padding: 4px 6px;
    border-bottom: 1.5px solid #cbd5e1;
    text-align: left;
    font-size: 8.5px;
  }
  .print-table td {
    padding: 3.5px 6px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }
  .equipment-name-td strong {
    display: block;
    color: #0f172a;
    font-size: 9px;
  }
  .td-category {
    font-size: 7.5px;
    color: #64748b;
  }
  .equipment-spec-td {
    font-size: 8.5px;
    color: #475569;
  }
  .equipment-qty-td {
    text-align: right;
  }
  .qty-number {
    font-size: 10.5px;
    font-weight: 800;
    color: #0f172a;
  }
  .qty-unit {
    font-size: 8px;
    color: #64748b;
    margin-left: 2px;
  }

  .print-safety-stamp {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 5px;
    border: 1px solid #10b981;
    background: #ecfdf5;
    color: #065f46;
    margin-top: 6px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .stamp-title {
    font-size: 9px;
    font-weight: 800;
  }
  .stamp-desc {
    font-size: 8px;
    margin-top: 1px;
  }

  .print-signatures-row {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 20px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #e2e8f0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sig-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sig-label {
    font-size: 8px;
    font-weight: 800;
    color: #64748b;
  }
  .sig-line {
    font-size: 9px;
    color: #334155;
    font-weight: 600;
  }

  .page-footer-strip {
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 3px;
    margin-top: 4px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

export default function FullStageExportModal({
  isOpen,
  onClose,
  conception,
  eventName = 'Événement Bright Stage',
  siteName = '',
  capture3DUrl = null,
  capturePlanUrl = null
}) {
  if (!isOpen || !conception) return null;

  const {
    stage,
    structure,
    screen,
    lighting,
    totalRigging,
    totalPower,
    equipmentBOM
  } = conception;

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handlePrint = () => {
    const printDoc = document.getElementById('printable-full-doc');
    if (!printDoc) {
      window.print();
      return;
    }

    // Supprimer tout iframe d'impression antérieur
    const oldIframe = document.getElementById('print-isolated-iframe');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-isolated-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Dossier Technique Scénique - ${eventName || 'Bright Stage Pro'}</title>
  <style>${getPrintCss()}</style>
</head>
<body>
  <div class="printable-structure-doc">
    ${printDoc.innerHTML}
  </div>
</body>
</html>`);
    doc.close();

    // Attente du chargement complet des images et rendu
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print fallback to window.print:', err);
        window.print();
      }
      setTimeout(() => {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 2000);
    }, 300);
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="modal-dialog-box export-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1020px', width: '96vw', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Top bar (hidden on print) */}
        <div className="modal-header no-print">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(236, 72, 153, 0.18)', color: '#ec4899' }}>
              <Printer size={20} />
            </div>
            <div>
              <h3>Fiche Technique de Conception Scénique Complète</h3>
              <p>Document unifié : Scène, Écran LED, Éclairage, Structure & Bilans Techniques (2 Pages A4)</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="action-btn btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT (2 PAGES STRICTES) */}
        <div className="printable-structure-doc" id="printable-full-doc">

          {/* =========================================================================
              PAGE 1 : DOSSIER TECHNIQUE, PLANS 2D/3D & BILANS SYNTHÉTIQUES
             ========================================================================= */}
          <div className="print-page-1">
            {/* Header */}
            <div className="print-header">
              <div className="print-brand-block">
                <div className="print-logo-badge">BS</div>
                <div>
                  <h1 className="print-company-name">BRIGHT STAGE PRO</h1>
                  <p className="print-company-sub">INGÉNIERIE SCÉNIQUE • STRUCTURE • VIDÉO LED • ÉCLAIRAGE</p>
                </div>
              </div>
              <div className="print-meta-block">
                <div className="print-meta-title">DOSSIER TECHNIQUE SCÉNIQUE GLOBAL</div>
                <div className="print-meta-sub">Date d'édition : {currentDate}</div>
                <div className="print-meta-sub">Réf : BS-FULL-{Date.now().toString().slice(-6)} • Page 1 / 2</div>
              </div>
            </div>

            {/* Event Banner */}
            <div className="print-event-strip" style={{ marginTop: '8px' }}>
              <div className="strip-item">
                <span className="strip-label">ÉVÉNEMENT</span>
                <span className="strip-value">{eventName}</span>
              </div>
              {siteName && (
                <div className="strip-item">
                  <span className="strip-label">LIEU / SITE</span>
                  <span className="strip-value">{siteName}</span>
                </div>
              )}
              {stage.enabled !== false ? (
                <div className="strip-item">
                  <span className="strip-label">SCÈNE (PODIUM)</span>
                  <span className="strip-value">{stage.dimensions.lengthM}m × {stage.dimensions.widthM}m (H={Math.round(stage.dimensions.heightM * 100)}cm)</span>
                </div>
              ) : (
                <div className="strip-item">
                  <span className="strip-label">SCÈNE (PODIUM)</span>
                  <span className="strip-value" style={{ color: '#94a3b8' }}>Désactivé (Sans Scène)</span>
                </div>
              )}
              {structure.enabled !== false ? (
                <div className="strip-item">
                  <span className="strip-label">STRUCTURE TRUSS</span>
                  <span className="strip-value">{structure.dimensions.length}m × {structure.dimensions.width}m (H={structure.dimensions.height}m)</span>
                </div>
              ) : (
                <div className="strip-item">
                  <span className="strip-label">STRUCTURE TRUSS</span>
                  <span className="strip-value" style={{ color: '#94a3b8' }}>Désactivé (Sans Structure)</span>
                </div>
              )}
              {screen.enabled !== false ? (
                <div className="strip-item">
                  <span className="strip-label">ÉCRAN LED</span>
                  <span className="strip-value">{screen.dimensions.widthM}m × {screen.dimensions.heightM}m ({screen.pitch})</span>
                </div>
              ) : (
                <div className="strip-item">
                  <span className="strip-label">ÉCRAN LED</span>
                  <span className="strip-value" style={{ color: '#94a3b8' }}>Désactivé (Sans Écran)</span>
                </div>
              )}
              {structure.enabled !== false && structure.totems?.count > 0 && (
                <div className="strip-item">
                  <span className="strip-label">TOTEMS SCÉNIQUES</span>
                  <span className="strip-value" style={{ color: '#0284c7' }}>{structure.totems.count}x Totems H={structure.totems.heightM}m + Beam 280W</span>
                </div>
              )}
              {screen.enabled !== false && lighting.enabled !== false && lighting.sideMatricesCount > 0 && (
                <div className="strip-item">
                  <span className="strip-label">PROJECTEURS FLANCS</span>
                  <span className="strip-value" style={{ color: lighting.sideFixtureSpec?.color || '#fbbf24' }}>
                    {lighting.sideFixtureMode !== 'single'
                      ? `${lighting.totalSideMatrices}x Mix Scénographique (${lighting.sideFixtureMode === 'mix_all_6' ? '6 Modèles' : lighting.sideFixtureMode === 'mix_all_5' ? '5 Modèles' : lighting.sideFixtureMode === 'mix_all_4' ? '4 Modèles' : 'Duo Alterné'})`
                      : `${lighting.totalSideMatrices}x ${lighting.sideFixtureSpec?.name || 'Projecteurs'} (${lighting.sideMatricesOrientation === 'vertical' ? 'Vert.' : 'Horiz.'})`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* 2 PLANS TECHNIQUES (Vue du Haut & Vue de Face) */}
            <div className="print-plans-grid" style={{ marginTop: '8px' }}>
              {/* Plan 1: Vue du Haut */}
              <div className="print-plan-box">
                <div className="plan-box-header">
                  <div className="plan-box-title">
                    <span className="plan-num">1</span>
                    <span>VUE DU HAUT (Plan d'implantation 2D Global)</span>
                  </div>
                  <span className="plan-badge">Truss {structure.dimensions.length}×{structure.dimensions.width}m</span>
                </div>

                <div className="plan-diagram-content">
                  {capturePlanUrl ? (
                    <img
                      src={capturePlanUrl}
                      alt="Vue 2D"
                      className="plan-capture-img"
                      style={{ maxWidth: '100%', maxHeight: '115px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <div className="truss-2d-svg-container">
                      <svg viewBox="-20 -20 300 210" style={{ width: '100%', maxHeight: '115px' }}>
                        {/* Structure Outline & Towers */}
                        {structure.enabled !== false && (
                          <>
                            <rect x="20" y="20" width="220" height="150" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="3 3" rx="4" />
                            <circle cx="20" cy="20" r="7" fill="#0284c7" />
                            <circle cx="240" cy="20" r="7" fill="#0284c7" />
                            <circle cx="20" cy="170" r="7" fill="#0284c7" />
                            <circle cx="240" cy="170" r="7" fill="#0284c7" />
                          </>
                        )}

                        {/* Stage Deck */}
                        {stage.enabled !== false && (
                          <>
                            <rect x="45" y="55" width="170" height="100" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2" rx="3" />
                            <text x="130" y="110" fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle">
                              PLATEAU SCÈNE ({stage.dimensions.lengthM}m × {stage.dimensions.widthM}m)
                            </text>
                          </>
                        )}

                        {/* LED Screen at back of stage */}
                        {screen.enabled !== false && (
                          <>
                            <rect x="75" y="48" width="110" height="10" fill="#2563eb" stroke="#1e40af" strokeWidth="1.5" rx="2" />
                            <text x="130" y="42" fill="#2563eb" fontSize="8" fontWeight="bold" textAnchor="middle">
                              ÉCRAN LED {screen.dimensions.widthM}m × {screen.dimensions.heightM}m
                            </text>
                          </>
                        )}

                        {/* Totems derrière l'écran */}
                        {structure.enabled !== false && structure.totems?.count > 0 && (
                          <>
                            <rect x="85" y="32" width="10" height="10" fill="#0284c7" stroke="#0f172a" strokeWidth="1" />
                            <rect x="125" y="32" width="10" height="10" fill="#0284c7" stroke="#0f172a" strokeWidth="1" />
                            <rect x="165" y="32" width="10" height="10" fill="#0284c7" stroke="#0f172a" strokeWidth="1" />
                            <text x="130" y="28" fill="#0284c7" fontSize="7" fontWeight="bold" textAnchor="middle">
                              3× TOTEMS (BEAM 280W)
                            </text>
                          </>
                        )}

                        {/* Projecteurs Flancs flanquant l'écran */}
                        {screen.enabled !== false && lighting.enabled !== false && lighting.sideMatricesCount > 0 && (() => {
                          const fColor = lighting.sideFixtureSpec?.color || '#fbbf24';
                          const count = lighting.sideMatricesCount;
                          return (
                            <>
                              <rect x="58" y="46" width="10" height="14" fill={fColor} stroke="#0f172a" strokeWidth="0.8" rx="2" />
                              <rect x="192" y="46" width="10" height="14" fill={fColor} stroke="#0f172a" strokeWidth="0.8" rx="2" />
                              <text x="48" y="55" fill={fColor} fontSize="5.5" fontWeight="bold" textAnchor="end">{count}× FLANCS</text>
                              <text x="204" y="55" fill={fColor} fontSize="5.5" fontWeight="bold" textAnchor="start">{count}× FLANCS</text>
                            </>
                          );
                        })()}

                        {/* Stairs on right */}
                        {stage.enabled !== false && stage.hasStairs && (
                          <rect x="216" y="85" width="20" height="40" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" rx="1" />
                        )}

                        {/* Lighting Dots on Front and Back Truss */}
                        {structure.enabled !== false && lighting.enabled !== false && (
                          <>
                            <circle cx="70" cy="20" r="4" fill="#38bdf8" />
                            <circle cx="100" cy="20" r="4" fill="#38bdf8" />
                            <circle cx="130" cy="20" r="4" fill="#38bdf8" />
                            <circle cx="160" cy="20" r="4" fill="#38bdf8" />
                            <circle cx="190" cy="20" r="4" fill="#38bdf8" />

                            <circle cx="70" cy="170" r="4" fill="#fbbf24" />
                            <circle cx="110" cy="170" r="4" fill="#fbbf24" />
                            <circle cx="150" cy="170" r="4" fill="#fbbf24" />
                            <circle cx="190" cy="170" r="4" fill="#fbbf24" />
                          </>
                        )}

                        <text x="130" y="12" fill="#64748b" fontSize="8" textAnchor="middle">▲ FOND DE SCÈNE (PONT ARRIÈRE)</text>
                        <text x="130" y="195" fill="#64748b" fontSize="8" textAnchor="middle">▼ FACE PUBLIC (PONT AVANT)</text>
                      </svg>
                    </div>
                  )}
                  <div className="plan-caption">
                    Implantation scénique : {stage.enabled !== false ? `Scène ${stage.dimensions.lengthM}×${stage.dimensions.widthM}m • ` : ''}{structure.enabled !== false ? `Structure ${structure.dimensions.length}×${structure.dimensions.width}m • ` : ''}{screen.enabled !== false ? `Écran LED • ` : ''}{lighting.enabled !== false ? `Lumières` : ''}
                  </div>
                </div>
              </div>

              {/* Plan 2: Vue de Face / Élévation */}
              <div className="print-plan-box">
                <div className="plan-box-header">
                  <div className="plan-box-title">
                    <span className="plan-num">2</span>
                    <span>VUE DE FACE & ÉLÉVATION (Hauteurs & Coupes)</span>
                  </div>
                  <span className="plan-badge">H={structure.dimensions.height}m</span>
                </div>

                <div className="plan-diagram-content">
                  {capture3DUrl ? (
                    <img
                      src={capture3DUrl}
                      alt="Vue 3D Face"
                      className="plan-capture-img"
                      style={{ maxWidth: '100%', maxHeight: '115px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <div className="truss-2d-svg-container">
                      <svg viewBox="-20 -20 300 210" style={{ width: '100%', maxHeight: '115px' }}>
                        {/* Ground line */}
                        <line x1="0" y1="175" x2="260" y2="175" stroke="#0f172a" strokeWidth="2.5" />
                        <text x="130" y="190" fill="#64748b" fontSize="8" textAnchor="middle">NIVEAU DU SOL (0,00 m)</text>

                        {/* Towers and Top Truss (seulement si Gril actif) */}
                        {structure.enabled !== false && structure.structureType !== 'none' && (
                          <>
                            <rect x="25" y="25" width="10" height="150" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />
                            <rect x="225" y="25" width="10" height="150" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />
                            <rect x="18" y="170" width="24" height="5" fill="#0f172a" />
                            <rect x="218" y="170" width="24" height="5" fill="#0f172a" />
                            <rect x="35" y="32" width="190" height="10" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" rx="1" />
                          </>
                        )}

                        {/* Stage deck & Skirting */}
                        {stage.enabled !== false && (
                          <>
                            <rect x="45" y="145" width="170" height="8" fill="#1e2230" stroke="#0f172a" strokeWidth="1" rx="1" />
                            <rect x="45" y="153" width="170" height="22" fill="#090d16" />
                            <text x="130" y="167" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                              SCÈNE H={Math.round(stage.dimensions.heightM * 100)}cm
                            </text>
                          </>
                        )}

                        {/* Totems verticaux de fond de scène */}
                        {structure.enabled !== false && structure.totems?.count > 0 && (
                          <>
                            <rect x="88" y="45" width="8" height="100" fill="#64748b" stroke="#334155" strokeWidth="0.5" />
                            <circle cx="92" cy="42" r="5" fill="#0284c7" />
                            <polygon points="92,40 85,0 99,0" fill="rgba(2, 132, 199, 0.25)" />

                            <rect x="126" y="45" width="8" height="100" fill="#64748b" stroke="#334155" strokeWidth="0.5" />
                            <circle cx="130" cy="42" r="5" fill="#0284c7" />
                            <polygon points="130,40 123,0 137,0" fill="rgba(2, 132, 199, 0.25)" />

                            <rect x="164" y="45" width="8" height="100" fill="#64748b" stroke="#334155" strokeWidth="0.5" />
                            <circle cx="168" cy="42" r="5" fill="#0284c7" />
                            <polygon points="168,40 161,0 175,0" fill="rgba(2, 132, 199, 0.25)" />
                          </>
                        )}

                        {/* LED Screen (Débute directement depuis la scène) */}
                        {screen.enabled !== false && (() => {
                          const sy = stage.enabled !== false ? (145 - 55) : 100;
                          return (
                            <g>
                              {/* Screen cabinet frame */}
                              <rect x="75" y={sy} width="110" height="55" fill="#0b0f19" stroke="#6366f1" strokeWidth="1.2" rx="2" />
                              {/* Glowing screen display */}
                              <rect x="77" y={sy + 2} width="106" height="51" fill="#1e1b4b" opacity="0.85" rx="1" />
                              
                              {/* Bright Stage Crest Badge */}
                              <rect x="123" y={sy + 6} width="14" height="14" rx="3" fill="#ec4899" />
                              <text x="130" y={sy + 16} fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">BS</text>
                              
                              {/* BRIGHT STAGE Title */}
                              <text x="130" y={sy + 27} fill="#38bdf8" fontSize="7.5" fontWeight="900" letterSpacing="0.8" textAnchor="middle">
                                BRIGHT STAGE
                              </text>
                              
                              {/* Accent separator */}
                              <line x1="102" y1={sy + 31} x2="158" y2={sy + 31} stroke="#f59e0b" strokeWidth="0.8" />

                              {/* User Subtitle: Réalisé avec Ahmed Ftita */}
                              <text x="130" y={sy + 39} fill="#fef08a" fontSize="6.5" fontStyle="italic" fontWeight="bold" textAnchor="middle">
                                Réalisé avec Ahmed Ftita
                              </text>

                              {/* Dimension tag */}
                              <text x="130" y={sy + 48} fill="#94a3b8" fontSize="5" textAnchor="middle">
                                Mur LED {screen.dimensions.widthM}m × {screen.dimensions.heightM}m
                              </text>
                            </g>
                          );
                        })()}

                        {/* Projecteurs Flancs (Blinder COB 2 Yeux, Retro Bowl, Halogène Rond, PAR LED ou Strobe) */}
                        {screen.enabled !== false && lighting.enabled !== false && lighting.sideMatricesCount > 0 && (() => {
                          const sy = stage.enabled !== false ? (145 - 55) : 100;
                          const isFloor = lighting.sideMatricesPosition === 'horizontal_floor';
                          const isVert = lighting.sideMatricesOrientation === 'vertical';
                          const count = lighting.sideMatricesCount;

                          // Helper function to render fixture SVG symbol according to its specific model
                          const renderFixtureSymbol = (key, px, py, specificType) => {
                            const fType = specificType || lighting.sideFixtureType || 'cob_blinder_2eye';
                            if (fType === 'cob_blinder_2eye') {
                              const w = isVert ? 5 : 8;
                              const h = isVert ? 8 : 4;
                              return (
                                <g key={key}>
                                  <rect x={px} y={py} width={w} height={h} fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.5" rx="1" />
                                  {isVert ? (
                                    <>
                                      <circle cx={px + 2.5} cy={py + 2} r="1.3" fill="#fef08a" />
                                      <circle cx={px + 2.5} cy={py + 6} r="1.3" fill="#fef08a" />
                                    </>
                                  ) : (
                                    <>
                                      <circle cx={px + 2} cy={py + 2} r="1.3" fill="#fef08a" />
                                      <circle cx={px + 6} cy={py + 2} r="1.3" fill="#fef08a" />
                                    </>
                                  )}
                                </g>
                              );
                            }
                            if (fType === 'retro_bowl') {
                              const r = 3.8;
                              return (
                                <g key={key}>
                                  <circle cx={px + r} cy={py + r} r={r} fill="#eab308" stroke="#78350f" strokeWidth="0.6" />
                                  <circle cx={px + r} cy={py + r} r={r * 0.6} fill="none" stroke="#334155" strokeWidth="0.4" />
                                  <circle cx={px + r} cy={py + r} r="1.2" fill="#0f172a" />
                                </g>
                              );
                            }
                            if (fType === 'vintage_round') {
                              const r = 3.6;
                              return (
                                <g key={key}>
                                  <circle cx={px + r} cy={py + r} r={r} fill="#cbd5e1" stroke="#475569" strokeWidth="0.6" />
                                  <circle cx={px + r} cy={py + r} r={r - 0.8} fill="#ea580c" />
                                  <line x1={px} y1={py + r} x2={px + 2 * r} y2={py + r} stroke="#f8fafc" strokeWidth="0.4" />
                                  <line x1={px + r} y1={py} x2={px + r} y2={py + 2 * r} stroke="#f8fafc" strokeWidth="0.4" />
                                </g>
                              );
                            }
                            if (fType === 'par_led_18') {
                              const r = 3.5;
                              return (
                                <g key={key}>
                                  <circle cx={px + r} cy={py + r} r={r} fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
                                  <circle cx={px + r} cy={py + r} r="1" fill="#38bdf8" />
                                  <circle cx={px + r - 1.5} cy={py + r - 1.5} r="0.6" fill="#38bdf8" />
                                  <circle cx={px + r + 1.5} cy={py + r - 1.5} r="0.6" fill="#38bdf8" />
                                  <circle cx={px + r - 1.5} cy={py + r + 1.5} r="0.6" fill="#38bdf8" />
                                  <circle cx={px + r + 1.5} cy={py + r + 1.5} r="0.6" fill="#38bdf8" />
                                </g>
                              );
                            }
                            if (fType === 'portman_hex_6') {
                              const r = 3.6;
                              const cx = px + r;
                              const cy = py + r;
                              return (
                                <g key={key}>
                                  <polygon
                                    points={`${cx + r},${cy} ${cx + r * 0.5},${cy + r * 0.866} ${cx - r * 0.5},${cy + r * 0.866} ${cx - r},${cy} ${cx - r * 0.5},${cy - r * 0.866} ${cx + r * 0.5},${cy - r * 0.866}`}
                                    fill="#d97706"
                                    stroke="#78350f"
                                    strokeWidth="0.6"
                                  />
                                  <circle cx={cx} cy={cy} r="1.3" fill="#fef08a" />
                                </g>
                              );
                            }
                            // Default strobe beam bar (36LED Strobe Beam)
                            const w = isVert ? 5 : 8;
                            const h = isVert ? 8 : 4;
                            return (
                              <rect key={key} x={px} y={py} width={w} height={h} fill="#9333ea" stroke="#c084fc" strokeWidth="0.5" rx="1" />
                            );
                          };

                          if (isFloor) {
                            const total = count * 2;
                            const bw = 7;
                            const startX = 78;
                            const stepX = (104 - bw) / Math.max(1, total - 1);
                            const by = 145 - 6;
                            const fixtures = [];
                            for (let i = 0; i < total; i++) {
                              const fTypeForPos = getFixtureTypeForPosition({
                                mode: lighting.sideFixtureMode || 'single',
                                singleType: lighting.sideFixtureType || 'cob_blinder_2eye',
                                fixtureA: lighting.sideFixtureA || 'cob_blinder_2eye',
                                fixtureB: lighting.sideFixtureB || 'retro_bowl',
                                flancIndex: 0,
                                itemIndex: i,
                                totalFlancs: 1,
                                countPerFlanc: total
                              });
                              fixtures.push(renderFixtureSymbol(`fix-fl-${i}`, startX + i * stepX, by, fTypeForPos));
                            }
                            return <g>{fixtures}</g>;
                          }

                          const bw = isVert ? 5 : 8;
                          const bh = isVert ? 8 : 6;
                          const stepY = 46 / Math.max(1, count - 1);
                          const flancs = Math.max(1, lighting.sideMatricesFlancs || 1);
                          const marginPx = Math.round((lighting.sideMatricesMargin ?? 0.4) * 12);
                          const flancSpacingPx = Math.round((lighting.sideMatricesFlancSpacing ?? 0.5) * 14);
                          const fixtures = [];
                          for (let f = 0; f < flancs; f++) {
                            const xL = 75 - marginPx - bw - (f * flancSpacingPx);
                            const xR = 185 + marginPx + (f * flancSpacingPx);
                            for (let i = 0; i < count; i++) {
                              const yPos = sy + 3 + i * stepY;
                              const fTypeForPos = getFixtureTypeForPosition({
                                mode: lighting.sideFixtureMode || 'single',
                                singleType: lighting.sideFixtureType || 'cob_blinder_2eye',
                                fixtureA: lighting.sideFixtureA || 'cob_blinder_2eye',
                                fixtureB: lighting.sideFixtureB || 'retro_bowl',
                                flancIndex: f,
                                itemIndex: i,
                                totalFlancs: flancs,
                                countPerFlanc: count
                              });
                              fixtures.push(renderFixtureSymbol(`fix-l-${f}-${i}`, xL, yPos, fTypeForPos));
                              fixtures.push(renderFixtureSymbol(`fix-r-${f}-${i}`, xR, yPos, fTypeForPos));
                            }
                          }
                          return <g>{fixtures}</g>;
                        })()}

                        {/* Light Cones */}
                        {structure.enabled !== false && structure.structureType !== 'none' && lighting.enabled !== false && (
                          <>
                            <polygon points="60,42 35,145 85,145" fill="rgba(56, 189, 248, 0.2)" />
                            <polygon points="130,42 95,145 165,145" fill="rgba(56, 189, 248, 0.2)" />
                            <polygon points="200,42 175,145 225,145" fill="rgba(56, 189, 248, 0.2)" />
                          </>
                        )}
                      </svg>
                    </div>
                  )}
                  <div className="plan-caption">
                    Élévation : {stage.enabled !== false ? `Hauteur ${Math.round(stage.dimensions.heightM * 100)}cm • ` : ''}{screen.enabled !== false ? `Écran LED • ` : ''}{structure.enabled !== false ? `Dégagement ${structure.dimensions.height}m` : 'Configuration sans structure'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 PILLIERS SYNTHÈSE */}
            <div className="print-section-title" style={{ marginTop: '8px' }}>
              SPÉCIFICATIONS DES 4 COMPOSANTES MAJEURES
            </div>
            <div className="print-kpi-grid">
              <div className="print-kpi-box">
                <span className="kpi-label">1. SCÈNE & PODIUM</span>
                <span className="kpi-val">{stage.dimensions.surfaceM2} m²</span>
                <span className="kpi-sub">{stage.counts.stagePlaques} plaques • {stage.counts.stagePieds} pieds</span>
                <span className="kpi-sub">Charge : {stage.admissibleStageLoadKg} kg</span>
              </div>
              <div className="print-kpi-box">
                <span className="kpi-label">2. STRUCTURE TRUSS</span>
                <span className="kpi-val">{structure.dimensions.length}×{structure.dimensions.width}m</span>
                <span className="kpi-sub">{structure.specs.gridSpecL.name}</span>
                <span className="kpi-sub">{structure.numTowers} tours • {structure.numTowers} palans 1T</span>
              </div>
              <div className="print-kpi-box">
                <span className="kpi-label">3. ÉCRAN LED</span>
                <span className="kpi-val">{screen.dimensions.areaM2} m²</span>
                <span className="kpi-sub">Pitch {screen.pitch} • {screen.totalPixels.toLocaleString()} px</span>
                <span className="kpi-sub">Poids écran : {screen.screenWeightKg} kg</span>
              </div>
              <div className="print-kpi-box">
                <span className="kpi-label">4. ÉCLAIRAGE SCÉNIQUE</span>
                <span className="kpi-val">{lighting.counts.total} projecteurs</span>
                <span className="kpi-sub">{lighting.counts.beams} Beams • {lighting.counts.spots} Spots • {lighting.counts.washes} Washes</span>
                <span className="kpi-sub">{lighting.totalDmxChannels} canaux DMX ({lighting.dmxUniverses} univers)</span>
              </div>
            </div>

            {/* BILAN DES CHARGES & ÉLECTRICITÉ */}
            <div className="print-section-title" style={{ marginTop: '8px' }}>
              BILAN DES CHARGES RIGGING & PUISSANCE ÉLECTRIQUE
            </div>
            <div className="print-kpi-grid">
              <div className="print-kpi-box">
                <span className="kpi-label">POIDS TOTAL SUSPENDU</span>
                <span className="kpi-val highlight">{totalRigging.totalSuspendedLoadKg} kg</span>
                <span className="kpi-sub">Alu ({totalRigging.aluWeight}kg) + LED ({totalRigging.screenWeight}kg) + Lumière ({totalRigging.lightingWeight}kg)</span>
              </div>
              <div className="print-kpi-box">
                <span className="kpi-label">CHARGE PONCTUELLE / TOUR</span>
                <span className={`kpi-val ${totalRigging.isOverload ? 'critical' : 'success'}`}>
                  {totalRigging.pointLoadPerMotorKg} kg
                </span>
                <span className="kpi-sub">Palan 1 Tonne ({totalRigging.motorSafetyPercentage}% utilisé)</span>
              </div>
              <div className="print-kpi-box">
                <span className="kpi-label">PUISSANCE TOTALE REQUISE</span>
                <span className="kpi-val highlight">{totalPower.totalKw} kW</span>
                <span className="kpi-sub">LED ({totalPower.screenPowerKw}kW) + Light ({totalPower.lightingPowerKw}kW) + Audio ({totalPower.audioAndExtraKw}kW)</span>
              </div>
              <div className="print-kpi-box">
                <span className="kpi-label">DISTRIBUTION ÉLECTRIQUE</span>
                <span className="kpi-val success">{totalPower.triAmps380V} A</span>
                <span className="kpi-sub">Triphasé 380V • Armoire 63A recommandée</span>
              </div>
            </div>

            {/* Pied de Page 1 */}
            <div className="page-footer-strip">
              <span>Bright Stage Pro — Dossier Technique Scénique Global • Réf : BS-FULL</span>
              <span>Page 1 / 2</span>
            </div>
          </div>

          {/* Indicateur visuel d'écran pour la séparation des pages */}
          <div className="no-print" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '18px 0 10px 0',
            padding: '8px',
            background: 'rgba(236, 72, 153, 0.08)',
            border: '1px dashed rgba(236, 72, 153, 0.35)',
            borderRadius: '6px',
            color: '#ec4899',
            fontSize: '11px',
            fontWeight: 600
          }}>
            <span>📄 Saut de page automatique PDF • Page 2 : Nomenclature du Matériel & Signatures</span>
          </div>

          {/* SAUT DE PAGE OBLIGATOIRE POUR LE PDF */}
          <div className="print-page-break" />

          {/* =========================================================================
              PAGE 2 : NOMENCLATURE DU MATÉRIEL (BOM), CONFORMITÉ & SIGNATURES
             ========================================================================= */}
          <div className="print-page-2">
            {/* Header Page 2 */}
            <div className="print-header print-page-2-header">
              <div className="print-brand-block">
                <div className="print-logo-badge" style={{ width: '34px', height: '34px', fontSize: '13px' }}>BS</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    BRIGHT STAGE PRO — NOMENCLATURE DU MATÉRIEL & BORDEREAU DE LIVRAISON
                  </h2>
                  <p style={{ margin: 0, fontSize: '9px', color: '#64748b' }}>
                    Bordereau Technique de Colisage • Réf : BS-FULL • Événement : {eventName}
                  </p>
                </div>
              </div>
              <div className="print-meta-block">
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>PAGE 2 / 2</div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>Date : {currentDate}</div>
              </div>
            </div>

            {/* TABLEAU DES ÉQUIPEMENTS (BOM) */}
            <div className="print-section-title" style={{ marginTop: '6px' }}>
              NOMENCLATURE GLOBALE DU MATÉRIEL & COLISAGE TECHNIQUE
            </div>
            <table className="print-table" style={{ marginTop: '4px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>DÉSIGNATION DE L'ÉQUIPEMENT</th>
                  <th style={{ width: '42%' }}>SPÉCIFICATION TECHNIQUE</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>QUANTITÉ & POIDS</th>
                </tr>
              </thead>
              <tbody>
                {equipmentBOM.map(item => (
                  <tr key={item.id}>
                    <td className="equipment-name-td">
                      <strong>{item.name}</strong>
                      <span className="td-category">{item.category}</span>
                    </td>
                    <td className="equipment-spec-td">{item.spec}</td>
                    <td className="equipment-qty-td">
                      <span className="qty-number">{item.quantity}</span>
                      <span className="qty-unit">pcs</span>
                      <div style={{ fontSize: '8.5px', color: '#64748b' }}>{item.totalWeightKg} kg</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Conformité & Signatures */}
            <div className="print-safety-stamp is-conform">
              <CheckCircle size={20} />
              <div>
                <div className="stamp-title">CONCEPTION CONFORME AUX NORMES SCÉNIQUES EUROPÉENNES (BGV-C1 / EN 13814 / EUROCODE 9)</div>
                <div className="stamp-desc">
                  Structure aluminium vérifiée • Coefficient de sécurité supérieur à 2.5 • Protection électrique différentielle 30mA • Matériel ignifugé M1.
                </div>
              </div>
            </div>

            <div className="print-signatures-row">
              <div className="sig-box">
                <span className="sig-label">RESPONSABLE TECHNIQUE & PRODUCTION BRIGHT STAGE</span>
                <div className="sig-line">Jilani Wahi — Directeur Technique</div>
              </div>
              <div className="sig-box">
                <span className="sig-label">VISA DU CHARGÉ DE SÉCURITÉ / DIRECTION FESTIVAL</span>
                <div className="sig-line">Signature & Cachet : ____________________</div>
              </div>
            </div>

            {/* Pied de Page 2 */}
            <div className="page-footer-strip">
              <span>Bright Stage Pro — Dossier Technique Scénique Global • Réf : BS-FULL</span>
              <span>Page 2 / 2</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
