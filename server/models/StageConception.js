const mongoose = require('mongoose');

const StageConceptionSchema = new mongoose.Schema({
    eventName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    siteName: { 
        type: String, 
        default: '' 
    },
    stageConfig: {
        lengthModules: { type: Number, default: 6 },
        widthModules: { type: Number, default: 4 },
        lengthM: { type: Number, default: 7.32 },
        widthM: { type: Number, default: 4.88 },
        heightM: { type: Number, default: 0.75 },
        surfaceM2: { type: Number, default: 35.72 },
        hasStairs: { type: Boolean, default: true },
        stairsCount: { type: Number, default: 1 },
        stairsSide: { type: String, default: 'right' },
        hasSkirting: { type: Boolean, default: true },
        counts: {
            plaques: { type: Number, default: 24 },
            pieds: { type: Number, default: 35 },
            cotes: { type: Number, default: 58 },
            stairs: { type: Number, default: 1 },
            stairSteps: { type: Number, default: 3 }
        },
        admissibleLoadKg: { type: Number, default: 26790 },
        totalWeightKg: { type: Number, default: 965 }
    },
    structureConfig: {
        structureType: { type: String, default: 'grid' },
        towerType: { type: String, default: 'PT34' },
        gridTypeL: { type: String, default: 'HT44' },
        gridTypeW: { type: String, default: 'PT34' },
        length: { type: Number, default: 10 },
        width: { type: Number, default: 8 },
        height: { type: Number, default: 6 },
        aluWeight: { type: Number, default: 360 },
        numTowers: { type: Number, default: 4 },
        totals: {
            s3: { type: Number, default: 16 },
            s2: { type: Number, default: 8 },
            s1: { type: Number, default: 4 },
            s05: { type: Number, default: 0 },
            corners: { type: Number, default: 4 },
            bases: { type: Number, default: 4 },
            hinges: { type: Number, default: 16 },
            motors: { type: Number, default: 4 }
        }
    },
    screenConfig: {
        pitch: { type: String, default: 'P3.9' },
        mountType: { type: String, default: 'suspended_truss' },
        cabinetsW: { type: Number, default: 12 },
        cabinetsH: { type: Number, default: 6 },
        screenWidthM: { type: Number, default: 6.0 },
        screenHeightM: { type: Number, default: 3.0 },
        totalPixels: { type: Number, default: 1179648 },
        screenWeightKg: { type: Number, default: 540 },
        powerConsumptionKw: { type: Number, default: 8.6 }
    },
    lightingConfig: {
        beamsCount: { type: Number, default: 8 },
        spotsCount: { type: Number, default: 6 },
        washesCount: { type: Number, default: 8 },
        ledBarsCount: { type: Number, default: 6 },
        blindersCount: { type: Number, default: 4 },
        hazerCount: { type: Number, default: 2 },
        showBeams: { type: Boolean, default: true },
        beamColor: { type: String, default: '#38bdf8' },
        totalLightingWeightKg: { type: Number, default: 384 },
        totalLightingPowerKw: { type: Number, default: 9.8 },
        totalDmxChannels: { type: Number, default: 420 }
    },
    totalRigging: {
        aluWeight: { type: Number, default: 360 },
        screenWeight: { type: Number, default: 540 },
        lightingWeight: { type: Number, default: 384 },
        cablesWeight: { type: Number, default: 120 },
        totalSuspendedLoadKg: { type: Number, default: 1404 },
        pointLoadPerMotorKg: { type: Number, default: 351 },
        pointLoadLimitKg: { type: Number, default: 1000 },
        motorSafetyPercentage: { type: Number, default: 35.1 },
        isOverload: { type: Boolean, default: false }
    },
    totalPower: {
        screenPowerKw: { type: Number, default: 8.6 },
        lightingPowerKw: { type: Number, default: 9.8 },
        audioAndExtraKw: { type: Number, default: 5.0 },
        totalKw: { type: Number, default: 23.4 },
        triAmps380V: { type: Number, default: 35.5 },
        monoAmps220V: { type: Number, default: 106.4 }
    },
    equipmentBOM: [{
        category: String,
        name: String,
        spec: String,
        quantity: Number,
        unitWeightKg: Number,
        totalWeightKg: Number
    }],
    notes: { 
        type: String, 
        default: '' 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    createdByName: { 
        type: String, 
        default: 'Utilisateur Bright Stage' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model('StageConception', StageConceptionSchema);
