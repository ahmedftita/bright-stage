const mongoose = require('mongoose');

const StageModelSchema = new mongoose.Schema({
    eventName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    siteName: { 
        type: String, 
        default: '' 
    },
    length: { 
        type: Number, 
        required: true, 
        default: 6 
    }, // L modules
    width: { 
        type: Number, 
        required: true, 
        default: 4 
    },  // l modules
    heightId: { 
        type: String, 
        default: 'h55' 
    },
    heightM: { 
        type: Number, 
        default: 0.55 
    },
    surfaceM2: { 
        type: Number, 
        default: 0 
    },
    includeStairs: { 
        type: Boolean, 
        default: true 
    },
    stairsCount: { 
        type: Number, 
        default: 1 
    },
    includeGuardrails: { 
        type: Boolean, 
        default: false 
    },
    guardrailSides: { 
        type: String, 
        default: 'back-sides' 
    },
    counts: {
        stagePlaques: { type: Number, default: 0 },
        stagePieds: { type: Number, default: 0 },
        stageCotes: { type: Number, default: 0 },
        stairs: { type: Number, default: 0 },
        stairSteps: { type: Number, default: 0 },
        guardrails: { type: Number, default: 0 }
    },
    totalLoadCapacityKg: { 
        type: Number, 
        default: 0 
    },
    totalWeightKg: { 
        type: Number, 
        default: 0 
    },
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

module.exports = mongoose.model('StageModel', StageModelSchema);
