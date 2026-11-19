import { API_URL } from '../config';
import { authService } from './authService';

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
  },
  {
    _id: 'seed_full_02',
    eventName: 'Concert Symphonique Arena — Arche Goalpost & Grand Écran',
    siteName: 'Palais des Congrès de Tunis',
    stageConfig: {
      lengthModules: 8,
      widthModules: 6,
      lengthM: 9.76,
      widthM: 7.32,
      heightM: 1.00,
      surfaceM2: 71.44,
      hasStairs: true,
      stairsCount: 2,
      stairsSide: 'both',
      hasSkirting: true,
      counts: {
        plaques: 48,
        pieds: 63,
        cotes: 110,
        stairs: 2,
        stairSteps: 4
      },
      admissibleLoadKg: 53580,
      totalWeightKg: 2024
    },
    structureConfig: {
      structureType: 'goalpost',
      towerType: 'PT34',
      gridTypeL: 'HT44',
      gridTypeW: 'PT34',
      length: 10,
      width: 4,
      height: 7,
      aluWeight: 240,
      numTowers: 2
    },
    screenConfig: {
      pitch: 'P2.9',
      mountType: 'suspended_truss',
      cabinetsW: 16,
      cabinetsH: 8,
      screenWidthM: 8.0,
      screenHeightM: 4.0,
      totalPixels: 3774874,
      screenWeightKg: 960,
      powerConsumptionKw: 15.2
    },
    lightingConfig: {
      beamsCount: 6,
      spotsCount: 4,
      washesCount: 6,
      ledBarsCount: 8,
      blindersCount: 2,
      hazerCount: 1,
      showBeams: true,
      beamColor: '#f59e0b',
      totalLightingWeightKg: 260,
      totalLightingPowerKw: 7.2,
      totalDmxChannels: 280
    },
    totalRigging: {
      aluWeight: 240,
      screenWeight: 960,
      lightingWeight: 260,
      cablesWeight: 90,
      totalSuspendedLoadKg: 1550,
      pointLoadPerMotorKg: 775,
      pointLoadLimitKg: 1000,
      motorSafetyPercentage: 77.5,
      isOverload: false
    },
    totalPower: {
      screenPowerKw: 15.2,
      lightingPowerKw: 7.2,
      audioAndExtraKw: 6.0,
      totalKw: 28.4,
      triAmps380V: 43.1,
      monoAmps220V: 129.1
    },
    notes: 'Grande arche avec écran LED 8×4m et scène orchestrale 71m².',
    createdByName: 'Jilani Wahi',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
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
    const token = authService.getToken();
    try {
      const res = await fetch(`${API_URL}/stage-conceptions`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLocalConceptions(data);
          return data;
        }
      }
    } catch (err) {
      console.warn("Backend unavailable, loading local stage conceptions:", err.message);
    }
    return getLocalConceptions();
  },

  saveConception: async (conceptionData) => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    const payload = {
      ...conceptionData,
      createdByName: user?.name || conceptionData.createdByName || 'Utilisateur Bright Stage'
    };

    let saved = null;
    try {
      const res = await fetch(`${API_URL}/stage-conceptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        saved = await res.json();
      }
    } catch (err) {
      console.warn("Backend save failed, saving locally:", err.message);
    }

    if (!saved) {
      saved = {
        _id: 'local_concept_' + Date.now(),
        ...payload,
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
    const token = authService.getToken();
    try {
      await fetch(`${API_URL}/stage-conceptions/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.warn("Backend delete error, removing locally:", err.message);
    }

    const current = getLocalConceptions();
    const updated = current.filter(c => c._id !== id);
    setLocalConceptions(updated);
    return true;
  }
};
