import api from './api';

const LOCAL_STORAGE_KEY = 'bright_stage_saved_full_conceptions';

const DEFAULT_SEEDS = [
  {
    _id: 'seed_full_01',
    eventName: 'Festival International de Carthage 2026 — Grande Scène',
    siteName: 'Amphithéâtre Romain de Carthage',
    stageConfig: {
      lengthModules: 6,
      widthModules: 4,
      lengthM: 7.32,
      widthM: 4.88,
      heightM: 0.75,
      surfaceM2: 35.72,
      hasStairs: true,
      stairsCount: 1,
      stairsSide: 'right',
      hasSkirting: true,
      counts: {
        plaques: 24,
        pieds: 35,
        cotes: 58,
        stairs: 1,
        stairSteps: 3
      },
      admissibleLoadKg: 26790,
      totalWeightKg: 965
    },
    structureConfig: {
      structureType: 'grid',
      towerType: 'PT34',
      gridTypeL: 'HT44',
      gridTypeW: 'PT34',
      length: 10,
      width: 8,
      height: 6,
      aluWeight: 360,
      numTowers: 4
    },
    screenConfig: {
      pitch: 'P3.9',
      mountType: 'suspended_truss',
      cabinetsW: 12,
      cabinetsH: 6,
      screenWidthM: 6.0,
      screenHeightM: 3.0,
      totalPixels: 1179648,
      screenWeightKg: 540,
      powerConsumptionKw: 8.6
    },
    lightingConfig: {
      beamsCount: 8,
      spotsCount: 6,
      washesCount: 8,
      ledBarsCount: 6,
      blindersCount: 4,
      hazerCount: 2,
      showBeams: true,
      beamColor: '#38bdf8',
      totalLightingWeightKg: 384,
      totalLightingPowerKw: 9.8,
      totalDmxChannels: 420
    },
    totalRigging: {
      aluWeight: 360,
      screenWeight: 540,
      lightingWeight: 384,
      cablesWeight: 120,
      totalSuspendedLoadKg: 1404,
      pointLoadPerMotorKg: 351,
      pointLoadLimitKg: 1000,
      motorSafetyPercentage: 35.1,
      isOverload: false
    },
    totalPower: {
      screenPowerKw: 8.6,
      lightingPowerKw: 9.8,
      audioAndExtraKw: 5.0,
      totalKw: 23.4,
      triAmps380V: 35.5,
      monoAmps220V: 106.4
    },
    notes: 'Conception festival officielle : Scène 7.32×4.88m à 75cm, Gril 10×8m, Mur LED 6×3m P3.9, 26 projecteurs asservis.',
    createdByName: 'Jilani Wahi',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

const getLocalConceptions = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SEEDS));
      return DEFAULT_SEEDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEEDS;
  }
};

const setLocalConceptions = (conceptions) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conceptions));
  } catch (err) {
    console.error("Local storage error:", err);
  }
};

export const conceptionService = {
  getConceptions: async () => {
    try {
      const res = await api.get('/stage-conceptions');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setLocalConceptions(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn("Backend unavailable, loading local stage conceptions:", err.message);
    }
    return getLocalConceptions();
  },

  saveConception: async (conceptionData) => {
    let saved = null;
    try {
      const res = await api.post('/stage-conceptions', conceptionData);
      if (res.data) {
        saved = res.data;
      }
    } catch (err) {
      console.warn("Backend save failed, saving locally:", err.message);
    }

    if (!saved) {
      saved = {
        _id: 'local_concept_' + Date.now(),
        ...conceptionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const current = getLocalConceptions();
    const updated = [saved, ...current.filter(c => c._id !== saved._id)];
    setLocalConceptions(updated);

    return saved;
  },

  deleteConception: async (id) => {
    try {
      await api.delete(`/stage-conceptions/${id}`);
    } catch (err) {
      console.warn("Backend delete error, removing locally:", err.message);
    }

    const current = getLocalConceptions();
    const updated = current.filter(c => c._id !== id);
    setLocalConceptions(updated);
    return true;
  }
};
