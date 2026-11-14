/**
 * LED Screen Configurator — Core Calculation & Engineering Logic
 * Moteur de calcul mathématique, photométrique, électrique et réseau
 * pour écrans géants et murs vidéo LED.
 */

export const CABINET_STANDARDS = [
  {
    id: 'p39-outdoor',
    name: 'P3.9 Outdoor (Standard Touring)',
    shortName: 'P3.9',
    width: 500, // mm
    height: 500, // mm
    pixelPitch: 3.91, // mm
    weight: 8.5, // kg
    maxPower: 140, // W max
    avgPower: 50, // W typique
    brightness: '4500 nits (Extérieur Plein Jour)',
    ipRating: 'IP65',
    refreshRate: '3840 Hz'
  },
  {
    id: 'p26-indoor',
    name: 'P2.6 Indoor (Haute Définition)',
    shortName: 'P2.6',
    width: 500,
    height: 500,
    pixelPitch: 2.60,
    weight: 7.5,
    maxPower: 110,
    avgPower: 40,
    brightness: '1200 nits (Intérieur)',
    ipRating: 'IP30',
    refreshRate: '3840 Hz'
  },
  {
    id: 'p48-touring',
    name: 'P4.8 Tour Grade (500×1000 mm)',
    shortName: 'P4.8 (1m)',
    width: 500,
    height: 1000,
    pixelPitch: 4.81,
    weight: 14.0,
    maxPower: 260,
    avgPower: 95,
    brightness: '5000 nits (Extérieur)',
    ipRating: 'IP65',
    refreshRate: '3840 Hz'
  },
  {
    id: 'p19-broadcast',
    name: 'P1.9 Ultra Fine Pitch (Studio TV)',
    shortName: 'P1.9',
    width: 500,
    height: 500,
    pixelPitch: 1.95,
    weight: 7.0,
    maxPower: 100,
    avgPower: 35,
    brightness: '800 nits (Studio / Conférence)',
    ipRating: 'IP30',
    refreshRate: '7680 Hz'
  }
];

export const PORT_COLORS = {
  1: '#10b981', // Vert émeraude
  2: '#3b82f6', // Bleu vif
  3: '#f97316', // Orange
  4: '#a855f7', // Violet
  5: '#ec4899', // Rose
  6: '#06b6d4', // Cyan
  7: '#eab308', // Jaune
  8: '#64748b'  // Ardoise
};

export const POWER_COLORS = {
  1: '#ef4444', // Rouge Circuit 1
  2: '#eab308', // Jaune Circuit 2
  3: '#38bdf8', // Bleu Ciel Circuit 3
  4: '#a855f7'  // Violet Circuit 4
};

export const LAYOUT_PRESETS = [
  {
    name: 'Écran Conférence 3 × 2 m',
    configType: 'Flat',
    faceA: { cols: 6, rows: 4 },
    faceB: { cols: 0, rows: 0 },
    cabinetId: 'p26-indoor',
    desc: 'Format 16:9 compact (1152 × 768 px en P2.6)'
  },
  {
    name: 'Scène Concert 5 × 3 m',
    configType: 'Flat',
    faceA: { cols: 10, rows: 6 },
    faceB: { cols: 0, rows: 0 },
    cabinetId: 'p39-outdoor',
    desc: 'Standard festival (1280 × 768 px en P3.9)'
  },
  {
    name: 'Grand Mur LED 8 × 4.5 m (16:9)',
    configType: 'Flat',
    faceA: { cols: 16, rows: 9 },
    faceB: { cols: 0, rows: 0 },
    cabinetId: 'p39-outdoor',
    desc: 'Grand format 16:9 parfait (2048 × 1152 px)'
  },
  {
    name: 'Scène Immersive en L (Angle 90°)',
    configType: 'L-Shape',
    faceA: { cols: 10, rows: 5 },
    faceB: { cols: 6, rows: 5 },
    cabinetId: 'p39-outdoor',
    desc: 'Face principale 5m + retour latéral 3m'
  },
  {
    name: 'Multi-Écrans DJ Booth & Totems',
    configType: 'Complex',
    screenElements: [
      { id: 'screen-main', name: 'Fond de Scène Principal', x: 200, y: 50, cols: 8, rows: 4 },
      { id: 'screen-dj', name: 'Façade Régie DJ', x: 270, y: 240, cols: 4, rows: 2 },
      { id: 'screen-totem-l', name: 'Totem Gauche (Jardin)', x: 90, y: 70, cols: 2, rows: 5 },
      { id: 'screen-totem-r', name: 'Totem Droit (Cour)', x: 530, y: 70, cols: 2, rows: 5 }
    ],
    cabinetId: 'p39-outdoor',
    desc: 'Configuration scénique 3D déstructurée'
  }
];

/**
 * Calcul complet des caractéristiques physiques, pixels et électriques
 */
export function calculateLedConfig(params = {}) {
  const {
    configType = 'Flat', // 'Flat' | 'L-Shape' | 'Complex'
    faceA = { cols: 6, rows: 4 },
    faceB = { cols: 4, rows: 4 },
    screenElements = [],
    cabinetSpec = CABINET_STANDARDS[0],
    voltage = 230 // Tension secteur standard V
  } = params;

  const tileW = cabinetSpec.width || 500;
  const tileH = cabinetSpec.height || 500;
  const pitch = cabinetSpec.pixelPitch || 3.91;
  const weightPerTile = cabinetSpec.weight || 8.5;
  const maxPowerPerTile = cabinetSpec.maxPower || 140;
  const avgPowerPerTile = cabinetSpec.avgPower || Math.round(maxPowerPerTile * 0.4);

  // Résolution native par caisson (cabinet)
  const pixelsPerTileW = Math.round(tileW / pitch);
  const pixelsPerTileH = Math.round(tileH / pitch);
  const pixelsPerTileTotal = pixelsPerTileW * pixelsPerTileH;
  const tileAreaM2 = (tileW / 1000) * (tileH / 1000);

  // ── 1. CAS COMPLEXE (Multi-écrans) ──
  if (configType === 'Complex' && screenElements.length > 0) {
    let totalTiles = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const processedElements = screenElements.map(el => {
      const cols = Math.max(1, parseInt(el.cols) || 1);
      const rows = Math.max(1, parseInt(el.rows) || 1);
      const w_mm = cols * tileW;
      const h_mm = rows * tileH;
      const resW = cols * pixelsPerTileW;
      const resH = rows * pixelsPerTileH;

      totalTiles += (cols * rows);

      const curX = el.x || 0;
      const curY = el.y || 0;
      const curMaxX = curX + (cols * 35); // 35px par module pour le canvas
      const curMaxY = curY + (rows * 35);

      if (curX < minX) minX = curX;
      if (curY < minY) minY = curY;
      if (curMaxX > maxX) maxX = curMaxX;
      if (curMaxY > maxY) maxY = curMaxY;

      return {
        ...el,
        cols,
        rows,
        dimensions_mm: { w: w_mm, h: h_mm },
        dimensions_m: { w: +(w_mm / 1000).toFixed(2), h: +(h_mm / 1000).toFixed(2) },
        resolution: { w: resW, h: resH, total: resW * resH },
        surfaceM2: +(cols * rows * tileAreaM2).toFixed(2),
        tilesCount: cols * rows
      };
    });

    const totalSurfaceM2 = +(totalTiles * tileAreaM2).toFixed(2);
    const totalWeightKg = +(totalTiles * weightPerTile).toFixed(1);
    const totalMaxPowerW = Math.round(totalTiles * maxPowerPerTile);
    const totalAvgPowerW = Math.round(totalTiles * avgPowerPerTile);
    const totalAmps230V = +(totalMaxPowerW / voltage).toFixed(1);

    // Bounding Box pixels
    const totalW_px = processedElements.reduce((acc, el) => Math.max(acc, el.resolution.w), 0);
    const totalH_px = processedElements.reduce((acc, el) => acc + el.resolution.h, 0);

    const requiredPortsEth = Math.max(1, Math.ceil((totalTiles * pixelsPerTileTotal) / 650000));
    const recommendedCircuits16A = Math.max(1, Math.ceil(totalMaxPowerW / 3000));

    return {
      configType: 'Complex',
      totalTiles,
      specs: {
        pixelsPerTileW,
        pixelsPerTileH,
        pixelsPerTileTotal,
        tileAreaM2
      },
      dimensions: {
        totalWidth_mm: processedElements.reduce((acc, el) => acc + el.dimensions_mm.w, 0),
        totalHeight_mm: processedElements.reduce((acc, el) => Math.max(acc, el.dimensions_mm.h), 0),
        surfaceM2: totalSurfaceM2
      },
      resolution: {
        totalW: totalW_px,
        totalH: totalH_px,
        totalPixels: totalTiles * pixelsPerTileTotal,
        aspectRatio: `${+(totalW_px / (totalH_px || 1)).toFixed(2)}:1`
      },
      screenElements: processedElements,
      hardware: {
        totalTiles,
        totalWeightKg,
        totalMaxPowerW,
        totalAvgPowerW,
        ampsAssuming240V: totalAmps230V,
        ampsAssuming230V: totalAmps230V,
        requiredPortsEth,
        recommendedCircuits16A,
        daisyChainMaxPerCircuit: Math.max(1, Math.floor(3000 / maxPowerPerTile))
      }
    };
  }

  // ── 2. CAS STANDARD (Flat Wall ou L-Shape) ──
  const colsA = Math.max(1, parseInt(faceA.cols) || 1);
  const rowsA = Math.max(1, parseInt(faceA.rows) || 1);
  const colsB = configType === 'L-Shape' ? Math.max(1, parseInt(faceB.cols) || 1) : 0;
  const rowsB = configType === 'L-Shape' ? rowsA : 0; // En L-Shape, la hauteur du retour est alignée

  const resA_W = colsA * pixelsPerTileW;
  const resA_H = rowsA * pixelsPerTileH;
  const resB_W = colsB * pixelsPerTileW;
  const resB_H = rowsB * pixelsPerTileH;

  const totalTilesA = colsA * rowsA;
  const totalTilesB = colsB * rowsB;
  const totalTiles = totalTilesA + totalTilesB;

  const widthA_mm = colsA * tileW;
  const heightA_mm = rowsA * tileH;
  const widthB_mm = colsB * tileW;
  const totalWidth_mm = widthA_mm + widthB_mm;
  const totalHeight_mm = heightA_mm;

  const totalSurfaceM2 = +(totalTiles * tileAreaM2).toFixed(2);
  const totalWeightKg = +(totalTiles * weightPerTile).toFixed(1);
  const totalMaxPowerW = Math.round(totalTiles * maxPowerPerTile);
  const totalAvgPowerW = Math.round(totalTiles * avgPowerPerTile);
  const totalAmps230V = +(totalMaxPowerW / voltage).toFixed(1);

  const totalResolutionW = resA_W + resB_W;
  const totalResolutionH = Math.max(resA_H, resB_H);
  const totalPixels = totalTiles * pixelsPerTileTotal;

  // Calcul du ratio d'aspect
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(totalResolutionW, totalResolutionH);
  const ratioX = Math.round(totalResolutionW / divisor);
  const ratioY = Math.round(totalResolutionH / divisor);
  const is16by9 = Math.abs((totalResolutionW / totalResolutionH) - (16 / 9)) < 0.05;
  const is4by3 = Math.abs((totalResolutionW / totalResolutionH) - (4 / 3)) < 0.05;

  // Ports réseau Gigabit (Capacité standard max 650,000 pixels @ 60Hz)
  const requiredPortsEth = Math.max(1, Math.ceil(totalPixels / 650000));
  // Circuits 16A 230V (Recommandation max 3000W par disjoncteur 16A)
  const recommendedCircuits16A = Math.max(1, Math.ceil(totalMaxPowerW / 3000));
  const daisyChainMaxPerCircuit = Math.max(1, Math.floor(3000 / maxPowerPerTile));

  return {
    configType,
    specs: {
      pixelsPerTileW,
      pixelsPerTileH,
      pixelsPerTileTotal,
      tileAreaM2
    },
    dimensions: {
      faceA_mm: { w: widthA_mm, h: heightA_mm },
      faceB_mm: { w: widthB_mm, h: heightA_mm },
      totalWidth_mm,
      totalHeight_mm,
      widthM: +(totalWidth_mm / 1000).toFixed(2),
      heightM: +(totalHeight_mm / 1000).toFixed(2),
      surfaceM2: totalSurfaceM2
    },
    resolution: {
      faceA: { w: resA_W, h: resA_H, pixels: totalTilesA * pixelsPerTileTotal },
      faceB: { w: resB_W, h: resB_H, pixels: totalTilesB * pixelsPerTileTotal },
      totalW: totalResolutionW,
      totalH: totalResolutionH,
      totalPixels,
      aspectRatio: is16by9 ? '16:9 (Standard Vidéo)' : is4by3 ? '4:3' : `${+(totalResolutionW / totalResolutionH).toFixed(2)}:1 (${ratioX}:${ratioY})`
    },
    hardware: {
      totalTiles,
      tilesFaceA: totalTilesA,
      tilesFaceB: totalTilesB,
      totalWeightKg,
      totalMaxPowerW,
      totalAvgPowerW,
      ampsAssuming240V: totalAmps230V,
      ampsAssuming230V: totalAmps230V,
      requiredPortsEth,
      recommendedCircuits16A,
      daisyChainMaxPerCircuit
    }
  };
}

/**
 * Générateur automatique de chemin de câblage Snake (Zig-Zag)
 */
export function generateSnakeRoute({ direction = 'horizontal', faceName, cols, rows, existingPaths = [] }) {
  const newPath = [];

  if (direction === 'horizontal') {
    for (let r = 1; r <= rows; r++) {
      const isEven = r % 2 === 0;
      for (let c = 1; c <= cols; c++) {
        const actualCol = isEven ? (cols - c + 1) : c;
        const occupied = existingPaths.some(p => p.face === faceName && p.col === actualCol && p.row === r);
        if (!occupied) {
          newPath.push({
            face: faceName,
            col: actualCol,
            row: r,
            id: `${faceName}-${actualCol}-${r}`
          });
        }
      }
    }
  } else {
    // vertical snake
    for (let c = 1; c <= cols; c++) {
      const isEven = c % 2 === 0;
      for (let r = 1; r <= rows; r++) {
        const actualRow = isEven ? (rows - r + 1) : r;
        const occupied = existingPaths.some(p => p.face === faceName && p.col === c && p.row === actualRow);
        if (!occupied) {
          newPath.push({
            face: faceName,
            col: c,
            row: actualRow,
            id: `${faceName}-${c}-${actualRow}`
          });
        }
      }
    }
  }

  return newPath;
}
