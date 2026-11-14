import React, { useState } from 'react';
import { X, Check, Copy, Printer } from 'lucide-react';

/**
 * Plan 1 : VUE DU HAUT (Plan d'implantation 2D en SVG haute précision)
 */
function StageTopViewSvg({ L, l, lengthM, widthM, hasStairs, stairSteps }) {
  const viewBoxW = 420;
  const viewBoxH = 205;

  // Zone allouée à la grille de praticables
  const maxGridW = 270;
  const maxGridH = 120;
  const moduleSize = Math.min(maxGridW / L, maxGridH / l, 36);

  const stageW = L * moduleSize;
  const stageH = l * moduleSize;

  // Centrage de la scène
  const originX = 52 + (maxGridW - stageW) / 2;
  const originY = 38 + (maxGridH - stageH) / 2;

  // Calcul des escaliers
  const stairW = 28;
  const stairH = Math.min(stageH, 44);
  const stairX = originX + stageW + 6;
  const stairY = originY + (stageH - stairH) / 2;

  return (
    <svg
      viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
      className="pdf-cad-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Marqueur flèche de cotation */}
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
        </marker>
        <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#0f172a" />
        </marker>
      </defs>

      {/* Fond propre */}
      <rect x="2" y="2" width={viewBoxW - 4} height={viewBoxH - 4} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="4" />

      {/* Repère Fond de scène / Régie */}
      <text x={originX + stageW / 2} y="15" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#475569" letterSpacing="0.8">
        ▲ FOND DE SCÈNE / RÉGIE
      </text>

      {/* Cotation Longueur (Axe horizontal) */}
      <line x1={originX} y1="24" x2={originX + stageW} y2="24" stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow)" />
      <line x1={originX} y1="20" x2={originX} y2="28" stroke="#0f172a" strokeWidth="1" />
      <line x1={originX + stageW} y1="20" x2={originX + stageW} y2="28" stroke="#0f172a" strokeWidth="1" />
      <text x={originX + stageW / 2} y="22" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a">
        Longueur : {lengthM} m ({L} mod. × 1,22 m)
      </text>

      {/* Cotation Largeur (Axe vertical gauche) */}
      <line x1="24" y1={originY} x2="24" y2={originY + stageH} stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow)" />
      <line x1="20" y1={originY} x2="28" y2={originY} stroke="#0f172a" strokeWidth="1" />
      <line x1="20" y1={originY + stageH} x2="28" y2={originY + stageH} stroke="#0f172a" strokeWidth="1" />
      <text
        x="-10"
        y="18"
        transform={`rotate(-90) translate(-${originY + stageH / 2}, 38)`}
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="800"
        fill="#0f172a"
      >
        Largeur : {widthM} m ({l} mod.)
      </text>

      {/* Grille des plaques (Stage plaques) */}
      {Array.from({ length: l }).map((_, row) =>
        Array.from({ length: L }).map((_, col) => {
          const x = originX + col * moduleSize;
          const y = originY + row * moduleSize;
          const num = row * L + col + 1;
          const fontSize = moduleSize > 25 ? 9.5 : 7.5;
          return (
            <g key={`tile-${row}-${col}`}>
              <rect
                x={x}
                y={y}
                width={moduleSize}
                height={moduleSize}
                fill="#ffffff"
                stroke="#475569"
                strokeWidth="1.2"
              />
              <text
                x={x + moduleSize / 2}
                y={y + moduleSize / 2 + (fontSize * 0.35)}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="700"
                fill="#0f172a"
              >
                #{num}
              </text>
            </g>
          );
        })
      )}

      {/* Points d'ancrage des Stage pieds aux intersections (L+1) × (l+1) */}
      {Array.from({ length: l + 1 }).map((_, rIdx) =>
        Array.from({ length: L + 1 }).map((_, cIdx) => {
          const cx = originX + cIdx * moduleSize;
          const cy = originY + rIdx * moduleSize;
          return (
            <circle
              key={`foot-${rIdx}-${cIdx}`}
              cx={cx}
              cy={cy}
              r="3.2"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
          );
        })
      )}

      {/* Escalier latéral (si inclus) */}
      {hasStairs && (
        <g>
          <rect
            x={stairX}
            y={stairY}
            width={stairW}
            height={stairH}
            fill="#fef3c7"
            stroke="#d97706"
            strokeWidth="1.2"
            strokeDasharray="3,2"
            rx="2"
          />
          {/* Marches */}
          {Array.from({ length: Math.max(1, stairSteps - 1) }).map((_, s) => {
            const stepLineX = stairX + ((s + 1) * stairW) / stairSteps;
            return (
              <line
                key={`step-line-${s}`}
                x1={stepLineX}
                y1={stairY}
                x2={stepLineX}
                y2={stairY + stairH}
                stroke="#d97706"
                strokeWidth="1"
              />
            );
          })}
          <text
            x={stairX + stairW / 2}
            y={stairY + stairH / 2 + 3}
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#b45309"
          >
            Escalier
          </text>
        </g>
      )}

      {/* Repère Face Scène / Public */}
      <text x={originX + stageW / 2} y={originY + stageH + 16} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#475569" letterSpacing="0.8">
        ▼ FACE SCÈNE / PUBLIC
      </text>
    </svg>
  );
}

/**
 * Plan 2 : VUE DE FACE (Élévation & Profil sol en SVG haute précision)
 */
function StageElevationSvg({ L, lengthM, heightM, hasStairs, stairSteps }) {
  const viewBoxW = 420;
  const viewBoxH = 205;

  const groundY = 168; // Hauteur de la ligne de sol
  const stageW = 265;
  const stageX = 64;

  // Hauteur visuelle proportionnelle
  const hM = Number(heightM) || 0.55;
  const hPx = Math.round(48 + (hM - 0.55) * 80); // 55cm -> 48px, 75cm -> 64px, 1m -> 84px
  const deckThickness = 12;
  const deckSurfaceY = groundY - hPx;
  const deckBottomY = deckSurfaceY + deckThickness;

  // Escalier latéral
  const stairStepsCount = Math.max(1, stairSteps || 2);
  const stepW = 12;
  const totalStairW = stairStepsCount * stepW;
  const stairStartX = stageX + stageW + 4;

  return (
    <svg
      viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
      className="pdf-cad-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrow-elev" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
        </marker>
        <marker id="arrow-elev-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#0f172a" />
        </marker>
      </defs>

      {/* Fond propre */}
      <rect x="2" y="2" width={viewBoxW - 4} height={viewBoxH - 4} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="4" />

      {/* Cotation Longueur Scène (Haut) */}
      <line x1={stageX} y1="20" x2={stageX + stageW} y2="20" stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow-elev-start)" markerEnd="url(#arrow-elev)" />
      <line x1={stageX} y1="16" x2={stageX} y2="24" stroke="#0f172a" strokeWidth="1" />
      <line x1={stageX + stageW} y1="16" x2={stageX + stageW} y2="24" stroke="#0f172a" strokeWidth="1" />
      <text x={stageX + stageW / 2} y="17" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a">
        Longueur de scène : {lengthM} m ({L} modules)
      </text>

      {/* Cotation Hauteur (Gauche) */}
      <line x1="38" y1={deckSurfaceY} x2="38" y2={groundY} stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow-elev-start)" markerEnd="url(#arrow-elev)" />
      <line x1="34" y1={deckSurfaceY} x2="42" y2={deckSurfaceY} stroke="#0f172a" strokeWidth="1" />
      <line x1="34" y1={groundY} x2="42" y2={groundY} stroke="#0f172a" strokeWidth="1" />
      <text
        x="32"
        y={(deckSurfaceY + groundY) / 2 + 3}
        textAnchor="end"
        fontSize="9.5"
        fontWeight="800"
        fill="#0f172a"
      >
        H = {Math.round(hM * 100)} cm
      </text>

      {/* Traversière / Côtés de liaison inter-poteaux */}
      <line
        x1={stageX}
        y1={deckBottomY + (groundY - 6 - deckBottomY) * 0.55}
        x2={stageX + stageW}
        y2={deckBottomY + (groundY - 6 - deckBottomY) * 0.55}
        stroke="#94a3b8"
        strokeWidth="2.5"
      />

      {/* Poteaux (Stage pieds) + Vérins de réglage */}
      {Array.from({ length: L + 1 }).map((_, i) => {
        const legX = stageX + (i * stageW) / L;
        return (
          <g key={`elev-leg-${i}`}>
            {/* Tube Ø 50mm */}
            <line
              x1={legX}
              y1={deckBottomY}
              x2={legX}
              y2={groundY - 5}
              stroke="#334155"
              strokeWidth="5"
              strokeLinecap="square"
            />
            {/* Tige filetée vérin */}
            <line
              x1={legX}
              y1={groundY - 6}
              x2={legX}
              y2={groundY - 1}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* Embase / disque de sol réglable */}
            <rect
              x={legX - 6}
              y={groundY - 2.5}
              width="12"
              height="2.5"
              fill="#0f172a"
              rx="0.5"
            />
          </g>
        );
      })}

      {/* Plateau de scène (Stage plaques 18mm) */}
      <rect
        x={stageX}
        y={deckSurfaceY}
        width={stageW}
        height={deckThickness}
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1.5"
        rx="1"
      />
      <text
        x={stageX + stageW / 2}
        y={deckSurfaceY + 8.5}
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#ffffff"
      >
        Plateau Stage plaques antidérapant 18 mm
      </text>

      {/* Escalier latéral avec vraies marches et rampe (si inclus) */}
      {hasStairs && (
        <g>
          {Array.from({ length: stairStepsCount }).map((_, s) => {
            // Descend de la scène (à gauche) vers le sol extérieur (à droite)
            const stepHeight = ((stairStepsCount - s) * hPx) / stairStepsCount;
            const curX = stairStartX + s * stepW;
            const curY = groundY - stepHeight;
            return (
              <g key={`elev-step-${s}`}>
                <rect
                  x={curX}
                  y={curY}
                  width={stepW}
                  height={stepHeight}
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
          {/* Rampe / Garde-corps escalier : descend de la scène vers le sol extérieur */}
          <line
            x1={stairStartX}
            y1={deckSurfaceY - 14}
            x2={stairStartX + totalStairW}
            y2={groundY - (hPx / stairStepsCount) - 14}
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Potelet vertical de rampe haut (côté scène) */}
          <line
            x1={stairStartX}
            y1={deckSurfaceY}
            x2={stairStartX}
            y2={deckSurfaceY - 14}
            stroke="#d97706"
            strokeWidth="1.5"
          />
          {/* Potelet vertical de rampe bas (côté sol) */}
          <line
            x1={stairStartX + totalStairW}
            y1={groundY - (hPx / stairStepsCount)}
            x2={stairStartX + totalStairW}
            y2={groundY - (hPx / stairStepsCount) - 14}
            stroke="#d97706"
            strokeWidth="1.5"
          />
          <text
            x={stairStartX + totalStairW / 2}
            y={deckSurfaceY - 18}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="bold"
            fill="#b45309"
          >
            Escalier ({stairStepsCount} m.)
          </text>
        </g>
      )}

      {/* Ligne de sol 0.00 m */}
      <line x1="20" y1={groundY} x2="400" y2={groundY} stroke="#0f172a" strokeWidth="1.8" />

      {/* Hachures de sol architecturales */}
      {Array.from({ length: 25 }).map((_, hIdx) => {
        const xPos = 25 + hIdx * 15;
        return (
          <line
            key={`hatch-${hIdx}`}
            x1={xPos}
            y1={groundY}
            x2={xPos - 5}
            y2={groundY + 6}
            stroke="#94a3b8"
            strokeWidth="1"
          />
        );
      })}

      <text x={stageX + stageW / 2} y={groundY + 16} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#334155" letterSpacing="0.5">
        NIVEAU DU SOL (0,00 m) • VÉRINS AJUSTABLES
      </text>
    </svg>
  );
}

export default function ExportSummaryModal({
  isOpen,
  onClose,
  calculation,
  projectName = "Fiche Technique Scène Modulaire"
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !calculation) return null;

  const { modules, physicalDimensions, counts, heightSpec, logistics, billOfMaterials } = calculation;
  const { length: L, width: l } = modules;
  const { lengthM, widthM, heightM, surfaceM2 } = physicalDimensions;

  // Format texte rapide (Email / WhatsApp)
  const generateFormattedText = () => {
    let text = `📋 FICHE TECHNIQUE — ${projectName.toUpperCase()}\n`;
    text += `═════════════════════════════════════════════════════════\n`;
    text += `• Dimensions réelles : ${lengthM} m × ${widthM} m (${L} × ${l} modules)\n`;
    text += `• Hauteur de scène : ${Math.round(heightM * 100)} cm (${heightSpec.label})\n`;
    text += `• Surface totale : ${surfaceM2} m² (Formule: L × l × 1,4884)\n`;
    text += `• Charge totale admissible : ${logistics.totalLoadCapacityKg.toLocaleString()} kg (750 kg/m²)\n\n`;
    text += `📦 ÉQUIPEMENTS :\n`;
    billOfMaterials.forEach(item => {
      text += `  • ${item.quantity} ${item.unit} — ${item.name}\n`;
    });
    text += `═════════════════════════════════════════════════════════\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateFormattedText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Erreur copie", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-box pdf-export-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar (Masqué au print) */}
        <div className="modal-header no-print">
          <div className="modal-header-info">
            <div className="modal-badge-icon">
              <Printer size={20} />
            </div>
            <div>
              <h3>Aperçu du Document PDF / Impression</h3>
              <p>Deux plans (Vue de face & Vue en haut), Équipements et Charge totale</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* CONTENU IMPRIMABLE (Ce qui apparaît strictement dans le PDF) */}
        <div className="modal-body-scrollable printable-pdf-content" id="stage-pdf-document">
          {/* En-tête officiel du document */}
          <div className="pdf-doc-header">
            <div className="pdf-header-titles">
              <h1 className="pdf-main-title">FICHE TECHNIQUE SCÈNE</h1>
              <div className="pdf-meta-line">
                <span>Dimensions réelles : <strong>{lengthM} m × {widthM} m</strong> ({L} × {l} modules de 1,22 × 1,22 m)</span>
                <span className="pdf-meta-sep">•</span>
                <span>Hauteur : <strong>{Math.round(heightM * 100)} cm</strong></span>
              </div>
            </div>
            <div className="pdf-header-badge">
              <span>Standard 1,22 × 1,22 m</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              1. LES DEUX PLANS (VUE DU HAUT & VUE DE FACE)
             ══════════════════════════════════════════════════════════ */}
          <div className="pdf-plans-container">
            {/* PLAN 1 : VUE DU HAUT */}
            <div className="pdf-plan-block">
              <div className="pdf-plan-title">
                <span className="plan-number-tag">1</span>
                <span>VUE DU HAUT (Plan d'implantation 2D)</span>
                <span className="pdf-plan-dims-tag">{lengthM} m × {widthM} m</span>
              </div>
              <StageTopViewSvg
                L={L}
                l={l}
                lengthM={lengthM}
                widthM={widthM}
                hasStairs={counts.stairs > 0}
                stairSteps={counts.stairSteps}
              />
            </div>

            {/* PLAN 2 : VUE DE FACE */}
            <div className="pdf-plan-block">
              <div className="pdf-plan-title">
                <span className="plan-number-tag">2</span>
                <span>VUE DE FACE (Élévation & Profil sol)</span>
                <span className="pdf-plan-dims-tag">Hauteur : {Math.round(heightM * 100)} cm</span>
              </div>
              <StageElevationSvg
                L={L}
                lengthM={lengthM}
                heightM={heightM}
                hasStairs={counts.stairs > 0}
                stairSteps={counts.stairSteps}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              2. LISTE DES ÉQUIPEMENTS (OFFICIEL BRIGHT STAGE)
             ══════════════════════════════════════════════════════════ */}
          <div className="pdf-section-box">
            <h3 className="pdf-section-heading">ÉQUIPEMENTS REQUIS</h3>
            <table className="pdf-equipment-table">
              <thead>
                <tr>
                  <th>Désignation de l'Équipement</th>
                  <th>Spécification Technique Officielle</th>
                  <th style={{ textAlign: 'right' }}>Quantité</th>
                </tr>
              </thead>
              <tbody>
                {billOfMaterials.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong className="pdf-item-title">{item.name}</strong>
                    </td>
                    <td className="pdf-item-spec">{item.spec}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="pdf-item-qty">{item.quantity}</strong> {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ══════════════════════════════════════════════════════════
              3. CHARGE TOTALE & SURFACE
             ══════════════════════════════════════════════════════════ */}
          <div className="pdf-section-box pdf-load-box">
            <h3 className="pdf-section-heading">CHARGE TOTALE & CAPACITÉ</h3>
            <div className="pdf-load-grid">
              <div className="pdf-load-card">
                <span className="pdf-load-label">Surface Totale</span>
                <span className="pdf-load-val">{surfaceM2} m²</span>
                <span className="pdf-load-formula">Formule : L × l × 1,4884</span>
              </div>

              <div className="pdf-load-card highlight-card">
                <span className="pdf-load-label">Charge Totale Admissible</span>
                <span className="pdf-load-val">{logistics.totalLoadCapacityKg.toLocaleString()} kg</span>
                <span className="pdf-load-formula">Norme UDL : 750 kg/m²</span>
              </div>

              <div className="pdf-load-card">
                <span className="pdf-load-label">Poids Total Matériel</span>
                <span className="pdf-load-val">~{logistics.totalWeightKg} kg</span>
                <span className="pdf-load-formula">Plaques + Pieds + Côtés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer (Masqué au print) */}
        <div className="modal-footer no-print">
          <div className="modal-footer-left">
            <button
              type="button"
              className={`action-btn btn-secondary ${copied ? 'btn-success' : ''}`}
              onClick={handleCopy}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copié !' : 'Copier texte'}</span>
            </button>
          </div>
          <div className="modal-footer-right">
            <button
              type="button"
              className="action-btn btn-primary"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Imprimer / Télécharger PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
