const mongoose = require('mongoose');

const StructureModelSchema = new mongoose.Schema({
    eventName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    siteName: { 
        type: String, 
        default: '' 
    },
    structureType: { 
        type: String, 
        enum: ['grid', 'goalpost'],
        default: 'grid' 
    },
    towerType: { 
        type: String, 
        default: 'PT34' 
    },
    gridTypeL: { 
        type: String, 
        default: 'PT34' 
    },
    gridTypeW: { 
        type: String, 
        default: 'PT34' 
    },
    length: { 
        type: Number, 
        required: true, 
        default: 8 
    },
    width: { 
        type: Number, 
        required: true, 
        default: 6 
    },
    height: { 
        type: Number, 
        required: true, 
        default: 6 
    },
    ledWeight: { 
        type: Number, 
        default: 500 
    },
    totals: {
        s3: { type: Number, default: 0 },
        s2: { type: Number, default: 0 },
        s1: { type: Number, default: 0 },
        s05: { type: Number, default: 0 },
        corners: { type: Number, default: 0 },
        tJunctions: { type: Number, default: 0 },
        xJunctions: { type: Number, default: 0 },
        bases: { type: Number, default: 0 },
        hinges: { type: Number, default: 0 },
        motors: { type: Number, default: 0 }
    },
    aluWeight: { 
        type: Number, 
        default: 0 
    },
    totalLoad: { 
        type: Number, 
        default: 0 
    },
    pointLoad: { 
        type: Number, 
        default: 0 
    },
    pointLoadLimit: { 
        type: Number, 
        default: 0 
    },
    loadPercentage: { 
        type: Number, 
        default: 0 
    },
    isOverload: { 
        type: Boolean, 
        default: false 
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

module.exports = mongoose.model('StructureModel', StructureModelSchema);
