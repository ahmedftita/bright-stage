const mongoose = require('mongoose');

const MaintenanceTicketSchema = new mongoose.Schema({
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    reportedBy: { type: String, required: true }, // User/Technician Name
    reportedByRole: { type: String },
    issueDescription: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    state: { type: String, default: 'à vérifier' },
    notes: { type: String },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    status: {
        type: String,
        enum: ['Open', 'In Review', 'Sent to Repair', 'In Maintenance', 'Fixed', 'Unfixable', 'Resolved'],
        default: 'Open'
    },
    quantityDeducted: { type: Boolean, default: false },
    deductedQuantity: { type: Number, default: 0 },
    repairCost: { type: Number, default: 0 },
    repairNotes: { type: String },
    dateReported: { type: Date, default: Date.now },
    dateResolved: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);
