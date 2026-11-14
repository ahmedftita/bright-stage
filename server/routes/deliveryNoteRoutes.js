const express = require('express');
const router = express.Router();
const DeliveryNote = require('../models/DeliveryNote');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/authMiddleware');

// Middleware to check Project Access
/**
 * @param {import('express').Request & {user: any}} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
const checkProjectAccess = async (req, res, next) => {
    try {
        if (['Founder', 'Manager'].includes(req.user.role)) {
            return next();
        }

        const deliveryNoteId = req.params.id;
        let projectId = req.body.project;
        let isIndividual = req.body.isIndividual;

        // If checking existing BL, get project/status from ID
        if (deliveryNoteId) {
            const note = await DeliveryNote.findById(deliveryNoteId);
            if (!note) return res.status(404).json({ error: 'Delivery Note not found' });
            projectId = note.project;
            isIndividual = note.isIndividual;

            // Site Managers can access their own individual notes
            if (isIndividual && note.createdBy.toString() === req.user._id.toString()) {
                return next();
            }
        } else if (isIndividual) {
            // For creating new individual notes
            return next();
        }

        if (!projectId && !isIndividual) {
            return res.status(400).json({ error: 'Project ID required for non-individual notes' });
        }

        // Skip project check if it's an individual note without a project
        if (projectId) {
            const project = await Project.findById(projectId);
            if (!project) return res.status(404).json({ error: 'Project not found' });

            // Check if Site Manager is in assignedUsers or is the assigned site manager
            // Note: Project model has `assignedUsers` array of ObjectIds
            const isAssigned = project.assignedUsers && project.assignedUsers.some(
                id => id.toString() === req.user._id.toString()
            );

            if (req.user.role === 'Site Manager' && isAssigned) {
                return next();
            }
        }

        return res.status(403).json({ error: 'Not authorized for this delivery note or project' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// DEV MOCK NOTES (Used when DB is offline)
const MOCK_NOTES = [
    {
        _id: '6a6286830bf0b3965f5f3c2f',
        number: 'BL-2026-001',
        date: new Date('2026-04-20'),
        returnDate: new Date('2026-04-25'),
        address: 'Carthage, Tunis',
        driverName: 'Mohamed Zarrouk',
        driverCin: '14330388',
        vehiclePlate: '234 TU 1503',
        status: 'Validated',
        project: { eventName: 'Ouverture Cafe', siteName: 'Carthage' },
        items: [
            { name: 'MONOTUBE 2 Metre', quantity: 16 },
            { name: 'Tete de tour PT-34 (longue)', quantity: 8 },
            { name: 'Palan a chaine (balanko)', quantity: 8 }
        ]
    },
    {
        _id: '6a628d131da210a9c2fffc83',
        number: 'BL-2026-002',
        date: new Date('2026-04-26'),
        returnDate: new Date('2026-04-28'),
        address: 'Sousse',
        driverName: 'Mohamed Zarrouk',
        driverCin: '14330388',
        vehiclePlate: '234 TU 1503',
        status: 'Validated',
        project: { eventName: 'MONIA SKHIRI SOUSSE', siteName: 'Sousse' },
        items: [
            { name: 'moving head 3 in 1 / beam 300', quantity: 4 },
            { name: 'par Omnilight', quantity: 12 },
            { name: 'decoupe', quantity: 1 }
        ]
    }
];

// GET All (Filtered)
router.get('/', protect, 
    /** 
     * @param {import('express').Request & {user: any}} req 
     * @param {import('express').Response} res 
     */
    async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Site Manager') {
            const projects = await Project.find({ assignedUsers: req.user._id }).select('_id');
            query = {
                $or: [
                    { project: { $in: projects.map(p => p._id) } },
                    { isIndividual: true, createdBy: req.user._id }
                ]
            };
        } else if (!['Founder', 'Manager', 'Storekeeper'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const notesPromise = DeliveryNote.find(query)
            .populate('client', 'name contactPerson phone taxId matriculeFiscal')
            .populate('project', 'eventName siteName')
            .populate('carrier', 'firstName lastName vehiclePlate')
            .populate('createdBy', 'name')
            .sort({ date: -1 });

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000));
        const notes = await Promise.race([notesPromise, timeout]);

        res.json(notes);
    } catch (err) {
        console.warn("[DeliveryNote] DB query failed or timed out, returning fallback notes:", err.message);
        res.json(MOCK_NOTES);
    }
});

// GET Single
router.get('/:id', protect, checkProjectAccess, async (req, res) => {
    try {
        const note = await DeliveryNote.findById(req.params.id)
            .populate('client')
            .populate({
                path: 'project',
                populate: { path: 'clientId' }
            })
            .populate('carrier')
            .populate('items.inventoryItem');
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
router.post('/', protect, checkProjectAccess, 
    /** 
     * @param {import('express').Request & {user: any}} req 
     * @param {import('express').Response} res 
     */
    async (req, res) => {
    try {
        const newNote = new DeliveryNote({
            ...req.body,
            createdBy: req.user._id
        });
        const saved = await newNote.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("POST /delivery-notes - error:", err);
        res.status(400).json({ error: err.message });
    }
});

// UPDATE
router.put('/:id', protect, checkProjectAccess, async (req, res) => {
    try {
        const updated = await DeliveryNote.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        console.error("PUT /delivery-notes - error:", err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', protect, checkProjectAccess, async (req, res) => {
    try {
        await DeliveryNote.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PDF Generation — accepts ?token= query param (for window.open() calls from browser)
router.get('/:id/pdf',
    /** 
     * @param {import('express').Request & {user: any}} req 
     * @param {import('express').Response} res 
     */
    async (req, res) => {
    // Support token via query param (used by window.open which can't set headers)
    if (req.query.token && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }

    // Run protect then checkProjectAccess inline
    const jwt = require('jsonwebtoken');
    const SECRET_KEY = 'brightstage_secret_key_123';
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
        const decoded = jwt.verify(token, SECRET_KEY);
        try {
            const User = require('../models/User');
            const dbUser = await User.findById(decoded.id).select('-password');
            req.user = dbUser || { _id: decoded.id, name: decoded.name, role: decoded.role };
        } catch {
            req.user = { _id: decoded.id, name: decoded.name, role: decoded.role };
        }
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // checkProjectAccess inline for PDF
    if (!['Founder', 'Manager'].includes(req.user.role)) {
        const note = await DeliveryNote.findById(req.params.id).catch(() => null);
        if (!note) return res.status(404).json({ error: 'Delivery Note not found' });
        const isSiteManagerOwn = note.isIndividual && note.createdBy?.toString() === req.user._id?.toString();
        if (!isSiteManagerOwn) {
            const assignedProject = await Project.findOne({ _id: note.project, assignedUsers: req.user._id }).catch(() => null);
            if (!assignedProject) return res.status(403).json({ error: 'Not authorized for this delivery note' });
        }
    }

    try {
        let note = null;
        try {
            const notePromise = DeliveryNote.findById(req.params.id)
                .populate('client')
                .populate({
                    path: 'project',
                    populate: { path: 'clientId' }
                })
                .populate('carrier');
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000));
            note = await Promise.race([notePromise, timeout]);
        } catch (dbErr) {
            console.warn("[PDF Route] DB query failed or timed out, using fallback note:", dbErr.message);
            note = MOCK_NOTES.find(n => n._id === req.params.id) || MOCK_NOTES[0];
        }

        if (!note) note = MOCK_NOTES[0];

        const companyId = String(req.query.company || 'bright');
        const CompanySettings = require('../models/CompanySettings');
        let settings = null;
        try {
            const settingsPromise = CompanySettings.findOne({ companyKey: companyId });
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000));
            settings = await Promise.race([settingsPromise, timeout]);
        } catch { settings = null; }

        const PdfService = require('../services/PdfService');
        const isReturn = req.query.type === 'return';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${note.number || 'BL'}.pdf"`);

        PdfService.generateDeliveryNote(note, res, companyId, settings, isReturn);
    } catch (err) {
        console.error("Error in PDF generation route:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

module.exports = router;

