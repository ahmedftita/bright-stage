/**
 * Stage Calculator Logic — Pure Business Functions
 * Conforme aux spécifications officielles Bright Stage :
 *
 * Formules pour une scène rectangulaire (L modules en longueur × l modules en largeur) :
 * • Dimensions réelles (m) : (L × 1,22 m) × (l × 1,22 m)
 * • Surface totale (m²) : L × l × 1,4884
 * • Nombre de Stage plaques : L × l
 * • Nombre de Stage pieds : (L + 1) × (l + 1)
 * • Nombre de Stage côtés : L × (l + 1) + l × (L + 1)
 */

export const HARDWARE_SPECS = {
  plaque: {
    name: 'Stage plaque (Plateau)',
    shortName: 'Stage plaque',
    dimM: 1.22,
    areaM2: 1.4884,
    spec: 'Cadre aluminium + contreplaqué marin antidérapant (épaisseur 18 mm)',
    weightKg: 31.5
  },
  pied: {
    name: 'Stage pied (Poteau + vérin)',
    shortName: 'Stage pied',
    spec: 'Tube Ø 50 mm × épaisseur 3 mm avec base filetée réglable',
    weightKg: 2.8
  },
  cote: {
    name: 'Stage côté (Cadre latéral)',
    shortName: 'Stage côté',
    spec: 'Traverses Ø 50 mm × 2 mm + renforts diagonaux Ø 25 mm × 2 mm',
    weightKg: 1.6
  }
};

/**
 * Tableau officiel des 10 métrages et quantités précalculées
 */
export const PRECALCULATED_CONFIGURATIONS = [
  { length: 1, width: 1, dims: '1,22 m × 1,22 m', surfaceM2: 1.49, plaques: 1, pieds: 4, cotes: 4, label: 'Podium Solo 1×1' },
  { length: 2, width: 1, dims: '2,44 m × 1,22 m', surfaceM2: 2.98, plaques: 2, pieds: 6, cotes: 7, label: 'Podium Étroit 2×1' },
  { length: 2, width: 2, dims: '2,44 m × 2,44 m', surfaceM2: 5.95, plaques: 4, pieds: 9, cotes: 12, label: 'Podium Discours / DJ 2×2' },
  { length: 3, width: 2, dims: '3,66 m × 2,44 m', surfaceM2: 8.93, plaques: 6, pieds: 12, cotes: 17, label: 'Scène Petite Conférence 3×2' },
  { length: 4, width: 2, dims: '4,88 m × 2,44 m', surfaceM2: 11.91, plaques: 8, pieds: 15, cotes: 22, label: 'Scène Pupitre & Écran 4×2' },
  { length: 4, width: 3, dims: '4,88 m × 3,66 m', surfaceM2: 17.86, plaques: 12, pieds: 20, cotes: 31, label: 'Scène Conférence Standard 4×3' },
  { length: 4, width: 4, dims: '4,88 m × 4,88 m', surfaceM2: 23.81, plaques: 16, pieds: 25, cotes: 40, label: 'Scène Moyenne Carrée 4×4' },
  { length: 5, width: 4, dims: '6,10 m × 4,88 m', surfaceM2: 29.77, plaques: 20, pieds: 30, cotes: 49, label: 'Scène Concert Moyen 5×4' },
  { length: 6, width: 4, dims: '7,32 m × 4,88 m', surfaceM2: 35.72, plaques: 24, pieds: 35, cotes: 58, label: 'Standard Scène Pro 6×4' },
  { length: 8, width: 6, dims: '9,76 m × 7,32 m', surfaceM2: 71.44, plaques: 48, pieds: 63, cotes: 110, label: 'Grande Scène Festival 8×6' }
];

export const HEIGHT_OPTIONS = [
  { id: 'h55', label: '55 cm (0,55 m)', value: 0.55, steps: 2, needsBracing: false },
  { id: 'h75', label: '75 cm (0,75 m)', value: 0.75, steps: 3, needsBracing: false },
  { id: 'h100', label: '1 m (1,00 m)', value: 1.00, steps: 4, needsBracing: true }
];

/**
 * Calcul exact des composants de scène
 * @param {Object} options
 * @param {number} options.length - L : Nombre de modules en longueur
 * @param {number} options.width  - l : Nombre de modules en largeur
 */
export function calculateStage(options = {}) {
  const {
    length = 6,
    width = 4,
    heightId = 'h55',
    includeStairs = true,
    stairsCount = 1,
    includeGuardrails = false,
    guardrailSides = 'back-sides',
    udlRatingKgM2 = 750
  } = options;

  const L = Math.max(1, parseInt(length) || 1);
  const l = Math.max(1, parseInt(width) || 1);

  const selectedHeight = HEIGHT_OPTIONS.find(h => h.id === heightId) || HEIGHT_OPTIONS[0];

  // 1. Dimensions réelles (m) : (L × 1,22 m) × (l × 1,22 m)
  const totalLengthM = +(L * 1.22).toFixed(2);
  const totalWidthM = +(l * 1.22).toFixed(2);

  // 2. Surface totale (m²) : L × l × 1,4884
  const surfaceM2 = +(L * l * 1.4884).toFixed(2);
  const perimeterM = +(2 * (totalLengthM + totalWidthM)).toFixed(2);

  // 3. Nombre de Stage plaques : L × l
  const stagePlaques = L * l;

  // 4. Nombre de Stage pieds : (L + 1) × (l + 1)
  const stagePieds = (L + 1) * (l + 1);

  // 5. Nombre de Stage côtés : L × (l + 1) + l × (L + 1)
  const stageCotes = (L * (l + 1)) + (l * (L + 1));

  // 6. Accessoires complémentaires
  const stairSteps = selectedHeight.steps;
  const stairsRequired = includeStairs && stairSteps > 0 ? stairsCount : 0;

  let guardrailsCount = 0;
  if (includeGuardrails) {
    if (guardrailSides === 'back') guardrailsCount = L;
    else if (guardrailSides === 'back-sides') guardrailsCount = L + (2 * l);
    else if (guardrailSides === 'all') guardrailsCount = (2 * L) + (2 * l);
  }

  // 7. Estimations logistiques & poids
  const weightPlaques = +(stagePlaques * HARDWARE_SPECS.plaque.weightKg).toFixed(1);
  const weightPieds = +(stagePieds * HARDWARE_SPECS.pied.weightKg).toFixed(1);
  const weightCotes = +(stageCotes * HARDWARE_SPECS.cote.weightKg).toFixed(1);
  const weightStairs = +(stairsRequired * stairSteps * 9.0).toFixed(1);
  const weightGuardrails = +(guardrailsCount * 7.0).toFixed(1);

  const totalWeightKg = +(weightPlaques + weightPieds + weightCotes + weightStairs + weightGuardrails).toFixed(1);
  const totalLoadCapacityKg = Math.round(surfaceM2 * udlRatingKgM2);
  const maxSafeCrowdPersons = Math.floor(surfaceM2 * 2.5);

  // Nomenclature officielle (BOM)
  const billOfMaterials = [
    {
      category: 'Plateau',
      name: HARDWARE_SPECS.plaque.name,
      spec: HARDWARE_SPECS.plaque.spec,
      quantity: stagePlaques,
      unit: 'plaques',
      unitWeightKg: HARDWARE_SPECS.plaque.weightKg,
      totalWeightKg: weightPlaques
    },
    {
      category: 'Poteau',
      name: HARDWARE_SPECS.pied.name,
      spec: `${HARDWARE_SPECS.pied.spec} • Hauteur ${Math.round(selectedHeight.value * 100)} cm (vérin ajustable)`,
      quantity: stagePieds,
      unit: 'pieds',
      unitWeightKg: HARDWARE_SPECS.pied.weightKg,
      totalWeightKg: weightPieds
    },
    {
      category: 'Cadre',
      name: HARDWARE_SPECS.cote.name,
      spec: HARDWARE_SPECS.cote.spec,
      quantity: stageCotes,
      unit: 'côtés',
      unitWeightKg: HARDWARE_SPECS.cote.weightKg,
      totalWeightKg: weightCotes
    }
  ];

  if (stairsRequired > 0) {
    billOfMaterials.push({
      category: 'Accès',
      name: `Escalier de scène (${stairSteps} marche${stairSteps > 1 ? 's' : ''})`,
      spec: `Hauteur franchissable ${Math.round(selectedHeight.value * 100)} cm avec rampe`,
      quantity: stairsRequired,
      unit: 'escalier',
      unitWeightKg: stairSteps * 9.0,
      totalWeightKg: weightStairs
    });
  }

  if (guardrailsCount > 0) {
    billOfMaterials.push({
      category: 'Sécurité',
      name: 'Garde-corps de scène 1.22 m',
      spec: 'Garde-corps aluminium avec fixations rapides conforme ERP',
      quantity: guardrailsCount,
      unit: 'modules',
      unitWeightKg: 7.0,
      totalWeightKg: weightGuardrails
    });
  }

  return {
    modules: { length: L, width: l },
    physicalDimensions: {
      lengthM: totalLengthM,
      widthM: totalWidthM,
      heightM: selectedHeight.value,
      heightLabel: selectedHeight.label,
      surfaceM2,
      perimeterM
    },
    hardwareSpecs: HARDWARE_SPECS,
    heightSpec: selectedHeight,
    counts: {
      stagePlaques,
      stagePieds,
      stageCotes,
      stairs: stairsRequired,
      stairSteps,
      guardrails: guardrailsCount
    },
    logistics: {
      totalWeightKg,
      totalLoadCapacityKg,
      maxSafeCrowdPersons
    },
    billOfMaterials
  };
}
