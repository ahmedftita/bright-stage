const express = require('express');
const router = express.Router();
const StructureModel = require('../models/StructureModel');
const connectDB = require('../config/db');

// In-memory fallback in case Atlas DB connection is sleeping or slow
let MEMORY_STRUCTURE_MODELS = [
    {
        _id: 'struct_model_seed_01',
        eventName: 'Festival International de Carthage — Gril Scénique',
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
        pointLoad: 286,
        pointLoadLimit: 688,
        loadPercentage: 41.6,
        isOverload: false,
        notes: 'Gril 10x8m hauteur 6m avec éclairage et écran LED central',
        createdByName: 'Jilani Wahi',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        _id: 'struct_model_seed_02',
        eventName: 'Goalpost Écran LED 8x6m — Tournée Arena',
        siteName: 'Palais des Congrès',
        structureType: 'goalpost',
        towerType: 'PT34',
        gridTypeL: 'HT44',
        gridTypeW: 'PT34',
        length: 8,
        width: 4,
        height: 6,
        ledWeight: 600,
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
        totalLoad: 815,
        pointLoad: 407,
        pointLoadLimit: 688,
        loadPercentage: 59.2,
        isOverload: false,
        notes: 'Arche Goalpost renforcée avec outriggers 2m pour suspension écran LED plein jour',
        createdByName: 'Jilani Wahi',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
];

// GET all structure models
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const models = await StructureModel.find().sort({ createdAt: -1 }).lean();
        if (models && models.length > 0) {
            return res.json(models);
        }
        return res.json(MEMORY_STRUCTURE_MODELS);
    } catch (err) {
        console.warn("StructureModel GET fallback to memory:", err.message);
        return res.json(MEMORY_STRUCTURE_MODELS);
    }
});

// GET single structure model
router.get('/:id', async (req, res) => {
    try {
        await connectDB();
        const model = await StructureModel.findById(req.params.id).lean();
        if (model) return res.json(model);
        const mem = MEMORY_STRUCTURE_MODELS.find(m => m._id === req.params.id);
        if (mem) return res.json(mem);
        return res.status(404).json({ error: "Modèle de structure introuvable" });
    } catch (err) {
        const mem = MEMORY_STRUCTURE_MODELS.find(m => m._id === req.params.id);
        if (mem) return res.json(mem);
        return res.status(404).json({ error: "Modèle de structure introuvable" });
    }
});

// POST create structure model
router.post('/', async (req, res) => {
    try {
        const {
            eventName,
            siteName,
            structureType,
            towerType,
            gridTypeL,
            gridTypeW,
            length,
            width,
            height,
            ledWeight,
            totals,
            aluWeight,
            totalLoad,
            pointLoad,
            pointLoadLimit,
            loadPercentage,
            isOverload,
            notes,
            createdByName
        } = req.body;

        if (!eventName || !eventName.trim()) {
            return res.status(400).json({ error: "Le nom de l'événement est obligatoire" });
        }

        const modelData = {
            eventName: eventName.trim(),
            siteName: siteName ? siteName.trim() : '',
            structureType: structureType || 'grid',
            towerType: towerType || 'PT34',
            gridTypeL: gridTypeL || 'PT34',
            gridTypeW: gridTypeW || 'PT34',
            length: parseFloat(length) || 8,
            width: parseFloat(width) || 6,
            height: parseFloat(height) || 6,
            ledWeight: parseFloat(ledWeight) || 0,
            totals: totals || {},
            aluWeight: parseFloat(aluWeight) || 0,
            totalLoad: parseFloat(totalLoad) || 0,
            pointLoad: parseFloat(pointLoad) || 0,
            pointLoadLimit: parseFloat(pointLoadLimit) || 0,
            loadPercentage: parseFloat(loadPercentage) || 0,
            isOverload: !!isOverload,
            notes: notes ? notes.trim() : '',
            createdByName: createdByName || (req.user ? req.user.name : 'Utilisateur Bright Stage')
        };

        try {
            await connectDB();
            const newModel = new StructureModel(modelData);
            const saved = await newModel.save();
            MEMORY_STRUCTURE_MODELS.unshift(saved.toObject());
            return res.status(201).json(saved);
        } catch (dbErr) {
            console.warn("DB save failed, using memory store:", dbErr.message);
            const memModel = {
                _id: 'mem_struct_' + Date.now(),
                ...modelData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            MEMORY_STRUCTURE_MODELS.unshift(memModel);
            return res.status(201).json(memModel);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE structure model
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        try {
            await connectDB();
            await StructureModel.findByIdAndDelete(id);
        } catch (e) {
            console.warn("DB delete error:", e.message);
        }
        MEMORY_STRUCTURE_MODELS = MEMORY_STRUCTURE_MODELS.filter(m => m._id !== id);
        return res.json({ message: "Modèle supprimé avec succès", id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
