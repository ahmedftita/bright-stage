import { API_URL } from '../config';
import { authService } from './authService';

const LOCAL_STORAGE_KEY = 'bright_stage_saved_structure_models';

const DEFAULT_SEED_MODELS = [
  {
    _id: 'struct_seed_01',
    eventName: 'Festival International de Carthage — Gril Scénique 10×8',
    siteName: 'Amphithéâtre Romain',
    structureType: 'grid',
    towerType: 'PT34',
    gridTypeL: 'PT34',
    gridTypeW: 'PT34',
    length: 10,
    width: 8,
    height: 6,
    ledWeight: 800,
    totals: {
      s3: 16,
      s2: 8,
      s1: 4,
      s05: 0,
      corners: 4,
      tJunctions: 0,
      xJunctions: 0,
      bases: 4,
      hinges: 16,
      motors: 4
    },
    aluWeight: 345,
    totalLoad: 1145,
    pointLoad: 286.3,
    pointLoadLimit: 688,
    loadPercentage: 41.6,
    isOverload: false,
    notes: 'Gril 10x8m hauteur 6m avec éclairage et écran LED central',
    createdByName: 'Jilani Wahi',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: 'struct_seed_02',
    eventName: 'Goalpost Écran LED Plein Jour 8×6 — Live Arena',
    siteName: 'Palais des Congrès',
    structureType: 'goalpost',
    towerType: 'PT34',
    gridTypeL: 'HT44',
    gridTypeW: 'PT34',
    length: 8,
    width: 4,
    height: 6,
    ledWeight: 650,
    totals: {
      s3: 6,
      s2: 4,
      s1: 2,
      s05: 0,
      corners: 2,
      tJunctions: 0,
      xJunctions: 0,
      bases: 2,
      hinges: 8,
      motors: 2
    },
    aluWeight: 215,
    totalLoad: 865,
    pointLoad: 432.5,
    pointLoadLimit: 688,
    loadPercentage: 62.9,
    isOverload: false,
    notes: 'Arche Goalpost renforcée avec outriggers 2m pour suspension écran LED plein jour',
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

export const structureModelService = {
  getModels: async () => {
    const token = authService.getToken();
    try {
      const res = await fetch(`${API_URL}/structure-models`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
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
      const res = await fetch(`${API_URL}/structure-models`, {
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
        _id: 'local_struct_' + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const current = getLocalModels();
    const updated = [saved, ...current.filter(m => m._id !== saved._id)];
    setLocalModels(updated);

    return saved;
  },

  deleteModel: async (id) => {
    const token = authService.getToken();
    try {
      await fetch(`${API_URL}/structure-models/${id}`, {
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
