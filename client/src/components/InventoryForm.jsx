import React, { useState, useEffect, useMemo } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useNotification } from '../context/NotificationContext';
import {
    Package,
    Building2,
    Cpu,
    Layers,
    MapPin,
    Warehouse,
    Grid,
    Box,
    QrCode,
    Barcode,
    FileText,
    X,
    Sparkles,
    Pencil,
    Coins,
    Hash,
    Zap,
    CheckCircle2,
    AlertCircle,
    Wrench,
    XCircle,
    ChevronDown,
    Save,
    RotateCcw
} from 'lucide-react';
import './InventoryForm.css';

const STATE_OPTIONS = [
    { id: 'Fonctionnel', label: 'Fonctionnel', color: '#10b981', className: 'state-fonctionnel', Icon: CheckCircle2 },
    { id: 'à vérifier', label: 'À vérifier', color: '#f59e0b', className: 'state-a-verifier', Icon: AlertCircle },
    { id: 'à réparer', label: 'À réparer', color: '#f97316', className: 'state-a-reparer', Icon: Wrench },
    { id: 'Cassé', label: 'Cassé', color: '#ef4444', className: 'state-casse', Icon: XCircle },
    { id: 'Pièces manquantes', label: 'Pièces manquantes', color: '#8b5cf6', className: 'state-pieces-manquantes', Icon: Layers }
];

const CATEGORIES = [
    'Accessoires image', 'Accessoires lumière', 'Accessoires son', 'Accessoires structure',
    'Câblage DMX', 'Câblage XLR', 'Câblage réseau', 'Câblage source',
    'Câblage électrique P17', 'Câblage électrique PCE', 'Distribution électrique',
    'Lumière rechargable', 'Lumière standard', 'Lumière théâtrale', 'Machines de scène',
    'Équipement bureautique', 'Microphonie', 'Multiprises', 'Outillage de maintenance',
    'Outillage de sécurité du site', 'Outillage du personnel', 'Outillage partagé',
    'Régie image', 'Régie lumière', 'Régie son', 'Scène', 'Sonorisation',
    'Structure métallique', 'Tissus & bâches', 'Téléviseurs', 'Écran LED'
].sort();

const InventoryForm = ({ itemToEdit, onClose, onSuccess }) => {
    const { showSuccess, showError } = useNotification() || {};
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        brand: '',
        model: '',
        serialNumbers: '',
        'storageLocation.zone': '',
        'storageLocation.shelving': '',
        'storageLocation.shelf': '',
        category: 'Écran LED',
        state: 'Fonctionnel',
        rentalPricePerDay: 0,
        barcode: '',
        notes: ''
    });

    // Populate data when editing
    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                name: itemToEdit.name || '',
                quantity: itemToEdit.quantity ?? 0,
                brand: itemToEdit.brand || '',
                model: itemToEdit.model || '',
                serialNumbers: Array.isArray(itemToEdit.serialNumbers) ? itemToEdit.serialNumbers.join(', ') : (itemToEdit.serialNumbers || ''),
                'storageLocation.zone': itemToEdit.storageLocation?.zone || '',
                'storageLocation.shelving': itemToEdit.storageLocation?.shelving || '',
                'storageLocation.shelf': itemToEdit.storageLocation?.shelf || '',
                category: itemToEdit.category || 'Écran LED',
                state: itemToEdit.state || 'Fonctionnel',
                rentalPricePerDay: itemToEdit.rentalPricePerDay ?? 0,
                barcode: itemToEdit.barcode || '',
                notes: itemToEdit.notes || ''
            });
        }
    }, [itemToEdit]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStateSelect = (stateId) => {
        setFormData(prev => ({ ...prev, state: stateId }));
    };

    const handleGenerateBarcode = () => {
        const prefix = 'BS';
        const cleanCat = (formData.category || 'EQ')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .substring(0, 3)
            .toUpperCase()
            .replace(/[^A-Z]/g, 'X');
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const code = `${prefix}-${cleanCat}-${randomNum}`;
        setFormData(prev => ({ ...prev, barcode: code }));
    };

    // Serial numbers parsed list
    const serialChips = useMemo(() => {
        if (!formData.serialNumbers) return [];
        return formData.serialNumbers
            .split(/[,;\n]+/)
            .map(s => s.trim())
            .filter(Boolean);
    }, [formData.serialNumbers]);

    // Total valuation per day
    const totalDailyValuation = useMemo(() => {
        const qty = parseInt(formData.quantity, 10) || 0;
        const price = parseFloat(formData.rentalPricePerDay) || 0;
        return (qty * price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }, [formData.quantity, formData.rentalPricePerDay]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                quantity: parseInt(formData.quantity, 10) || 0,
                rentalPricePerDay: parseFloat(formData.rentalPricePerDay) || 0,
                serialNumbers: formData.serialNumbers
                    ? formData.serialNumbers.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
                    : [],
                storageLocation: {
                    zone: formData['storageLocation.zone'],
                    shelving: formData['storageLocation.shelving'],
                    shelf: formData['storageLocation.shelf']
                }
            };

            if (!formData.barcode || !formData.barcode.trim()) {
                delete payload.barcode;
            }

            delete payload['storageLocation.zone'];
            delete payload['storageLocation.shelving'];
            delete payload['storageLocation.shelf'];

            if (itemToEdit?._id) {
                await inventoryService.update(itemToEdit._id, payload);
                if (showSuccess) showSuccess("Équipement mis à jour avec succès", "Inventaire");
            } else {
                await inventoryService.create(payload);
                if (showSuccess) showSuccess("Nouvel équipement ajouté au stock", "Inventaire");
            }

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed saving inventory item", err);
            if (showError) {
                showError(err.response?.data?.error || err.message, "Erreur d'enregistrement");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const currentState = STATE_OPTIONS.find(s => s.id === formData.state) || STATE_OPTIONS[0];

    return (
        <div className="modal-overlay-blur" onClick={onClose}>
            <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient Top Glow */}
                <div className="modal-ambient-glow" />

                {/* Header */}
                <div className="modal-header-vibrant">
                    <div className="modal-header-left">
                        <div className="modal-header-icon-badge">
                            {itemToEdit ? <Pencil size={22} /> : <Sparkles size={22} />}
                        </div>
                        <div className="modal-header-text">
                            <h2>{itemToEdit ? "Modifier l'Équipement" : "Ajouter un Équipement"}</h2>
                            <div className="modal-header-subtext">
                                <span>{itemToEdit ? (itemToEdit.name || "Édition de l'actif") : "Enregistrement dans l'inventaire Bright Stage"}</span>
                                {formData.category && (
                                    <span className="header-meta-pill">
                                        <Layers size={11} /> {formData.category}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button type="button" className="close-x-btn" onClick={onClose} title="Fermer (Échap)">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form id="inventory-form" onSubmit={handleSubmit} className="premium-form-body">
                    
                    {/* Section 1: Informations Générales */}
                    <div className="form-section-card">
                        <div className="section-card-header">
                            <div className="section-card-title">
                                <Package size={16} /> Informations Principales
                            </div>
                            <span className="section-card-badge">Identification</span>
                        </div>

                        <div className="grid-two-cols">
                            {/* Asset Name (Full width) */}
                            <div className="field-group-full">
                                <label className="premium-label">
                                    <Package size={13} />
                                    Désignation de l'actif <span className="required-star">*</span>
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Package size={16} /></span>
                                    <input
                                        required
                                        name="name"
                                        className="premium-field-input"
                                        placeholder="Ex: LED display panel (écran LED) curved, Beam 300..."
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Brand */}
                            <div className="field-group">
                                <label className="premium-label">
                                    <Building2 size={13} />
                                    Marque (Brand)
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Building2 size={16} /></span>
                                    <input
                                        name="brand"
                                        className="premium-field-input"
                                        placeholder="Ex: UNILUMIN, Robe, Shure..."
                                        value={formData.brand}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Model */}
                            <div className="field-group">
                                <label className="premium-label">
                                    <Cpu size={13} />
                                    Modèle (Model)
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Cpu size={16} /></span>
                                    <input
                                        name="model"
                                        className="premium-field-input"
                                        placeholder="Ex: Upad III, Pointe, SM58..."
                                        value={formData.model}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Category (Full width) */}
                            <div className="field-group-full">
                                <label className="premium-label">
                                    <Layers size={13} />
                                    Catégorie de matériel
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Layers size={16} /></span>
                                    <select
                                        name="category"
                                        className="premium-field-input premium-select"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <span className="input-trailing-icon"><ChevronDown size={15} /></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: État du Matériel & Disponibilité */}
                    <div className="form-section-card">
                        <div className="section-card-header">
                            <div className="section-card-title">
                                <currentState.Icon size={16} style={{ color: currentState.color }} />
                                État & Disponibilité du Matériel
                            </div>
                            <span className="section-card-badge" style={{ color: currentState.color, borderColor: currentState.color }}>
                                ● {currentState.label}
                            </span>
                        </div>

                        {/* State Selection Pills */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="premium-label">
                                État opérationnel du matériel
                            </label>
                            <div className="state-pills-row">
                                {STATE_OPTIONS.map(s => {
                                    const isActive = formData.state === s.id;
                                    const PillIcon = s.Icon;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            className={`state-pill-btn ${s.className} ${isActive ? 'active-state' : ''}`}
                                            onClick={() => handleStateSelect(s.id)}
                                        >
                                            <span
                                                className="state-dot-indicator"
                                                style={{ backgroundColor: s.color }}
                                            />
                                            <PillIcon size={14} />
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantity & Rental Price */}
                        <div className="grid-two-cols">
                            <div className="field-group">
                                <label className="premium-label">
                                    <Box size={13} />
                                    Quantité en stock
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Box size={16} /></span>
                                    <input
                                        type="number"
                                        min="0"
                                        name="quantity"
                                        className="premium-field-input has-trailing-badge"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                    />
                                    <span className="input-trailing-badge">unités</span>
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="premium-label">
                                    <Coins size={13} />
                                    Prix de Location / Jour
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Coins size={16} /></span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        name="rentalPricePerDay"
                                        className="premium-field-input has-trailing-badge"
                                        value={formData.rentalPricePerDay}
                                        onChange={handleChange}
                                    />
                                    <span className="input-trailing-badge">TND / jour</span>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Valuation Summary */}
                        {parseInt(formData.quantity, 10) > 0 && parseFloat(formData.rentalPricePerDay) > 0 && (
                            <div className="calc-value-banner">
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={14} /> Valorisation locative totale ({formData.quantity} unités × {formData.rentalPricePerDay} TND) :
                                </span>
                                <span className="calc-value-amount">
                                    {totalDailyValuation} TND / jour
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Emplacement dans l'Entrepôt */}
                    <div className="form-section-card">
                        <div className="section-card-header">
                            <div className="section-card-title">
                                <MapPin size={16} /> Emplacement dans le Dépôt
                            </div>
                            <span className="section-card-badge">Stockage physique</span>
                        </div>

                        {/* Live Breadcrumb View */}
                        <div className="location-live-banner">
                            <div className="location-live-title">
                                <Warehouse size={16} />
                                <span>Repère Magasin :</span>
                            </div>
                            <div className="location-live-path">
                                <span className="path-step-badge">
                                    Zone : <strong>{formData['storageLocation.zone'] || 'Non définie'}</strong>
                                </span>
                                <span className="path-separator">›</span>
                                <span className="path-step-badge">
                                    Rayon : <strong>{formData['storageLocation.shelving'] || '—'}</strong>
                                </span>
                                <span className="path-separator">›</span>
                                <span className="path-step-badge">
                                    Étagère : <strong>{formData['storageLocation.shelf'] || '—'}</strong>
                                </span>
                            </div>
                        </div>

                        {/* 3 Columns for Zone, Shelving, Shelf */}
                        <div className="grid-three-cols">
                            <div className="field-group">
                                <label className="premium-label">
                                    <Warehouse size={13} /> Zone / Hangar
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Warehouse size={15} /></span>
                                    <input
                                        placeholder="Ex: Zone A, Régie..."
                                        name="storageLocation.zone"
                                        className="premium-field-input"
                                        value={formData['storageLocation.zone']}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="premium-label">
                                    <Grid size={13} /> Rayon / Allée
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Grid size={15} /></span>
                                    <input
                                        placeholder="Ex: Rayon 1, Allée B..."
                                        name="storageLocation.shelving"
                                        className="premium-field-input"
                                        value={formData['storageLocation.shelving']}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="premium-label">
                                    <Box size={13} /> Étagère / Niveau
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Box size={15} /></span>
                                    <input
                                        placeholder="Ex: Niveau 1, Bac 3..."
                                        name="storageLocation.shelf"
                                        className="premium-field-input"
                                        value={formData['storageLocation.shelf']}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Traçabilité & Identification */}
                    <div className="form-section-card">
                        <div className="section-card-header">
                            <div className="section-card-title">
                                <Barcode size={16} /> Traçabilité & Numéros
                            </div>
                            <span className="section-card-badge">QR & Série</span>
                        </div>

                        <div className="grid-two-cols">
                            {/* Barcode with Quick Generator */}
                            <div className="field-group">
                                <label className="premium-label">
                                    <QrCode size={13} />
                                    Code-barres / Identifiant QR
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Barcode size={16} /></span>
                                    <input
                                        name="barcode"
                                        className="premium-field-input has-trailing-btn"
                                        placeholder="Scanner ou saisir un code..."
                                        value={formData.barcode}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="barcode-gen-btn"
                                        onClick={handleGenerateBarcode}
                                        title="Générer automatiquement un code"
                                    >
                                        <Zap size={13} /> Générer
                                    </button>
                                </div>
                            </div>

                            {/* Serial Numbers */}
                            <div className="field-group">
                                <label className="premium-label">
                                    <Hash size={13} />
                                    Numéros de Série
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-leading-icon"><Hash size={16} /></span>
                                    <input
                                        name="serialNumbers"
                                        className="premium-field-input"
                                        value={formData.serialNumbers}
                                        onChange={handleChange}
                                        placeholder="SN001, SN002, SN003..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Serial Number Tags Preview */}
                        {serialChips.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <div className="serial-counter-text">
                                    <Hash size={13} />
                                    <span>
                                        {serialChips.length} numéro{serialChips.length > 1 ? 's' : ''} de série identifié{serialChips.length > 1 ? 's' : ''} :
                                    </span>
                                </div>
                                <div className="serial-chips-preview">
                                    {serialChips.map((sn, idx) => (
                                        <span key={idx} className="serial-tag-pill">
                                            {sn}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 5: Remarques & Notes */}
                    <div className="form-section-card">
                        <div className="section-card-header">
                            <div className="section-card-title">
                                <FileText size={16} /> Notes & Remarques de Maintenance
                            </div>
                            <span className="section-card-badge">Optionnel</span>
                        </div>

                        <div className="field-group-full">
                            <div className="input-with-icon" style={{ alignItems: 'flex-start' }}>
                                <span className="input-leading-icon" style={{ top: '14px' }}>
                                    <FileText size={16} />
                                </span>
                                <textarea
                                    name="notes"
                                    className="premium-textarea"
                                    placeholder="Détails sur l'état d'usure, historique de réparation, accessoires inclus..."
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer Actions */}
                <div className="modal-footer-actions">
                    <div className="modal-footer-left">
                        {itemToEdit?._id && (
                            <span className="footer-id-pill">
                                ID: {itemToEdit._id.slice(-8)}
                            </span>
                        )}
                    </div>
                    <div className="modal-footer-right">
                        <button
                            type="button"
                            onClick={onClose}
                            className="premium-cancel-btn"
                            disabled={submitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            form="inventory-form"
                            className="premium-save-btn"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <RotateCcw size={16} className="spin-animation" /> Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    {itemToEdit ? "Enregistrer les modifications" : "Ajouter au Stock"}
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InventoryForm;
