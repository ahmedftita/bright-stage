import React, { useState } from 'react';
import { X, Check, Copy, Printer, Download, FileCode, Monitor, Zap, Cpu, Scale, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function LedExportModal({
  isOpen,
  onClose,
  stats,
  configType,
  cabinetSpec,
  faceA,
  faceB,
  screenElements,
  signalPaths,
  powerPaths,
  viewMode,
  projectName = "Configuration Mur LED Scénique"
}) {
  const [copied, setCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  if (!isOpen || !stats) return null;

  // Generate formatted technical text
  const generateFormattedText = () => {
    let t = `📺 FICHE TECHNIQUE — ${projectName.toUpperCase()}\n`;
    t += `═══════════════════════════════════════════════════\n`;
    t += `• Type de configuration : ${configType === 'Complex' ? 'Multi-écrans complexes' : configType === 'L-Shape' ? 'Angle en L (90°)' : 'Mur Plan Standard'}\n`;
    t += `• Modèle caisson : ${cabinetSpec.name} (${cabinetSpec.width}×${cabinetSpec.height} mm • Pitch ${cabinetSpec.pixelPitch} mm)\n`;
    t += `• Nombre total de caissons : ${stats.hardware.totalTiles} modules (${stats.dimensions.surfaceM2} m²)\n`;
    t += `• Dimensions hors-tout : ${stats.dimensions.widthM} m (L) × ${stats.dimensions.heightM} m (H)\n`;
    t += `• Résolution native globale : ${stats.resolution.totalW} × ${stats.resolution.totalH} px (${stats.resolution.totalPixels.toLocaleString()} pixels)\n`;
    t += `• Ratio d'aspect : ${stats.resolution.aspectRatio}\n`;
    t += `• Poids total suspendu : ${stats.hardware.totalWeightKg} kg (hors structure)\n`;
    t += `• Puissance électrique max : ${stats.hardware.totalMaxPowerW} W (${stats.hardware.ampsAssuming230V} A @ 230V)\n`;
    t += `• Puissance moyenne en exploitation : ~${stats.hardware.totalAvgPowerW} W\n`;
    t += `• Circuits 16A 230V recommandés : ${stats.hardware.recommendedCircuits16A} ligne(s) dédiée(s) (Max ${stats.hardware.daisyChainMaxPerCircuit} dalles/ligne)\n`;
    t += `• Contrôleur vidéo / Ports RJ45 : ${stats.hardware.requiredPortsEth} port(s) Gigabit requis (NovaStar MCTRL / VX Series)\n\n`;
    t += `🔌 RÉPARTITION DU CÂBLAGE SIGNAL :\n`;
    Object.entries(signalPaths).forEach(([port, path]) => {
      if (path.length > 0) {
        const portArea = +(path.length * stats.specs.tileAreaM2).toFixed(2);
        const portPixels = path.length * stats.specs.pixelsPerTileTotal;
        t += `  • Port ${port} : ${path.length} modules (${portArea} m² • ${portPixels.toLocaleString()} px)\n`;
      }
    });
    t += `═══════════════════════════════════════════════════\n`;
    t += `Généré avec LED Screen Configurator Pro`;
    return t;
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

  const handleDownloadJSON = () => {
    const exportData = {
      project: projectName,
      timestamp: new Date().toISOString(),
      generator: "LED Screen Configurator Pro",
      configuration: {
        type: configType,
        cabinet: cabinetSpec,
        dimensions: {
          width_mm: stats.dimensions.totalWidth_mm,
          height_mm: stats.dimensions.totalHeight_mm,
          surface_m2: stats.dimensions.surfaceM2
        },
        resolution: {
          total_w: stats.resolution.totalW,
          total_h: stats.resolution.totalH,
          total_pixels: stats.resolution.totalPixels,
          aspect_ratio: stats.resolution.aspectRatio
        },
        faces: configType === 'Complex'
          ? screenElements.map(el => ({
              id: el.name || el.id,
              offset_x: el.x,
              offset_y: el.y,
              cols: el.cols,
              rows: el.rows,
              resolution: `${el.cols * stats.specs.pixelsPerTileW}x${el.rows * stats.specs.pixelsPerTileH}`
            }))
          : [
              {
                id: "Face_A",
                cols: faceA.cols,
                rows: faceA.rows,
                resolution: `${faceA.cols * stats.specs.pixelsPerTileW}x${faceA.rows * stats.specs.pixelsPerTileH}`
              },
              ...(configType === 'L-Shape' ? [{
                id: "Face_B_Return",
                cols: faceB.cols,
                rows: faceA.rows,
                resolution: `${faceB.cols * stats.specs.pixelsPerTileW}x${faceA.rows * stats.specs.pixelsPerTileH}`
              }] : [])
            ],
        hardware: {
          total_tiles: stats.hardware.totalTiles,
          total_weight_kg: stats.hardware.totalWeightKg,
          max_power_w: stats.hardware.totalMaxPowerW,
          avg_power_w: stats.hardware.totalAvgPowerW,
          amps_230v: stats.hardware.ampsAssuming230V,
          recommended_circuits_16a: stats.hardware.recommendedCircuits16A,
          required_ports_eth: stats.hardware.requiredPortsEth
        },
        cabling: {
          signal_routes: Object.entries(signalPaths).map(([port, path]) => ({
            port: parseInt(port),
            tiles_count: path.length,
            route: path.map((p, i) => ({ step: i + 1, ...p }))
          })).filter(p => p.tiles_count > 0),
          power_routes: Object.entries(powerPaths).map(([circuit, path]) => ({
            circuit: parseInt(circuit),
            tiles_count: path.length,
            route: path.map((p, i) => ({ step: i + 1, ...p }))
          })).filter(p => p.tiles_count > 0)
        }
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LED_Mapping_${configType}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    const element = document.getElementById('led-canvas-export');
    if (!element) return;
    setIsExportingImage(true);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0c16',
        scale: 2,
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `Schema_Cablage_LED_${viewMode.toUpperCase()}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Échec capture", err);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
              <Monitor size={20} />
            </div>
            <div>
              <h3>Fiche Technique & Export Mur LED</h3>
              <p>Spécifications photométriques, réseau NovaStar & puissance électrique</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body-scrollable">
          {/* Top 4 KPI Cards */}
          <div className="summary-specs-grid">
            <div className="summary-mini-card">
              <span className="mini-card-label">Résolution Globale</span>
              <span className="mini-card-val text-emerald">
                {stats.resolution.totalW} × {stats.resolution.totalH}
              </span>
              <span className="mini-card-sub">{stats.resolution.aspectRatio}</span>
            </div>
            <div className="summary-mini-card">
              <span className="mini-card-label">Dimensions / Surface</span>
              <span className="mini-card-val text-blue">
                {stats.dimensions.widthM} × {stats.dimensions.heightM} m
              </span>
              <span className="mini-card-sub">{stats.dimensions.surfaceM2} m² ({stats.hardware.totalTiles} dalles)</span>
            </div>
            <div className="summary-mini-card">
              <span className="mini-card-label">Puissance Max & Ampérage</span>
              <span className="mini-card-val text-amber">
                {stats.hardware.totalMaxPowerW.toLocaleString()} W
              </span>
              <span className="mini-card-sub">{stats.hardware.ampsAssuming230V} A (230V) • {stats.hardware.recommendedCircuits16A} disjoncteurs 16A</span>
            </div>
            <div className="summary-mini-card">
              <span className="mini-card-label">Poids Total Suspendu</span>
              <span className="mini-card-val text-purple">
                {stats.hardware.totalWeightKg} kg
              </span>
              <span className="mini-card-sub">Charge pont / levage</span>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bom-table-container">
            <h4 className="bom-table-title">Détail des Spécifications Techniques</h4>
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Composant / Paramètre</th>
                  <th>Spécification Technique</th>
                  <th style={{ textAlign: 'right' }}>Quantité / Valeur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Dalles LED (Cabinets)</strong></td>
                  <td>{cabinetSpec.name} ({cabinetSpec.width}×{cabinetSpec.height} mm)</td>
                  <td style={{ textAlign: 'right' }}><strong>{stats.hardware.totalTiles}</strong> pièces</td>
                </tr>
                <tr>
                  <td><strong>Pas de Masque (Pixel Pitch)</strong></td>
                  <td>Technologie SMD avec pas physique de {cabinetSpec.pixelPitch} mm</td>
                  <td style={{ textAlign: 'right' }}>{stats.specs.pixelsPerTileW}×{stats.specs.pixelsPerTileH} px / caisson</td>
                </tr>
                <tr>
                  <td><strong>Contrôleur Vidéo (NovaStar / Colorlight)</strong></td>
                  <td>Nombre de sorties Ethernet Gigabit (650 000 px max/port)</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#10b981' }}>{stats.hardware.requiredPortsEth}</strong> port(s) RJ45
                  </td>
                </tr>
                <tr>
                  <td><strong>Distribution Électrique (16A 230V)</strong></td>
                  <td>Lignes d'alimentation dédiées avec protection différentielle 30mA</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#fbbf24' }}>{stats.hardware.recommendedCircuits16A}</strong> ligne(s) 16A
                  </td>
                </tr>
                <tr>
                  <td><strong>Chaînage Électrique (Daisy-Chain)</strong></td>
                  <td>Nombre maximal de caissons par guirlande PowerCon</td>
                  <td style={{ textAlign: 'right' }}>Max {stats.hardware.daisyChainMaxPerCircuit} caissons / ligne</td>
                </tr>
                <tr>
                  <td><strong>Luminosité & Fréquence</strong></td>
                  <td>{cabinetSpec.brightness} • Refresh {cabinetSpec.refreshRate}</td>
                  <td style={{ textAlign: 'right' }}>Indice {cabinetSpec.ipRating}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cabling Port Breakdown */}
          <div className="bom-table-container">
            <h4 className="bom-table-title">Répartition du Câblage Actif</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(signalPaths).map(([port, path]) => {
                const portArea = +(path.length * stats.specs.tileAreaM2).toFixed(2);
                const portPixels = path.length * stats.specs.pixelsPerTileTotal;
                const percent = Math.min(100, Math.round((portPixels / 650000) * 100));
                return (
                  <div key={port} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '13px' }}>Port Data {port}</strong>
                      <span style={{ fontSize: '11px', color: percent > 95 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{percent}%</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {path.length} caissons ({portArea} m²)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {portPixels.toLocaleString()} / 650 000 px
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button
              type="button"
              className={`action-btn btn-secondary ${copied ? 'btn-success' : ''}`}
              onClick={handleCopy}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copié dans le presse-papier !' : 'Copier le texte (WhatsApp/Mail)'}</span>
            </button>
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={handleDownloadJSON}
              title="Télécharger la cartographie pour NovaStar / processeur vidéo"
            >
              <FileCode size={16} />
              <span>Export Mapping JSON</span>
            </button>
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={handleDownloadPNG}
              disabled={isExportingImage}
              title="Télécharger le schéma en image haute résolution PNG"
            >
              <Download size={16} />
              <span>{isExportingImage ? 'Capture en cours...' : 'Image Schéma PNG'}</span>
            </button>
          </div>
          <div className="modal-footer-right">
            <button
              type="button"
              className="action-btn btn-primary"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Imprimer / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
