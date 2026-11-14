import { API_URL } from '../config';
import { authService } from './authService';

const LOCAL_STORAGE_KEY = 'bright_stage_saved_models';

const DEFAULT_SEED_MODELS = [
  {
    _id: 'seed_01',
    eventName: 'Festival International de Carthage 2026',
    siteName: 'Amphithéâtre Romain',
    length: 6,
    width: 4,
    heightId: 'h55',
    heightM: 0.55,
    surfaceM2: 35.72,
    includeStairs: true,
    stairsCount: 1,
    includeGuardrails: false,
    guardrailSides: 'back-sides',
    counts: {
      stagePlaques: 24,
      stagePieds: 35,
      stageCotes: 58,
      stairs: 1,
      stairSteps: 2,
      guardrails: 0
    },
    totalLoadCapacityKg: 26790,
    totalWeightKg: 964.8,
    notes: 'Configuration officielle scène principale 6x4',
    createdByName: 'Jilani Wahi',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: 'seed_02',
    eventName: 'Concert Symphonique El Jem',
    siteName: 'Colisée d’El Jem',
    length: 8,
    width: 6,
    heightId: 'h100',
    heightM: 1.00,
    surfaceM2: 71.44,
    includeStairs: true,
    stairsCount: 2,
    includeGuardrails: true,
    guardrailSides: 'back-sides',
    counts: {
      stagePlaques: 48,
      stagePieds: 63,
      stageCotes: 110,
      stairs: 2,
      stairSteps: 4,
      guardrails: 20
    },
    totalLoadCapacityKg: 53580,
    totalWeightKg: 2024.0,
    notes: 'Grande scène festival 8x6 à 1m de haut',
    createdByName: 'Jilani Wahi',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

const getLocalModels = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_MODELS));
      return DEFAULT_SEED_MODELS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_MODELS;
  }
};

const setLocalModels = (models) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(models));
  } catch (err) {
    console.error("Local storage error:", err);
  }
};

export const stageModelService = {
  getModels: async () => {
    const token = authService.getToken();
    try {
      const res = await fetch(`${API_URL}/stage-models`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Sync with local storage
          setLocalModels(data);
          return data;
        }
      }
    } catch (err) {
      console.warn("Backend unavailable, loading local models:", err.message);
    }
    return getLocalModels();
  },

  saveModel: async (modelData) => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    const payload = {
      ...modelData,
      createdByName: user?.name || modelData.createdByName || 'Utilisateur Bright Stage'
    };

    let saved = null;
    try {
      const res = await fetch(`${API_URL}/stage-models`, {
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
        _id: 'local_' + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Always update local cache
    const current = getLocalModels();
    const updated = [saved, ...current.filter(m => m._id !== saved._id)];
    setLocalModels(updated);

    return saved;
  },

  deleteModel: async (id) => {
    const token = authService.getToken();
    try {
      await fetch(`${API_URL}/stage-models/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.warn("Backend delete error, removing locally:", err.message);
    }

    const current = getLocalModels();
    const updated = current.filter(m => m._id !== id);
    setLocalModels(updated);
    return true;
  }
};
