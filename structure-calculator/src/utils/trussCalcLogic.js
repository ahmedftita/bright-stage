/**
 * Bright Stage — Structure & Truss Calculation Logic
 * Mathematical engine for Truss Grid & Goalpost modular stage structures.
 */

export const TRUSS_SERIES = {
  PT34: {
    id: 'PT34',
    name: 'PT34 (Standard 290)',
    shortName: 'PT34 (290)',
    sectionSize: 0.29,
    sectionWidth: 0.29,
    sectionHeight: 0.29,
    weightPerMeter: 4.8,
    tubeSpecs: 'Ø 50 × 2 mm (Braces Ø 20 × 2 mm)',
    conicalType: 'CCS6 Conique avec goupilles & clips',
    maxPointLoad_6m: 688,
    maxSpan: 12,
    isHeavyDuty: false,
    isMonumental: false,
    udlLimit: { 4: 390, 8: 130, 12: 53 } // kg/m
  },
  FT44: {
    id: 'FT44',
    name: 'FT44 (Standard 400)',
    shortName: 'FT44 (400)',
    sectionSize: 0.40,
    sectionWidth: 0.40,
    sectionHeight: 0.40,
    weightPerMeter: 6.8,
    tubeSpecs: 'Ø 50 × 2 mm (Braces Ø 25 × 2 mm)',
    conicalType: 'CCS7 Conique renforcé',
    maxPointLoad_6m: 823,
    maxSpan: 16,
    isHeavyDuty: false,
    isMonumental: false,
    udlLimit: { 4: 800, 8: 200, 12: 100, 16: 50 }
  },
  HT44: {
    id: 'HT44',
    name: 'HT44 (Heavy Duty 400)',
    shortName: 'HT44 (Heavy 400)',
    sectionSize: 0.40,
    sectionWidth: 0.40,
    sectionHeight: 0.40,
    weightPerMeter: 8.2,
    tubeSpecs: 'Ø 50 × 3 mm (Braces Ø 25 × 3 mm)',
    conicalType: 'CCS7 Heavy Duty',
    maxPointLoad_6m: 1252,
    maxSpan: 16,
    isHeavyDuty: true,
    isMonumental: false,
    udlLimit: { 4: 901, 8: 243, 12: 112, 16: 61 }
  },
  TT104: {
    id: 'TT104',
    name: 'TT104 (Monumental 1010)',
    shortName: 'TT104 (Monumental)',
    sectionSize: 1.01,
    sectionWidth: 0.58,
    sectionHeight: 1.01,
    weightPerMeter: 70.0,
    tubeSpecs: 'Ø 60 × 5 mm (Braces Ø 30 × 3 mm)',
    conicalType: 'CCS7-Heavy Monumental boulonné',
    maxPointLoad_6m: 5000,
    maxSpan: 40,
    isHeavyDuty: true,
    isMonumental: true,
    udlLimit: { 10: 2000, 20: 1000, 30: 500, 40: 250 }
  }
};

/**
 * Optimizes linear distance into standard truss modular segment lengths:
 * 3.00m, 2.00m, 1.00m, 0.50m
 */
export const calcSegments = (distance) => {
  let rem = Math.max(0, distance);
  const s3 = Math.floor(rem / 3);
  rem = parseFloat((rem % 3).toFixed(2));

  const s2 = Math.floor(rem / 2);
  rem = parseFloat((rem % 2).toFixed(2));

  const s1 = Math.floor(rem / 1);
  rem = parseFloat((rem % 1).toFixed(2));

  const s05 = rem >= 0.45 ? 1 : 0;

  return { s3, s2, s1, s05 };
};

/**
 * Height segments calculation with tower base section alignment
 */
export const calcTowerSegments = (height) => {
  let rem = Math.max(0, height);
  let s1_base = 0;
  let s05_base = 0;

  const isInt = Number.isInteger(height);
  const isHalf = Math.abs((height % 1) - 0.5) < 0.1;

  if (isInt && height >= 1) {
    s1_base = 1;
    rem = height - 1;
  } else if (isHalf && height >= 0.5) {
    s05_base = 1;
    rem = height - 0.5;
  }

  const rest = calcSegments(rem);
  return {
    s3: rest.s3,
    s2: rest.s2,
    s1: rest.s1 + s1_base,
    s05: rest.s05 + s05_base
  };
};

/**
 * Parses user input for multiple spans or single span
 */
export const parseSpans = (input) => {
  if (typeof input === 'number') return [Math.max(1, input)];
  const str = String(input).replace(/,/g, ' ').trim();
  const parts = str.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
  return parts.length > 0 ? parts : [parseFloat(input) || 6];
};

/**
 * Splits spans if they exceed maximum structural truss limit
 */
export const splitSpans = (spans, maxLimit) => {
  const newSpans = [];
  const limit = maxLimit || 12;
  spans.forEach(span => {
    if (span > limit) {
      const numSplits = Math.ceil(span / limit);
      const segLen = parseFloat((span / numSplits).toFixed(2));
      for (let i = 0; i < numSplits; i++) {
        newSpans.push(segLen);
      }
    } else {
      newSpans.push(span);
    }
  });
  return newSpans;
};

/**
 * Main structural and load calculation engine
 */
export const calculateStructure = (config) => {
  const {
    structureType = 'grid',
    towerType = 'PT34',
    gridTypeL = 'PT34',
    gridTypeW = 'PT34',
    length = 8,
    width = 6,
    height = 6,
    ledWeight = 500
  } = config;

  const isGoalpost = structureType === 'goalpost';

  // Tower series resolution
  const isMonumental = TRUSS_SERIES[towerType]?.isMonumental;
  const actualTowerType = isMonumental ? towerType : (TRUSS_SERIES[towerType] ? towerType : 'PT34');
  const towSpec = TRUSS_SERIES[actualTowerType] || TRUSS_SERIES.PT34;

  // Grid series resolution
  const getGridType = (inputSpan, currentType) => {
    if (TRUSS_SERIES[currentType]?.isMonumental) return currentType;
    if (inputSpan > 12 && currentType === 'PT34') return 'HT44'; // Auto switch to Heavy Duty if span exceeds PT34
    return TRUSS_SERIES[currentType] ? currentType : 'PT34';
  };

  const rawLenSpans = parseSpans(length);
  const rawWidSpans = parseSpans(width);

  const maxL = Math.max(...rawLenSpans);
  const maxW = Math.max(...rawWidSpans);

  const actualGridTypeL = getGridType(maxL, gridTypeL);
  const actualGridTypeW = getGridType(maxW, gridTypeW);

  const gridSpecL = TRUSS_SERIES[actualGridTypeL] || TRUSS_SERIES.PT34;
  const gridSpecW = TRUSS_SERIES[actualGridTypeW] || TRUSS_SERIES.PT34;

  const lenSpans = splitSpans(rawLenSpans, gridSpecL.maxSpan);
  const widSpans = splitSpans(rawWidSpans, gridSpecW.maxSpan);

  let numTowers = 0;
  let numBeamsL = 0;
  let numBeamsW = 0;

  if (isGoalpost) {
    numTowers = 2;
    numBeamsL = 1;
    numBeamsW = 0;
  } else {
    const towersL = lenSpans.length + 1;
    const towersW = widSpans.length + 1;
    numTowers = towersL * towersW;
    numBeamsL = towersW;
    numBeamsW = towersL;
  }

  const numLinesL = lenSpans.length + 1;
  const numLinesW = widSpans.length + 1;

  // Modular segments total counts
  const totals = { s3: 0, s2: 0, s1: 0, s05: 0 };

  // 1. Length Beams
  lenSpans.forEach(span => {
    const segs = calcSegments(span);
    totals.s3 += segs.s3 * numBeamsL;
    totals.s2 += segs.s2 * numBeamsL;
    totals.s1 += segs.s1 * numBeamsL;
    totals.s05 += segs.s05 * numBeamsL;
  });

  // 2. Width Beams (if grid)
  if (!isGoalpost) {
    widSpans.forEach(span => {
      const segs = calcSegments(span);
      totals.s3 += segs.s3 * numBeamsW;
      totals.s2 += segs.s2 * numBeamsW;
      totals.s1 += segs.s1 * numBeamsW;
      totals.s05 += segs.s05 * numBeamsW;
    });
  }

  // 3. Tower Segments
  const hgtSegs = calcTowerSegments(height);
  totals.s3 += hgtSegs.s3 * numTowers;
  totals.s2 += hgtSegs.s2 * numTowers;
  totals.s1 += hgtSegs.s1 * numTowers;
  totals.s05 += hgtSegs.s05 * numTowers;

  // 4. Outriggers for Goalpost
  const outriggerLen = 2;
  const numOutriggers = isGoalpost ? 4 : 0;
  if (isGoalpost) {
    const outSegs = calcSegments(outriggerLen);
    totals.s3 += outSegs.s3 * numOutriggers;
    totals.s2 += outSegs.s2 * numOutriggers;
    totals.s1 += outSegs.s1 * numOutriggers;
    totals.s05 += outSegs.s05 * numOutriggers;
  }

  // 5. Junctions & Accessories
  let corners = 0;
  let tJunctions = 0;
  let xJunctions = 0;

  if (isGoalpost) {
    corners = 2;
  } else {
    corners = 4;
    if (numLinesL > 2 || numLinesW > 2) {
      const innerL = Math.max(0, numLinesL - 2);
      const innerW = Math.max(0, numLinesW - 2);
      tJunctions = (innerL * 2) + (innerW * 2);
      xJunctions = innerL * innerW;
    }
  }

  totals.corners = corners;
  totals.tJunctions = tJunctions;
  totals.xJunctions = xJunctions;
  totals.bases = numTowers;
  totals.hinges = numTowers * 4;
  totals.motors = numTowers;

  // 6. Weight Analysis
  const actualLenTotal = lenSpans.reduce((a, b) => a + b, 0);
  const actualWidTotal = widSpans.reduce((a, b) => a + b, 0);

  const linearMetersL = actualLenTotal * (isGoalpost ? 1 : numLinesW);
  const linearMetersW = isGoalpost ? 0 : (actualWidTotal * numLinesL);
  const linearMetersH = height * numTowers;
  const linearMetersOut = outriggerLen * numOutriggers;

  const towerWeight = (linearMetersH + linearMetersOut) * towSpec.weightPerMeter;
  const gridWeight = (linearMetersL * gridSpecL.weightPerMeter) + (linearMetersW * gridSpecW.weightPerMeter);
  const aluWeight = Math.round((towerWeight + gridWeight) * 10) / 10;

  // 7. Safety & Overload Check
  const calcSafety = (loadKg, span, spec) => {
    if (!spec.udlLimit) return { limit: 1000, status: 'ok', color: '#10b981', ratio: 0.1 };
    const chartSpans = Object.keys(spec.udlLimit).map(Number).sort((a, b) => a - b);
    const validSpan = chartSpans.find(s => s >= span);
    if (!validSpan) {
      return { limit: 0, status: 'critical', color: '#ef4444', isOverLimit: true, ratio: 2.0 };
    }
    const limit = spec.udlLimit[validSpan];
    const loadPerMeter = span > 0 ? (loadKg / span) : 0;
    const ratio = limit > 0 ? (loadPerMeter / limit) : 0;

    let color = '#10b981';
    let status = 'ok';
    if (ratio > 1.0) {
      color = '#ef4444';
      status = 'overload';
    } else if (ratio > 0.8) {
      color = '#f59e0b';
      status = 'warning';
    }
    return { limit, ratio, color, status };
  };

  const totalLinear = (actualLenTotal * (isGoalpost ? 1 : numLinesW)) + (isGoalpost ? 0 : (actualWidTotal * numLinesL));
  const loadPerMeterAvg = (ledWeight || 0) / (totalLinear || 1);

  const safeL = calcSafety(loadPerMeterAvg * Math.max(...lenSpans), Math.max(...lenSpans), gridSpecL);
  const safeW = isGoalpost ? { limit: 0, ratio: 0, color: '#10b981', status: 'ok' } : calcSafety(loadPerMeterAvg * Math.max(...widSpans), Math.max(...widSpans), gridSpecW);

  const totalLoad = Math.round((aluWeight + (ledWeight || 0)) * 10) / 10;
  const pointLoad = Math.round((totalLoad / (numTowers || 1)) * 10) / 10;
  const pointLoadLimit = towSpec.maxPointLoad_6m;
  const loadPercentage = Math.min(100, Math.round(((pointLoad / pointLoadLimit) * 100) * 10) / 10);

  const maxInputL = Math.max(...lenSpans);
  const maxInputW = Math.max(...widSpans);
  const spanErrorL = maxInputL > gridSpecL.maxSpan;
  const spanErrorW = !isGoalpost && (maxInputW > gridSpecW.maxSpan);

  const isOverload = pointLoad > pointLoadLimit || spanErrorL || spanErrorW || safeL.status === 'overload' || safeW.status === 'overload';

  // 8. Bill of Materials (BOM) Detailed List
  const equipmentBOM = [
    {
      id: 'seg_3m',
      category: 'Poutres Aluminium',
      name: `Poutre Truss 3.00m (${gridSpecL.name})`,
      spec: `Longueur 3000 mm • Tube Ø ${gridSpecL.tubeSpecs} • Raccord CCS`,
      quantity: totals.s3,
      unitWeightKg: Math.round(3 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(totals.s3 * 3 * gridSpecL.weightPerMeter * 10) / 10
    },
    {
      id: 'seg_2m',
      category: 'Poutres Aluminium',
      name: `Poutre Truss 2.00m (${gridSpecL.name})`,
      spec: `Longueur 2000 mm • Tube Ø ${gridSpecL.tubeSpecs} • Raccord CCS`,
      quantity: totals.s2,
      unitWeightKg: Math.round(2 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(totals.s2 * 2 * gridSpecL.weightPerMeter * 10) / 10
    },
    {
      id: 'seg_1m',
      category: 'Poutres Aluminium',
      name: `Poutre Truss 1.00m (${gridSpecL.name})`,
      spec: `Longueur 1000 mm • Tube Ø ${gridSpecL.tubeSpecs} • Raccord CCS`,
      quantity: totals.s1,
      unitWeightKg: Math.round(1 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(totals.s1 * 1 * gridSpecL.weightPerMeter * 10) / 10
    },
    ...(totals.s05 > 0 ? [{
      id: 'seg_05m',
      category: 'Poutres Aluminium',
      name: `Poutre Truss 0.50m (${gridSpecL.name})`,
      spec: `Longueur 500 mm • Tube Ø ${gridSpecL.tubeSpecs} • Raccord CCS`,
      quantity: totals.s05,
      unitWeightKg: Math.round(0.5 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(totals.s05 * 0.5 * gridSpecL.weightPerMeter * 10) / 10
    }] : []),
    {
      id: 'corner_box',
      category: 'Jonctions & Angles',
      name: `Box Corner Multidirectionnel / Angle 90° (${gridSpecL.name})`,
      spec: `Cube jonction aluminium haute résistance pour assemblage 2D/3D`,
      quantity: totals.corners,
      unitWeightKg: 9.5,
      totalWeightKg: Math.round(totals.corners * 9.5 * 10) / 10
    },
    ...(totals.tJunctions > 0 ? [{
      id: 't_junc',
      category: 'Jonctions & Angles',
      name: `Jonction en T 3 Voies (${gridSpecL.name})`,
      spec: `Raccord en T pour traverses intérieures et renforts de gril`,
      quantity: totals.tJunctions,
      unitWeightKg: 10.2,
      totalWeightKg: Math.round(totals.tJunctions * 10.2 * 10) / 10
    }] : []),
    ...(totals.xJunctions > 0 ? [{
      id: 'x_junc',
      category: 'Jonctions & Angles',
      name: `Jonction en Croix 4 Voies (Cross)`,
      spec: `Croisement central pour gril multi-portées`,
      quantity: totals.xJunctions,
      unitWeightKg: 12.0,
      totalWeightKg: Math.round(totals.xJunctions * 12.0 * 10) / 10
    }] : []),
    {
      id: 'base_plate',
      category: 'Embases & Stabilité',
      name: `Embase Lourde Acier (Base Plate)`,
      spec: `Plaque acier lestée 600×600×10 mm avec récepteurs demi-manchons`,
      quantity: totals.bases,
      unitWeightKg: 28.0,
      totalWeightKg: totals.bases * 28.0
    },
    {
      id: 'hinge_sleeve',
      category: 'Levage & Charnières',
      name: `Manchon Charnière de Tour (Hinges)`,
      spec: `Charnières de basculement pour montage au sol et érection sécurisée`,
      quantity: totals.hinges,
      unitWeightKg: 1.5,
      totalWeightKg: Math.round(totals.hinges * 1.5 * 10) / 10
    },
    {
      id: 'chain_motor',
      category: 'Levage & Motorisation',
      name: `Palan à Chaîne Électrique 1 Tonne (1000 kg)`,
      spec: `Moteur BGV-C1 / D8+ avec chaîne de levage calibrée 24m`,
      quantity: totals.motors,
      unitWeightKg: 45.0,
      totalWeightKg: totals.motors * 45.0
    }
  ].filter(i => i.quantity > 0);

  return {
    config: {
      structureType,
      towerType: actualTowerType,
      gridTypeL: actualGridTypeL,
      gridTypeW: actualGridTypeW,
      length: actualLenTotal,
      width: actualWidTotal,
      height,
      ledWeight
    },
    totals,
    towSpec,
    gridSpecL,
    gridSpecW,
    lenSpans,
    widSpans,
    numTowers,
    numBeamsL,
    numBeamsW,
    linearMeters: {
      length: linearMetersL,
      width: linearMetersW,
      height: linearMetersH,
      outriggers: linearMetersOut,
      total: linearMetersL + linearMetersW + linearMetersH + linearMetersOut
    },
    aluWeight,
    totalLoad,
    pointLoad,
    pointLoadLimit,
    loadPercentage,
    isOverload,
    spanErrorL,
    spanErrorW,
    safetyL: safeL,
    safetyW: safeW,
    equipmentBOM
  };
};
