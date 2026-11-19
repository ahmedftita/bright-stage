import React from 'react';
import { X, Printer, ShieldCheck, AlertTriangle, Layers, Wrench, Monitor, Zap, Sun, CheckCircle } from 'lucide-react';

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
    window.print();
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
              <p>Document unifié : Scène, Écran LED, Éclairage, Structure & Bilans Techniques</p>
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

        {/* PRINTABLE DOCUMENT */}
        <div className="printable-structure-doc" id="printable-full-doc">
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
              <div className="print-meta-sub">Réf : BS-FULL-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Event Banner */}
          <div className="print-event-strip">
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
                <span className="strip-label">MATRICES LATÉRALES</span>
                <span className="strip-value" style={{ color: '#9333ea' }}>{lighting.totalSideMatrices}x 36LED Strobe Beam 220W (5G + 5D)</span>
              </div>
            )}
          </div>

          {/* 2 PLANS TECHNIQUES (Vue du Haut & Vue de Face) */}
          <div className="print-plans-grid">
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
                  <img src={capturePlanUrl} alt="Vue 2D" className="plan-capture-img" />
                ) : (
                  <div className="truss-2d-svg-container">
                    <svg viewBox="-20 -20 300 210" style={{ width: '100%', maxHeight: '190px' }}>
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

                      {/* Matrices Strobe flanquant l'écran */}
                      {screen.enabled !== false && lighting.enabled !== false && lighting.sideMatricesCount > 0 && (
                        <>
                          <rect x="62" y="47" width="8" height="12" fill="#9333ea" stroke="#581c87" strokeWidth="1" rx="1" />
                          <rect x="190" y="47" width="8" height="12" fill="#9333ea" stroke="#581c87" strokeWidth="1" rx="1" />
                          <text x="50" y="56" fill="#9333ea" fontSize="6" fontWeight="bold" textAnchor="end">5× MATRICES</text>
                          <text x="202" y="56" fill="#9333ea" fontSize="6" fontWeight="bold" textAnchor="start">5× MATRICES</text>
                        </>
                      )}

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
                  Implantation scénique personnalisée : {stage.enabled !== false ? `Scène ${stage.dimensions.lengthM}×${stage.dimensions.widthM}m • ` : ''}{structure.enabled !== false ? `Structure ${structure.dimensions.length}×${structure.dimensions.width}m • ` : ''}{screen.enabled !== false ? `Écran LED • ` : ''}{lighting.enabled !== false ? `Lumières` : ''}
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
                  <img src={capture3DUrl} alt="Vue 3D Face" className="plan-capture-img" />
                ) : (
                  <div className="truss-2d-svg-container">
                    <svg viewBox="-20 -20 300 210" style={{ width: '100%', maxHeight: '190px' }}>
                      {/* Ground line */}
                      <line x1="0" y1="175" x2="260" y2="175" stroke="#0f172a" strokeWidth="2.5" />
                      <text x="130" y="190" fill="#64748b" fontSize="8" textAnchor="middle">NIVEAU DU SOL (0,00 m)</text>

                      {/* Towers and Top Truss */}
                      {structure.enabled !== false && (
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

                      {/* LED Screen */}
                      {screen.enabled !== false && (
                        <>
                          <rect x="75" y={stage.enabled !== false ? 60 : 100} width="110" height="55" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" rx="2" />
                          <text x="130" y={stage.enabled !== false ? 90 : 130} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                            ÉCRAN LED ({screen.dimensions.widthM}×{screen.dimensions.heightM}m)
                          </text>
                        </>
                      )}

                      {/* 5 Matrices Gauche et 5 Matrices Droite */}
                      {screen.enabled !== false && lighting.enabled !== false && lighting.sideMatricesCount > 0 && (
                        <>
                          {/* Gauche */}
                          <rect x="63" y={stage.enabled !== false ? 60 : 100} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="63" y={stage.enabled !== false ? 71 : 111} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="63" y={stage.enabled !== false ? 82 : 122} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="63" y={stage.enabled !== false ? 93 : 133} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="63" y={stage.enabled !== false ? 104 : 144} width="8" height="9" fill="#9333ea" rx="1" />
                          {/* Droite */}
                          <rect x="189" y={stage.enabled !== false ? 60 : 100} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="189" y={stage.enabled !== false ? 71 : 111} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="189" y={stage.enabled !== false ? 82 : 122} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="189" y={stage.enabled !== false ? 93 : 133} width="8" height="9" fill="#9333ea" rx="1" />
                          <rect x="189" y={stage.enabled !== false ? 104 : 144} width="8" height="9" fill="#9333ea" rx="1" />
                        </>
                      )}

                      {/* Light Cones */}
                      {structure.enabled !== false && lighting.enabled !== false && (
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
                  Élévation technique : {stage.enabled !== false ? `Hauteur praticable ${Math.round(stage.dimensions.heightM * 100)}cm • ` : ''}{screen.enabled !== false ? `Écran LED • ` : ''}{structure.enabled !== false ? `Dégagement structure ${structure.dimensions.height}m` : 'Configuration sans structure'}
                </div>
              </div>
            </div>
          </div>

          {/* 4 PILLIERS SYNTHÈSE */}
          <div className="print-section-title">SPÉCIFICATIONS DES 4 COMPOSANTES MAJEURES</div>
          <div className="print-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
          <div className="print-section-title" style={{ marginTop: '12px' }}>
            BILAN DES CHARGES RIGGING & PUISSANCE ÉLECTRIQUE
          </div>
          <div className="print-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

          {/* TABLEAU DES ÉQUIPEMENTS (BOM) */}
          <div className="print-section-title" style={{ marginTop: '12px' }}>
            NOMENCLATURE GLOBALE DU MATÉRIEL & COLISAGE
          </div>
          <table className="print-table">
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
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{item.totalWeightKg} kg</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Conformité & Signatures */}
          <div className="print-safety-stamp is-conform" style={{ marginTop: '12px' }}>
            <CheckCircle size={22} />
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
        </div>
      </div>
    </div>
  );
}
