const express = require('express');
const router = express.Router();
const StageConception = require('../models/StageConception');
const connectDB = require('../config/db');

let MEMORY_STAGE_CONCEPTIONS = [
    {
        _id: 'conception_seed_01',
        eventName: 'Festival International de Carthage — Scène Complète & Show Light',
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
            numTowers: 4,
            totals: {
                s3: 16,
                s2: 8,
                s1: 4,
                s05: 0,
                corners: 4,
                bases: 4,
                hinges: 16,
                motors: 4
            }
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
        notes: 'Conception festival complète : Scène 7.32x4.88m, Gril 10x8m, Mur LED 6x3m P3.9 Outdoor, 26 projecteurs asservis.',
        createdByName: 'Jilani Wahi',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        _id: 'conception_seed_02',
        eventName: 'Concert Symphonique Arena — Arche Goalpost & Scène 8×6',
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
            numTowers: 2,
            totals: {
                s3: 8,
                s2: 6,
                s1: 2,
                s05: 0,
                corners: 2,
                bases: 2,
                hinges: 8,
                motors: 2
            }
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
        notes: 'Arche Goalpost renforcée avec grand écran 8x4m P2.9 et grande scène symphonique 71m².',
        createdByName: 'Jilani Wahi',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 6).toISOString()
    }
];

// GET all stage conceptions
router.get('/', async (req, res) => {
    try {
        await connectDB();
        const conceptions = await StageConception.find().sort({ createdAt: -1 }).lean();
        if (conceptions && conceptions.length > 0) {
            return res.json(conceptions);
        }
        return res.json(MEMORY_STAGE_CONCEPTIONS);
    } catch (err) {
        console.warn("StageConception GET fallback to memory:", err.message);
        return res.json(MEMORY_STAGE_CONCEPTIONS);
    }
});

// GET single stage conception
router.get('/:id', async (req, res) => {
    try {
        await connectDB();
        const conception = await StageConception.findById(req.params.id).lean();
        if (conception) return res.json(conception);
        const mem = MEMORY_STAGE_CONCEPTIONS.find(c => c._id === req.params.id);
        if (mem) return res.json(mem);
        return res.status(404).json({ error: "Conception scénique introuvable" });
    } catch (err) {
        const mem = MEMORY_STAGE_CONCEPTIONS.find(c => c._id === req.params.id);
        if (mem) return res.json(mem);
        return res.status(404).json({ error: "Conception scénique introuvable" });
    }
});

// POST create stage conception
router.post('/', async (req, res) => {
    try {
        const {
            eventName,
            siteName,
            stageConfig,
            structureConfig,
            screenConfig,
            lightingConfig,
            totalRigging,
            totalPower,
            equipmentBOM,
            notes,
            createdByName
        } = req.body;

        if (!eventName || !eventName.trim()) {
            return res.status(400).json({ error: "Le nom de l'événement est obligatoire" });
        }

        const conceptionData = {
            eventName: eventName.trim(),
            siteName: siteName ? siteName.trim() : '',
            stageConfig: stageConfig || {},
            structureConfig: structureConfig || {},
            screenConfig: screenConfig || {},
            lightingConfig: lightingConfig || {},
            totalRigging: totalRigging || {},
            totalPower: totalPower || {},
            equipmentBOM: equipmentBOM || [],
            notes: notes ? notes.trim() : '',
            createdByName: createdByName || (req.user ? req.user.name : 'Utilisateur Bright Stage')
        };

        try {
            await connectDB();
            const newConception = new StageConception(conceptionData);
            const saved = await newConception.save();
            MEMORY_STAGE_CONCEPTIONS.unshift(saved.toObject());
            return res.status(201).json(saved);
        } catch (dbErr) {
            console.warn("DB save failed, using memory store:", dbErr.message);
            const memConception = {
                _id: 'mem_concept_' + Date.now(),
                ...conceptionData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            MEMORY_STAGE_CONCEPTIONS.unshift(memConception);
            return res.status(201).json(memConception);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE stage conception
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        try {
            await connectDB();
            await StageConception.findByIdAndDelete(id);
        } catch (e) {
            console.warn("DB delete error:", e.message);
        }
        MEMORY_STAGE_CONCEPTIONS = MEMORY_STAGE_CONCEPTIONS.filter(c => c._id !== id);
        return res.json({ message: "Conception scénique supprimée avec succès", id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
