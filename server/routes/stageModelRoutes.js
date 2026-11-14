const express = require('express');
const router = express.Router();
const StageModel = require('../models/StageModel');
const connectDB = require('../config/db');

// In-memory fallback in case Atlas DB connection is sleeping or slow
let MEMORY_STAGE_MODELS = [
    {
        _id: 'stage_model_default_01',
        eventName: 'Festival International de Carthage',
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
        notes: 'Configuration standard scène pro 6x4',
        createdByName: 'Jilani Wahi',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// GET all stage models
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const models = await StageModel.find().sort({ createdAt: -1 }).lean();
        if (models && models.length > 0) {
            return res.json(models);
        }
        return res.json(MEMORY_STAGE_MODELS);
    } catch (err) {
        console.warn("StageModel GET fallback to memory:", err.message);
        return res.json(MEMORY_STAGE_MODELS);
    }
});

// GET single stage model
router.get('/:id', async (req, res) => {
    try {
        await connectDB();
        const model = await StageModel.findById(req.params.id).lean();
        if (model) return res.json(model);
        const mem = MEMORY_STAGE_MODELS.find(m => m._id === req.params.id);
        if (mem) return res.json(mem);
        return res.status(404).json({ error: "Modèle introuvable" });
    } catch (err) {
        const mem = MEMORY_STAGE_MODELS.find(m => m._id === req.params.id);
        if (mem) return res.json(mem);
        return res.status(404).json({ error: "Modèle introuvable" });
    }
});

// POST create stage model
router.post('/', async (req, res) => {
    try {
        const {
            eventName,
            siteName,
            length,
            width,
            heightId,
            heightM,
            surfaceM2,
            includeStairs,
            stairsCount,
            includeGuardrails,
            guardrailSides,
            counts,
            totalLoadCapacityKg,
            totalWeightKg,
            notes,
            createdByName
        } = req.body;

        if (!eventName || !eventName.trim()) {
            return res.status(400).json({ error: "Le nom de l'événement est obligatoire" });
        }

        const modelData = {
            eventName: eventName.trim(),
            siteName: siteName || '',
            length: parseInt(length) || 6,
            width: parseInt(width) || 4,
            heightId: heightId || 'h55',
            heightM: parseFloat(heightM) || 0.55,
            surfaceM2: parseFloat(surfaceM2) || 0,
            includeStairs: !!includeStairs,
            stairsCount: parseInt(stairsCount) || 1,
            includeGuardrails: !!includeGuardrails,
            guardrailSides: guardrailSides || 'back-sides',
            counts: counts || {},
            totalLoadCapacityKg: parseInt(totalLoadCapacityKg) || 0,
            totalWeightKg: parseFloat(totalWeightKg) || 0,
            notes: notes || '',
            createdByName: createdByName || (req.user ? req.user.name : 'Utilisateur Bright Stage')
        };

        try {
            await connectDB();
            const newModel = new StageModel(modelData);
            const saved = await newModel.save();
            // Also keep in memory
            MEMORY_STAGE_MODELS.unshift(saved.toObject());
            return res.status(201).json(saved);
        } catch (dbErr) {
            console.warn("DB save failed, using memory store:", dbErr.message);
            const memModel = {
                _id: 'mem_' + Date.now(),
                ...modelData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            MEMORY_STAGE_MODELS.unshift(memModel);
            return res.status(201).json(memModel);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE stage model
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        try {
            await connectDB();
            await StageModel.findByIdAndDelete(id);
        } catch (e) {
            console.warn("DB delete error:", e.message);
        }
        MEMORY_STAGE_MODELS = MEMORY_STAGE_MODELS.filter(m => m._id !== id);
        return res.json({ message: "Modèle supprimé avec succès", id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
