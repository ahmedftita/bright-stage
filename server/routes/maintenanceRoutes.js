const express = require('express');
const router = express.Router();
const MaintenanceTicket = require('../models/MaintenanceTicket');
const InventoryItem = require('../models/InventoryItem');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get All Tickets
router.get('/', async (req, res) => {
    try {
        const tickets = await MaintenanceTicket.find().populate('inventoryItem').sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Ticket
router.post('/', async (req, res) => {
    try {
        const ticket = new MaintenanceTicket(req.body);
        const savedTicket = await ticket.save();

        // Auto-update item state
        await InventoryItem.findByIdAndUpdate(req.body.inventoryItem, { state: 'à vérifier' });

        res.status(201).json(savedTicket);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Inventory Item State & Synchronize Maintenance Ticket
router.put('/item-state/:itemId', async (req, res) => {
    try {
        const { state, notes, ticketId, reportedBy, quantity, reportedByRole } = req.body || {};
        const validStates = ['Fonctionnel', 'Pièces manquantes', 'Cassé', 'à vérifier', 'à réparer'];
        if (!validStates.includes(state)) {
            return res.status(400).json({ error: 'Invalid state' });
        }

        const item = await InventoryItem.findById(req.params.itemId);
        if (!item) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        const qtyVal = quantity ? parseInt(quantity, 10) : 1;

        // If ticketId is provided, update that specific ticket
        if (ticketId) {
            const ticket = await MaintenanceTicket.findById(ticketId);
            if (ticket) {
                if (state === 'Fonctionnel') {
                // If quantity was deducted when put En Maintenance, restore it back to inventory
                if (ticket.quantityDeducted) {
                    const qtyToRestore = ticket.deductedQuantity || ticket.quantity || 1;
                    item.quantity += qtyToRestore;
                    ticket.quantityDeducted = false;
                    ticket.deductedQuantity = 0;
                }
                ticket.status = 'Fixed';
                ticket.state = 'Fonctionnel';
                ticket.dateResolved = new Date();
            } else if (state === 'à réparer') {
                    ticket.status = 'Sent to Repair';
                    ticket.state = 'à réparer';
                } else if (state === 'Cassé') {
                    ticket.status = 'Open';
                    ticket.state = 'Cassé';
                    ticket.severity = 'Critical';
                } else if (state === 'à vérifier') {
                    ticket.status = 'In Review';
                    ticket.state = 'à vérifier';
                }
                if (notes) {
                    ticket.repairNotes = notes;
                    ticket.notes = notes;
                    ticket.issueDescription = notes;
                }
                if (quantity) ticket.quantity = qtyVal;
                if (reportedBy) ticket.reportedBy = reportedBy;
                if (reportedByRole) ticket.reportedByRole = reportedByRole;
                await ticket.save();
            }

            // Sync item state
            if (state === 'Fonctionnel') {
                const otherOpen = await MaintenanceTicket.findOne({
                    inventoryItem: item._id,
                    _id: { $ne: ticketId },
                    status: { $nin: ['Fixed', 'Resolved'] }
                });
                item.state = otherOpen ? (otherOpen.state || 'à réparer') : 'Fonctionnel';
            } else {
                item.state = state;
            }
            await item.save();

        } else if (state !== 'Fonctionnel') {
            // ALWAYS create a new ticket for each user's request so all requests from all users are visible
            item.state = state;
            await item.save();

            await MaintenanceTicket.create({
                inventoryItem: item._id,
                reportedBy: reportedBy || 'Utilisateur',
                reportedByRole: reportedByRole || '',
                issueDescription: notes || `Signalement: ${state}`,
                repairNotes: notes || '',
                notes: notes || '',
                quantity: qtyVal,
                state: state,
                severity: state === 'Cassé' ? 'Critical' : (state === 'à réparer' ? 'High' : 'Medium'),
                status: state === 'à réparer' ? 'Sent to Repair' : (state === 'à vérifier' ? 'In Review' : 'Open')
            });
        } else if (state === 'Fonctionnel') {
            item.state = 'Fonctionnel';
            await item.save();

            // Close any open tickets for this item
            await MaintenanceTicket.updateMany(
                { inventoryItem: item._id, status: { $nin: ['Fixed', 'Resolved'] } },
                { status: 'Fixed', state: 'Fonctionnel', dateResolved: new Date(), repairNotes: notes || 'Remis en état fonctionnel' }
            );
        }

        res.json({ success: true, item });
    } catch (err) {
        console.error("Error updating item state:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update Ticket
router.put('/:id', async (req, res) => {
    try {
        const updatedTicket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (req.body.status === 'Fixed') {
            await InventoryItem.findByIdAndUpdate(updatedTicket.inventoryItem, { state: 'Fonctionnel' });
            updatedTicket.dateResolved = new Date();
            await updatedTicket.save();
        }

        res.json(updatedTicket);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start Maintenance: Deduct product quantity from inventory until Remettre en service
router.put('/:id/start-maintenance', async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: "Ticket de maintenance non trouvé" });

        if (ticket.quantityDeducted) {
            return res.status(400).json({ error: "Cet équipement est déjà en maintenance (quantité déjà déduite)." });
        }

        const item = await InventoryItem.findById(ticket.inventoryItem);
        if (!item) return res.status(404).json({ error: "Équipement inventaire non trouvé" });

        const qtyToDeduct = ticket.quantity && ticket.quantity > 0 ? ticket.quantity : 1;
        if (item.quantity < qtyToDeduct) {
            return res.status(400).json({ 
                error: `Stock insuffisant pour passer en maintenance (${qtyToDeduct} demandé(s), stock disponible: ${item.quantity}).` 
            });
        }

        // Deduct quantity from inventory
        item.quantity -= qtyToDeduct;
        await item.save();

        ticket.status = 'In Maintenance';
        ticket.quantityDeducted = true;
        ticket.deductedQuantity = qtyToDeduct;
        await ticket.save();

        res.json({
            success: true,
            message: `Équipement mis En Maintenance. ${qtyToDeduct} unité(s) retirée(s) du stock disponible.`,
            ticket,
            remainingStock: item.quantity
        });
    } catch (err) {
        console.error("Error starting maintenance:", err);
        res.status(500).json({ error: err.message });
    }
});

// Resolve Ticket Alias: Restore quantity if deducted & mark Fixed
router.put('/:id/resolve', async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });

        const item = await InventoryItem.findById(ticket.inventoryItem);
        if (item) {
            if (ticket.quantityDeducted) {
                const qtyToRestore = ticket.deductedQuantity || ticket.quantity || 1;
                item.quantity += qtyToRestore;
                ticket.quantityDeducted = false;
                ticket.deductedQuantity = 0;
            }
            const otherOpen = await MaintenanceTicket.findOne({
                inventoryItem: item._id,
                _id: { $ne: ticket._id },
                status: { $nin: ['Fixed', 'Resolved'] }
            });
            item.state = otherOpen ? (otherOpen.state || 'à réparer') : 'Fonctionnel';
            await item.save();
        }

        ticket.status = 'Fixed';
        ticket.state = 'Fonctionnel';
        ticket.dateResolved = new Date();
        ticket.repairNotes = req.body?.resolutionNotes || req.body?.repairNotes || "Remis en service fonctionnel";
        await ticket.save();

        res.json({ success: true, ticket, item });
    } catch (err) {
        console.error("Error resolving ticket:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete All Maintenance Tickets
router.delete('/all', async (req, res) => {
    try {
        const result = await MaintenanceTicket.deleteMany({});
        res.json({ message: "All maintenance tickets deleted", count: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Single Ticket
router.delete('/:id', async (req, res) => {
    try {
        await MaintenanceTicket.findByIdAndDelete(req.params.id);
        res.json({ message: "Ticket deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
