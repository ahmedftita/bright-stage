import React from 'react';
import './SubcontractedModal.css';
import {
    Handshake,
    Video,
    Volume2,
    Lightbulb,
    Layers,
    Zap,
    Package,
    Tag,
    Building2,
    Banknote,
    Save,
    X,
    Hash
} from 'lucide-react';

const SUBCONTRACT_CATEGORIES = [
    { id: 'Vidéo', label: 'Vidéo & LED', icon: Video, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
    { id: 'Sonorisation', label: 'Sonorisation', icon: Volume2, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
    { id: 'Lumière', label: 'Lumière', icon: Lightbulb, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
    { id: 'Structure', label: 'Structure', icon: Layers, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)' },
    { id: 'Énergie', label: 'Énergie', icon: Zap, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' }
];

const GEAR_PRESETS = [
    { name: 'Robe MegaPointe', brand: 'Robe', model: 'MegaPointe Beam/Spot', category: 'Lumière', cost: 120, icon: Lightbulb },
    { name: 'Claypaky Sharpy Plus', brand: 'Claypaky', model: 'Sharpy Plus Wash', category: 'Lumière', cost: 100, icon: Lightbulb },
    { name: 'L-Acoustics K2 Line Array', brand: 'L-Acoustics', model: 'K2 Enceinte 3 voies', category: 'Sonorisation', cost: 250, icon: Volume2 },
    { name: 'Mur LED P3.9 Outdoor', brand: 'Absen', model: 'P3.9 500x1000mm', category: 'Vidéo', cost: 180, icon: Video },
    { name: 'Groupe 100 kVA Insonorisé', brand: 'SDMO', model: '100 kVA Triphasé', category: 'Énergie', cost: 350, icon: Zap },
    { name: 'Pont Eurotruss FD34 3m', brand: 'Eurotruss', model: 'FD34 Structure Carrée', category: 'Structure', cost: 40, icon: Layers }
];

const COST_PRESETS = [50, 100, 150, 250, 350, 500];

const SubcontractedModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    editItem
}) => {
    if (!isOpen) return null;

    const currentCat = formData.category || 'Vidéo';
    const activeCatObj = SUBCONTRACT_CATEGORIES.find(c => c.id === currentCat) || SUBCONTRACT_CATEGORIES[0];
    const ActiveCatIcon = activeCatObj.icon;

    const qty = parseInt(formData.quantity) || 1;
    const unitCost = parseFloat(formData.costPerDay) || 0;
    const totalCost = qty * unitCost;

    const handleSelectPreset = (preset) => {
        setFormData({
            ...formData,
            name: preset.name,
            brand: preset.brand,
            model: preset.model,
            category: preset.category,
            costPerDay: preset.cost
        });
    };

    const handleSelectCost = (cost) => {
        setFormData({
            ...formData,
            costPerDay: cost
        });
    };

    return (
        <div className="subcontract-modal-overlay" onClick={onClose}>
            <div className="subcontract-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow backdrop */}
                <div className="subcontract-ambient-glow" />

                {/* Header */}
                <div className="subcontract-modal-header">
                    <div className="subcontract-header-left">
                        <div className="subcontract-header-icon-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                            <Handshake size={26} />
                        </div>
                        <div className="subcontract-header-title-group">
                            <h2>
                                {editItem ? 'Configurer la Ressource Externe' : 'Enregistrer du Matériel Sous-Traité'}
                            </h2>
                            <p className="subcontract-header-subtext">
                                Référencement de matériel tiers, tarification journalière et suivi fournisseur
                            </p>
                        </div>
                    </div>

                    <div className="subcontract-header-right">
                        <span
                            className="subcontract-category-badge-pill"
                            style={{
                                background: activeCatObj.bg,
                                color: activeCatObj.color,
                                border: `1px solid ${activeCatObj.color}40`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <ActiveCatIcon size={14} />
                            <span>{activeCatObj.label}</span>
                        </span>

                        <button
                            type="button"
                            className="subcontract-close-btn"
                            onClick={onClose}
                            title="Fermer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="subcontract-modal-body">
                        {/* Section 1: Cluster Category Selection */}
                        <div className="subcontract-section-box">
                            <div className="subcontract-section-header">
                                <span className="subcontract-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Tag size={16} /> Pôle Technique & Discipline
                                </span>
                                <span className="subcontract-section-badge">Catégorie</span>
                            </div>

                            <div className="subcontract-category-grid">
                                {SUBCONTRACT_CATEGORIES.map(cat => {
                                    const CatIcon = cat.icon;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`subcontract-category-card ${currentCat === cat.id ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                        >
                                            <span className="subcontract-cat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <CatIcon size={20} />
                                            </span>
                                            <span className="subcontract-cat-label">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Resource Identity */}
                        <div className="subcontract-section-box">
                            <div className="subcontract-section-header">
                                <span className="subcontract-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Package size={16} /> Désignation & Référence Matériel
                                </span>
                                <span className="subcontract-section-badge">Fiche Produit</span>
                            </div>

                            {/* Name Input */}
                            <div className="subcontract-field-group">
                                <label className="subcontract-field-label">
                                    Désignation / Nom de la Ressource <span className="required-dot">*</span>
                                </label>
                                <div className="subcontract-input-wrapper">
                                    <span className="subcontract-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Package size={16} /></span>
                                    <input
                                        required
                                        className="subcontract-text-input"
                                        placeholder="ex. Chauvet Maverick MK2 / L-Acoustics K2"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Suggestion Chips */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Suggestions de matériels événementiels courants :
                                </div>
                                <div className="subcontract-chips-row">
                                    {GEAR_PRESETS.map((preset, idx) => {
                                        const PresetIcon = preset.icon;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={`subcontract-suggestion-chip ${formData.name === preset.name ? 'active' : ''}`}
                                                onClick={() => handleSelectPreset(preset)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <PresetIcon size={13} />
                                                <span>{preset.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Brand & Model Subgrid */}
                            <div className="subcontract-subgrid-2" style={{ marginTop: '4px' }}>
                                <div className="subcontract-field-group">
                                    <label className="subcontract-field-label">
                                        Marque / Fabricant
                                    </label>
                                    <div className="subcontract-input-wrapper">
                                        <input
                                            className="subcontract-text-input"
                                            style={{ paddingLeft: '16px' }}
                                            placeholder="ex. Robe, Claypaky, L-Acoustics"
                                            value={formData.brand || ''}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="subcontract-field-group">
                                    <label className="subcontract-field-label">
                                        Modèle / Signature
                                    </label>
                                    <div className="subcontract-input-wrapper">
                                        <input
                                            className="subcontract-text-input"
                                            style={{ paddingLeft: '16px' }}
                                            placeholder="ex. MK2 Spot / 15m³"
                                            value={formData.model || ''}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Provider / Supplier */}
                            <div className="subcontract-field-group">
                                <label className="subcontract-field-label">
                                    Fournisseur Logistique / Sous-Traitant
                                </label>
                                <div className="subcontract-input-wrapper">
                                    <span className="subcontract-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Building2 size={16} /></span>
                                    <input
                                        className="subcontract-text-input"
                                        placeholder="ex. Sybel Light & Sound, ProEvent, RentAV..."
                                        value={formData.provider || ''}
                                        onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Volumes & Financial Framework */}
                        <div className="subcontract-section-box">
                            <div className="subcontract-section-header">
                                <span className="subcontract-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Banknote size={16} /> Volumes & Valorisation Journalière
                                </span>
                                <span className="subcontract-section-badge">Finance & Stock</span>
                            </div>

                            <div className="subcontract-subgrid-2">
                                <div className="subcontract-field-group">
                                    <label className="subcontract-field-label">
                                        Quantité Mobilisée <span className="required-dot">*</span>
                                    </label>
                                    <div className="subcontract-input-wrapper">
                                        <span className="subcontract-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Hash size={16} /></span>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="subcontract-text-input"
                                            placeholder="1"
                                            value={formData.quantity || ''}
                                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        />
                                        <span className="subcontract-trailing-badge">Unités</span>
                                    </div>
                                </div>

                                <div className="subcontract-field-group">
                                    <label className="subcontract-field-label">
                                        Coût Journalier / Unité (TND) <span className="required-dot">*</span>
                                    </label>
                                    <div className="subcontract-input-wrapper">
                                        <span className="subcontract-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Banknote size={16} /></span>
                                        <input
                                            type="number"
                                            step="0.001"
                                            required
                                            className="subcontract-text-input"
                                            placeholder="0.000"
                                            value={formData.costPerDay || ''}
                                            onChange={e => setFormData({ ...formData, costPerDay: e.target.value })}
                                        />
                                        <span className="subcontract-trailing-badge">TND / j</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Pricing Presets */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Paliers tarifaires journaliers rapides :
                                </div>
                                <div className="subcontract-chips-row">
                                    {COST_PRESETS.map((cost, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`subcontract-suggestion-chip ${Number(formData.costPerDay) === cost ? 'active' : ''}`}
                                            onClick={() => handleSelectCost(cost)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <Banknote size={12} />
                                            <span>{cost} TND</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Live Valuation Banner */}
                            <div className="subcontract-valuation-banner">
                                <div className="subcontract-val-left">
                                    <span>Engagement Financier Journalier :</span>
                                    <span className="subcontract-val-sub">
                                        ({qty} unité{qty > 1 ? 's' : ''} × {unitCost.toLocaleString()} TND)
                                    </span>
                                </div>
                                <div className="subcontract-val-highlight">
                                    <span>{totalCost.toLocaleString()}</span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>TND / jour</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Operational Notes & Terms */}
                        <div className="subcontract-section-box">
                            <div className="subcontract-section-header">
                                <span className="subcontract-section-title">
                                    Conditions & Notes Opérationnelles
                                </span>
                                <span className="subcontract-section-badge">Modalités</span>
                            </div>

                            <textarea
                                className="subcontract-text-input"
                                rows="2"
                                style={{ height: '72px', resize: 'none', padding: '10px 14px' }}
                                placeholder="Conditions de location, caution versée, état à la réception, date limite de restitution..."
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        {/* Live Preview Card */}
                        {(formData.name || formData.provider) && (
                            <div className="subcontract-preview-card">
                                <div className="subcontract-preview-left">
                                    <div className="subcontract-avatar-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ActiveCatIcon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="subcontract-preview-name">
                                            {formData.name || 'Nouvelle Ressource Sous-Traitée'}
                                        </h4>
                                        <p className="subcontract-preview-sub">
                                            {formData.brand ? `${formData.brand} • ` : ''}
                                            Fournisseur : <strong style={{ color: '#fbbf24' }}>{formData.provider || 'Non spécifié'}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24' }}>
                                        {totalCost.toLocaleString()} TND
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                        coût journalier
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="subcontract-modal-footer">
                        <div className="subcontract-footer-summary">
                            <span>Ressource : <strong className="summary-highlight">{formData.name || 'Nouvelle'}</strong></span>
                            <span>•</span>
                            <span>Engagement : <strong className="summary-highlight">{totalCost.toLocaleString()} TND / j</strong></span>
                        </div>

                        <div className="subcontract-footer-btns">
                            <button
                                type="button"
                                className="subcontract-btn-secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="subcontract-btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Save size={15} />
                                <span>{editItem ? 'Mettre à Jour la Ressource' : 'Confirmer l\'Enregistrement'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubcontractedModal;
