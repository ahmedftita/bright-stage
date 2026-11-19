/**
 * Bright Stage — Full Stage Conception Logic
 * Unified calculation engine combining:
 * 1. Stage (Podium modulaire 1.22m)
 * 2. Structure (Truss Pont aluminium)
 * 3. LED Screen (Mur d'images)
 * 4. Lighting (Éclairage de scène & asservis)
 */

export const MODULE_SIZE = 1.22; // Standard module 1.22m x 1.22m
export const MODULE_AREA = 1.4884; // 1.22 * 1.22 m²

export const STAGE_HEIGHTS = {
  h55: { id: 'h55', label: '55 cm (0.55 m)', heightM: 0.55, steps: 2 },
  h75: { id: 'h75', label: '75 cm (0.75 m)', heightM: 0.75, steps: 3 },
  h100: { id: 'h100', label: '100 cm (1.00 m)', heightM: 1.00, steps: 4 }
};

export const TRUSS_SERIES = {
  PT34: {
    id: 'PT34',
    name: 'PT34 (Standard 290)',
    sectionSize: 0.29,
    weightPerMeter: 4.8,
    tubeSpecs: 'Ø 50 × 2 mm',
    maxSpan: 12,
    maxPointLoad_6m: 688
  },
  FT44: {
    id: 'FT44',
    name: 'FT44 (Standard 400)',
    sectionSize: 0.40,
    weightPerMeter: 6.8,
    tubeSpecs: 'Ø 50 × 2 mm',
    maxSpan: 16,
    maxPointLoad_6m: 823
  },
  HT44: {
    id: 'HT44',
    name: 'HT44 (Heavy Duty 400)',
    sectionSize: 0.40,
    weightPerMeter: 8.2,
    tubeSpecs: 'Ø 50 × 3 mm',
    maxSpan: 16,
    maxPointLoad_6m: 1252
  },
  TT104: {
    id: 'TT104',
    name: 'TT104 (Monumental 1010)',
    sectionSize: 1.01,
    weightPerMeter: 70.0,
    tubeSpecs: 'Ø 60 × 5 mm',
    maxSpan: 40,
    maxPointLoad_6m: 5000
  }
};

export const LED_PITCHES = {
  'P2.6': { pitchMm: 2.6, density: 147456, maxWattsM2: 550, avgWattsM2: 280, kgM2: 32, indoor: true },
  'P2.9': { pitchMm: 2.9, density: 112896, maxWattsM2: 500, avgWattsM2: 260, kgM2: 30, indoor: true },
  'P3.9': { pitchMm: 3.9, density: 65536, maxWattsM2: 480, avgWattsM2: 240, kgM2: 28, outdoor: true },
  'P4.8': { pitchMm: 4.8, density: 43264, maxWattsM2: 450, avgWattsM2: 220, kgM2: 26, outdoor: true }
};

export const LIGHTING_SPECS = {
  beam: { name: 'Moving Head Beam 7R (300W)', weightKg: 16, watts: 300, dmx: 16, type: 'beam' },
  spot: { name: 'Moving Head Spot Profile LED (350W)', weightKg: 22, watts: 350, dmx: 22, type: 'spot' },
  wash: { name: 'Moving Head Wash LED RGBW 19×15W', weightKg: 12, watts: 300, dmx: 18, type: 'wash' },
  ledBar: { name: 'Barre LED Pixel / Sunstrip (1m)', weightKg: 6, watts: 120, dmx: 10, type: 'bar' },
  blinder: { name: 'Projecteur Blinder 4-Lite DWE (2600W)', weightKg: 8, watts: 2600, dmx: 4, type: 'blinder' },
  hazer: { name: 'Machine à Brouillard / Hazer Pro (1500W)', weightKg: 15, watts: 1500, dmx: 2, type: 'hazer' }
};

/**
 * Modular segment helper for truss spans
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
 * Complete Full Stage Calculation Engine
 */
export const calculateFullConception = (state) => {
  const {
    stage = {},
    structure = {},
    screen = {},
    lighting = {}
  } = state;

  // ==========================================
  // 1. STAGE (SCÈNE) CALCULATIONS
  // ==========================================
  const L = Math.max(1, parseInt(stage.lengthModules) || 6);
  const l = Math.max(1, parseInt(stage.widthModules) || 4);
  const heightId = stage.heightId || 'h75';
  const heightSpec = STAGE_HEIGHTS[heightId] || STAGE_HEIGHTS.h75;
  const heightM = heightSpec.heightM;

  const lengthM = parseFloat((L * MODULE_SIZE).toFixed(2));
  const widthM = parseFloat((l * MODULE_SIZE).toFixed(2));
  const surfaceM2 = parseFloat((L * l * MODULE_AREA).toFixed(2));

  const stagePlaques = L * l;
  const stagePieds = (L + 1) * (l + 1);
  const stageCotes = L * (l + 1) + l * (L + 1);
  const hasStairs = stage.hasStairs !== false;
  const stairsCount = hasStairs ? (parseInt(stage.stairsCount) || 1) : 0;
  const stairSteps = hasStairs ? heightSpec.steps : 0;
  const stairsSide = stage.stairsSide || 'right'; // 'right', 'left', 'both'

  const stagePlaquesWeight = stagePlaques * 25.4;
  const stagePiedsWeight = stagePieds * 2.8;
  const stageCotesWeight = stageCotes * 4.2;
  const stairsWeight = stairsCount * (15 + stairSteps * 4);
  const stageTotalWeightKg = Math.round(stagePlaquesWeight + stagePiedsWeight + stageCotesWeight + stairsWeight);
  const admissibleStageLoadKg = Math.round(surfaceM2 * 750); // Norm 750 kg/m²

  // ==========================================
  // 2. STRUCTURE (TRUSS) CALCULATIONS
  // ==========================================
  const structType = structure.structureType || 'grid'; // 'grid' or 'goalpost'
  const isGoalpost = structType === 'goalpost';
  const structL = Math.max(4, parseFloat(structure.length) || (lengthM + 2)); // default stage + 2m
  const structW = isGoalpost ? 4 : Math.max(4, parseFloat(structure.width) || (widthM + 2));
  const structH = Math.max(4, parseFloat(structure.height) || 6); // clearance height

  const towerType = structure.towerType || 'PT34';
  const gridTypeL = structure.gridTypeL || 'HT44';
  const gridTypeW = structure.gridTypeW || 'PT34';

  const towSpec = TRUSS_SERIES[towerType] || TRUSS_SERIES.PT34;
  const gridSpecL = TRUSS_SERIES[gridTypeL] || TRUSS_SERIES.HT44;
  const gridSpecW = TRUSS_SERIES[gridTypeW] || TRUSS_SERIES.PT34;

  const numTowers = isGoalpost ? 2 : 4;
  const numBeamsL = isGoalpost ? 1 : 2;
  const numBeamsW = isGoalpost ? 0 : 2;

  const segsL = calcSegments(structL);
  const segsW = isGoalpost ? { s3: 0, s2: 0, s1: 0, s05: 0 } : calcSegments(structW);
  const segsH = calcSegments(structH);
  const outriggerSegs = isGoalpost ? calcSegments(2) : { s3: 0, s2: 0, s1: 0, s05: 0 };
  const numOutriggers = isGoalpost ? 4 : 0;

  const trussTotals = {
    s3: (segsL.s3 * numBeamsL) + (segsW.s3 * numBeamsW) + (segsH.s3 * numTowers) + (outriggerSegs.s3 * numOutriggers),
    s2: (segsL.s2 * numBeamsL) + (segsW.s2 * numBeamsW) + (segsH.s2 * numTowers) + (outriggerSegs.s2 * numOutriggers),
    s1: (segsL.s1 * numBeamsL) + (segsW.s1 * numBeamsW) + (segsH.s1 * numTowers) + (outriggerSegs.s1 * numOutriggers),
    s05: (segsL.s05 * numBeamsL) + (segsW.s05 * numBeamsW) + (segsH.s05 * numTowers) + (outriggerSegs.s05 * numOutriggers),
    corners: isGoalpost ? 2 : 4,
    bases: numTowers,
    hinges: numTowers * 4,
    motors: numTowers
  };

  const linearMetersL = structL * numBeamsL;
  const linearMetersW = structW * numBeamsW;
  const linearMetersH = structH * numTowers;
  const linearMetersOut = isGoalpost ? (2 * 4) : 0;

  const towerWeight = (linearMetersH + linearMetersOut) * towSpec.weightPerMeter;
  const gridWeight = (linearMetersL * gridSpecL.weightPerMeter) + (linearMetersW * gridSpecW.weightPerMeter);
  const aluWeight = Math.round(towerWeight + gridWeight);

  // ==========================================
  // 3. ÉCRAN LED (LED SCREEN) CALCULATIONS
  // ==========================================
  const pitchKey = screen.pitch || 'P3.9';
  const pitchSpec = LED_PITCHES[pitchKey] || LED_PITCHES['P3.9'];
  const cabW = Math.max(2, parseInt(screen.cabinetsW) || 12);
  const cabH = Math.max(2, parseInt(screen.cabinetsH) || 6);
  const mountType = screen.mountType || 'suspended_truss'; // 'suspended_truss' or 'ground_stack'

  const screenWidthM = parseFloat((cabW * 0.5).toFixed(2));
  const screenHeightM = parseFloat((cabH * 0.5).toFixed(2));
  const screenAreaM2 = parseFloat((screenWidthM * screenHeightM).toFixed(2));

  const totalCabinets = cabW * cabH;
  const totalPixels = Math.round(screenAreaM2 * pitchSpec.density);
  const screenWeightKg = Math.round(screenAreaM2 * pitchSpec.kgM2);
  const screenPowerKw = parseFloat(((screenAreaM2 * pitchSpec.maxWattsM2) / 1000).toFixed(1));

  // ==========================================
  // 4. LUMIÈRE (LIGHTING) CALCULATIONS
  // ==========================================
  const beamsCount = Math.max(0, parseInt(lighting.beamsCount ?? 8));
  const spotsCount = Math.max(0, parseInt(lighting.spotsCount ?? 6));
  const washesCount = Math.max(0, parseInt(lighting.washesCount ?? 8));
  const ledBarsCount = Math.max(0, parseInt(lighting.ledBarsCount ?? 6));
  const blindersCount = Math.max(0, parseInt(lighting.blindersCount ?? 4));
  const hazerCount = Math.max(0, parseInt(lighting.hazerCount ?? 2));
  const showBeams = lighting.showBeams !== false;
  const beamColor = lighting.beamColor || '#38bdf8';

  const totalFixtures = beamsCount + spotsCount + washesCount + ledBarsCount + blindersCount + hazerCount;

  const totalLightingWeightKg = Math.round(
    (beamsCount * LIGHTING_SPECS.beam.weightKg) +
    (spotsCount * LIGHTING_SPECS.spot.weightKg) +
    (washesCount * LIGHTING_SPECS.wash.weightKg) +
    (ledBarsCount * LIGHTING_SPECS.ledBar.weightKg) +
    (blindersCount * LIGHTING_SPECS.blinder.weightKg) +
    (hazerCount * LIGHTING_SPECS.hazer.weightKg)
  );
  const lightingWeightKg = totalLightingWeightKg;

  const lightingPowerWatts = (
    (beamsCount * LIGHTING_SPECS.beam.watts) +
    (spotsCount * LIGHTING_SPECS.spot.watts) +
    (washesCount * LIGHTING_SPECS.wash.watts) +
    (ledBarsCount * LIGHTING_SPECS.ledBar.watts) +
    (blindersCount * LIGHTING_SPECS.blinder.watts) +
    (hazerCount * LIGHTING_SPECS.hazer.watts)
  );
  const totalLightingPowerKw = parseFloat((lightingPowerWatts / 1000).toFixed(1));
  const lightingPowerKw = totalLightingPowerKw;

  const totalDmxChannels = (
    (beamsCount * LIGHTING_SPECS.beam.dmx) +
    (spotsCount * LIGHTING_SPECS.spot.dmx) +
    (washesCount * LIGHTING_SPECS.wash.dmx) +
    (ledBarsCount * LIGHTING_SPECS.ledBar.dmx) +
    (blindersCount * LIGHTING_SPECS.blinder.dmx) +
    (hazerCount * LIGHTING_SPECS.hazer.dmx)
  );
  const dmxUniverses = Math.ceil(totalDmxChannels / 512) || 1;

  // ==========================================
  // 5. TOTAL RIGGING & STRUCTURAL SAFETY
  // ==========================================
  const cablesAndMotorsWeight = 120 + (numTowers * 45); // Cabling + 1T motors
  const isScreenSuspended = mountType === 'suspended_truss';
  const totalSuspendedLoadKg = Math.round(
    aluWeight +
    (isScreenSuspended ? screenWeightKg : 0) +
    lightingWeightKg +
    cablesAndMotorsWeight
  );

  const pointLoadPerMotorKg = Math.round(totalSuspendedLoadKg / numTowers);
  const pointLoadLimitKg = 1000; // 1 Ton chain motor BGV-C1
  const motorSafetyPercentage = parseFloat(((pointLoadPerMotorKg / pointLoadLimitKg) * 100).toFixed(1));
  const isOverload = pointLoadPerMotorKg > pointLoadLimitKg;

  // ==========================================
  // 6. TOTAL ELECTRICAL POWER & DISTRIBUTION
  // ==========================================
  const audioAndExtraKw = 5.0; // Audio monitoring, front of house, control
  const totalKw = parseFloat((screenPowerKw + lightingPowerKw + audioAndExtraKw).toFixed(1));
  // 380V Triphasé: I = P / (sqrt(3) * 380 * cosPhi), cosPhi = 0.9
  const triAmps380V = parseFloat(((totalKw * 1000) / (1.732 * 380 * 0.9)).toFixed(1));
  // 220V Monophasé
  const monoAmps220V = parseFloat(((totalKw * 1000) / (220 * 0.9)).toFixed(1));

  // ==========================================
  // 7. CONSOLIDATED EQUIPMENT BOM
  // ==========================================
  const equipmentBOM = [
    // SCÈNE
    {
      id: 'stg_plaque',
      category: '1. Scène & Podiums',
      name: 'Stage Plaque / Plateau 1.22 × 1.22m',
      spec: 'Cadre aluminium + contreplaqué marin antidérapant 18 mm',
      quantity: stagePlaques,
      unitWeightKg: 25.4,
      totalWeightKg: Math.round(stagePlaques * 25.4)
    },
    {
      id: 'stg_pied',
      category: '1. Scène & Podiums',
      name: `Stage Pied Vérin H=${Math.round(heightM * 100)}cm`,
      spec: `Tube Ø 50 × 3 mm avec vérin fileté de calage millimétrique`,
      quantity: stagePieds,
      unitWeightKg: 2.8,
      totalWeightKg: Math.round(stagePieds * 2.8)
    },
    {
      id: 'stg_cote',
      category: '1. Scène & Podiums',
      name: 'Stage Côté / Cadre Latéral 1.22m',
      spec: 'Traverse Ø 50 × 2 mm + renforts diagonaux Ø 25 mm',
      quantity: stageCotes,
      unitWeightKg: 4.2,
      totalWeightKg: Math.round(stageCotes * 4.2)
    },
    ...(stairsCount > 0 ? [{
      id: 'stg_stair',
      category: '1. Scène & Podiums',
      name: `Escalier de scène (${stairSteps} marches)`,
      spec: `Marches aluminium antidérapantes avec double rampe garde-corps`,
      quantity: stairsCount,
      unitWeightKg: 25.0,
      totalWeightKg: stairsCount * 25
    }] : []),

    // STRUCTURE ALUMINIUM
    {
      id: 'truss_3m',
      category: '2. Structure & Ponts Truss',
      name: `Poutre Truss 3.00m (${gridSpecL.name})`,
      spec: `Aluminium EN-AW 6082-T6 • Raccord conique CCS`,
      quantity: trussTotals.s3,
      unitWeightKg: Math.round(3 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(trussTotals.s3 * 3 * gridSpecL.weightPerMeter)
    },
    {
      id: 'truss_2m',
      category: '2. Structure & Ponts Truss',
      name: `Poutre Truss 2.00m (${gridSpecL.name})`,
      spec: `Aluminium EN-AW 6082-T6 • Raccord conique CCS`,
      quantity: trussTotals.s2,
      unitWeightKg: Math.round(2 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(trussTotals.s2 * 2 * gridSpecL.weightPerMeter)
    },
    {
      id: 'truss_1m',
      category: '2. Structure & Ponts Truss',
      name: `Poutre Truss 1.00m (${gridSpecL.name})`,
      spec: `Aluminium EN-AW 6082-T6 • Raccord conique CCS`,
      quantity: trussTotals.s1,
      unitWeightKg: Math.round(1 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(trussTotals.s1 * 1 * gridSpecL.weightPerMeter)
    },
    ...(trussTotals.s05 > 0 ? [{
      id: 'truss_05m',
      category: '2. Structure & Ponts Truss',
      name: `Poutre Truss 0.50m (${gridSpecL.name})`,
      spec: `Aluminium EN-AW 6082-T6 • Raccord conique CCS`,
      quantity: trussTotals.s05,
      unitWeightKg: Math.round(0.5 * gridSpecL.weightPerMeter * 10) / 10,
      totalWeightKg: Math.round(trussTotals.s05 * 0.5 * gridSpecL.weightPerMeter)
    }] : []),
    {
      id: 'truss_corner',
      category: '2. Structure & Ponts Truss',
      name: 'Box Corner / Angle Multidirectionnel',
      spec: 'Cube aluminium haute résistance avec demi-manchons CCS',
      quantity: trussTotals.corners,
      unitWeightKg: 9.5,
      totalWeightKg: trussTotals.corners * 9.5
    },
    {
      id: 'truss_base',
      category: '2. Structure & Ponts Truss',
      name: 'Embase Lourde Acier (Base Plate)',
      spec: 'Plaque acier lestée 600×600 mm pour pied de tour',
      quantity: trussTotals.bases,
      unitWeightKg: 28.0,
      totalWeightKg: trussTotals.bases * 28.0
    },
    {
      id: 'truss_motor',
      category: '2. Structure & Ponts Truss',
      name: 'Palan Électrique à Chaîne 1 Tonne (1000 kg)',
      spec: 'Moteur scénique BGV-C1 / D8+ avec chaîne 24m',
      quantity: trussTotals.motors,
      unitWeightKg: 45.0,
      totalWeightKg: trussTotals.motors * 45.0
    },

    // ÉCRAN LED
    {
      id: 'led_cabinets',
      category: '3. Vidéo & Écran LED',
      name: `Dalles / Cabinets LED ${pitchKey} (500×500mm)`,
      spec: `Pitch ${pitchSpec.pitchMm}mm • Luminosité haute • Résolution ${pitchSpec.density} px/m²`,
      quantity: totalCabinets,
      unitWeightKg: 7.5,
      totalWeightKg: Math.round(totalCabinets * 7.5)
    },
    {
      id: 'led_bumping',
      category: '3. Vidéo & Écran LED',
      name: 'Barres de Suspension (Bumping Bars 1m)',
      spec: 'Barres d’accroche truss certifiées avec manilles oméga',
      quantity: Math.ceil(cabW / 2),
      unitWeightKg: 6.0,
      totalWeightKg: Math.ceil(cabW / 2) * 6.0
    },
    {
      id: 'led_processor',
      category: '3. Vidéo & Écran LED',
      name: 'Processeur Vidéo & Sending Card Novastar 4K',
      spec: 'Entrées HDMI/DP/12G-SDI, scaling faible latence et calibration',
      quantity: 1,
      unitWeightKg: 8.0,
      totalWeightKg: 8.0
    },

    // ÉCLAIRAGE
    ...(beamsCount > 0 ? [{
      id: 'light_beam',
      category: '4. Éclairage & Asservis',
      name: LIGHTING_SPECS.beam.name,
      spec: 'Faisceau ultra-concentré 2.5° • Roue de couleurs + 17 gobos fixes',
      quantity: beamsCount,
      unitWeightKg: LIGHTING_SPECS.beam.weightKg,
      totalWeightKg: beamsCount * LIGHTING_SPECS.beam.weightKg
    }] : []),
    ...(spotsCount > 0 ? [{
      id: 'light_spot',
      category: '4. Éclairage & Asservis',
      name: LIGHTING_SPECS.spot.name,
      spec: 'Moteur LED 300W • Zoom 12°-36° • Prisme rotatif + couteaux',
      quantity: spotsCount,
      unitWeightKg: LIGHTING_SPECS.spot.weightKg,
      totalWeightKg: spotsCount * LIGHTING_SPECS.spot.weightKg
    }] : []),
    ...(washesCount > 0 ? [{
      id: 'light_wash',
      category: '4. Éclairage & Asservis',
      name: LIGHTING_SPECS.wash.name,
      spec: '19×15W RGBW 4-en-1 • Zoom motorisé 6°-50° • Macro de couleurs',
      quantity: washesCount,
      unitWeightKg: LIGHTING_SPECS.wash.weightKg,
      totalWeightKg: washesCount * LIGHTING_SPECS.wash.weightKg
    }] : []),
    ...(ledBarsCount > 0 ? [{
      id: 'light_bar',
      category: '4. Éclairage & Asservis',
      name: LIGHTING_SPECS.ledBar.name,
      spec: 'Barre motorisée / pixel control RGBW • Effets matrices dynamiques',
      quantity: ledBarsCount,
      unitWeightKg: LIGHTING_SPECS.ledBar.weightKg,
      totalWeightKg: ledBarsCount * LIGHTING_SPECS.ledBar.weightKg
    }] : []),
    ...(blindersCount > 0 ? [{
      id: 'light_blinder',
      category: '4. Éclairage & Asservis',
      name: LIGHTING_SPECS.blinder.name,
      spec: 'Blinder face public 4 lampes DWE blanc chaud tungstène',
      quantity: blindersCount,
      unitWeightKg: LIGHTING_SPECS.blinder.weightKg,
      totalWeightKg: blindersCount * LIGHTING_SPECS.blinder.weightKg
    }] : []),
    ...(hazerCount > 0 ? [{
      id: 'light_hazer',
      category: '4. Éclairage & Asservis',
      name: LIGHTING_SPECS.hazer.name,
      spec: 'Générateur de brouillard fin DMX avec ventilateur orientable',
      quantity: hazerCount,
      unitWeightKg: LIGHTING_SPECS.hazer.weightKg,
      totalWeightKg: hazerCount * LIGHTING_SPECS.hazer.weightKg
    }] : []),

    // DISTRIBUTION & RÉGIE
    {
      id: 'distro_power',
      category: '5. Distribution & Régie',
      name: 'Armoire Électrique de Distribution 63A Triphasé',
      spec: `Protection différentielle 30mA, disjoncteurs individuels, sorties 32A/16A (${totalKw} kW max)`,
      quantity: 1,
      unitWeightKg: 35.0,
      totalWeightKg: 35.0
    },
    {
      id: 'console_dmx',
      category: '5. Distribution & Régie',
      name: 'Console Lumière DMX / ArtNet Pro (grandMA / Avolites)',
      spec: `4 univers DMX physiques + écrans tactiles motorisés (${totalDmxChannels} canaux)`,
      quantity: 1,
      unitWeightKg: 28.0,
      totalWeightKg: 28.0
    }
  ];

  return {
    stage: {
      modules: { length: L, width: l },
      dimensions: { lengthM, widthM, heightM, surfaceM2 },
      counts: {
        stagePlaques,
        stagePieds,
        stageCotes,
        stairs: stairsCount,
        stairSteps,
        stairsSide
      },
      heightSpec,
      hasStairs,
      hasSkirting: stage.hasSkirting !== false,
      totalWeightKg: stageTotalWeightKg,
      admissibleStageLoadKg
    },
    structure: {
      structureType: structType,
      isGoalpost,
      dimensions: { length: structL, width: structW, height: structH },
      series: { towerType, gridTypeL, gridTypeW },
      specs: { towSpec, gridSpecL, gridSpecW },
      totals: trussTotals,
      aluWeight,
      numTowers
    },
    screen: {
      pitch: pitchKey,
      pitchSpec,
      mountType,
      cabinets: { width: cabW, height: cabH, total: totalCabinets },
      dimensions: { widthM: screenWidthM, heightM: screenHeightM, areaM2: screenAreaM2 },
      totalPixels,
      screenWeightKg,
      screenPowerKw
    },
    lighting: {
      counts: {
        beams: beamsCount,
        spots: spotsCount,
        washes: washesCount,
        ledBars: ledBarsCount,
        blinders: blindersCount,
        hazers: hazerCount,
        total: totalFixtures
      },
      totalLightingWeightKg,
      totalLightingPowerKw,
      totalDmxChannels,
      dmxUniverses,
      showBeams,
      beamColor
    },
    totalRigging: {
      aluWeight,
      screenWeight: isScreenSuspended ? screenWeightKg : 0,
      lightingWeight: lightingWeightKg,
      cablesWeight: cablesAndMotorsWeight,
      totalSuspendedLoadKg,
      pointLoadPerMotorKg,
      pointLoadLimitKg,
      motorSafetyPercentage,
      isOverload
    },
    totalPower: {
      screenPowerKw,
      lightingPowerKw,
      audioAndExtraKw,
      totalKw,
      triAmps380V,
      monoAmps220V
    },
    equipmentBOM
  };
};
