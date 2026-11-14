import React from 'react';
import { Truck, Car, Package, Scale, ShieldCheck, Sparkles, Check, Zap, X, CreditCard } from 'lucide-react';
import './VehicleModal.css';

const VEHICLE_CATEGORIES = [
    { id: 'Truck', label: 'Camion / Poids Lourd', icon: Truck, desc: 'Affrètement lourd, scène & ponts' },
    { id: 'Van', label: 'Fourgon / Utilitaire', icon: Truck, desc: 'Régie son, lumière & flight-cases' },
    { id: 'Car', label: 'Véhicule Léger / Liaisons', icon: Car, desc: 'Transport régisseurs & personnel' }
];

const VEHICLE_PRESETS = [
    { label: 'Mercedes Sprinter 316', type: 'Van', capacity: 1500, icon: Truck },
    { label: 'Renault Master L3H2', type: 'Van', capacity: 1400, icon: Truck },
    { label: 'Iveco Eurocargo 19T', type: 'Truck', capacity: 8500, icon: Truck },
    { label: 'Isuzu NPR 75 Hayon', type: 'Truck', capacity: 4200, icon: Truck },
    { label: 'Peugeot Boxer 15m³', type: 'Van', capacity: 1350, icon: Truck },
    { label: 'Pick-up D-Max 4x4', type: 'Car', capacity: 1000, icon: Car }
];

const PAYLOAD_PRESETS = [800, 1200, 1500, 3500, 7500, 12000];

const renderTypeIcon = (type, size = 20) => {
    switch (type) {
        case 'Truck': return <Truck size={size} />;
        case 'Van': return <Truck size={size} />;
        case 'Car': return <Car size={size} />;
        default: return <Package size={size} />;
    }
};

const VehicleModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    editingId
}) => {
    if (!isOpen) return null;

    const currentStatus = formData.status || 'Active';
    const currentType = formData.type || 'Truck';

    const handleSelectPreset = (preset) => {
        setFormData({
            ...formData,
            model: preset.label,
            type: preset.type,
            capacityWeight: preset.capacity
        });
    };

    const handleSelectPayload = (kg) => {
        setFormData({
            ...formData,
            capacityWeight: kg
        });
    };

    return (
        <div className="vehicle-modal-overlay" onClick={onClose}>
            <div className="vehicle-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow backdrop */}
                <div className="vehicle-ambient-glow" />

                {/* Header */}
                <div className="vehicle-modal-header">
                    <div className="vehicle-header-left">
                        <div className="vehicle-header-icon-badge">
                            {renderTypeIcon(currentType, 22)}
                        </div>
                        <div className="vehicle-header-title-group">
                            <h2>
                                {editingId ? 'Modifier le Véhicule de Flotte' : 'Commissionner un Véhicule Flotte'}
                            </h2>
                            <p className="vehicle-header-subtext">
                                Spécifications techniques de charge utile et registre de transport officiel
                            </p>
                        </div>
                    </div>

                    <div className="vehicle-header-right">
                        <span
                            className="vehicle-status-badge-pill"
                            style={{
                                background: currentStatus === 'Active'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : currentStatus === 'Maintenance'
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : 'rgba(239, 68, 68, 0.15)',
                                color: currentStatus === 'Active'
                                    ? '#34d399'
                                    : currentStatus === 'Maintenance'
                                        ? '#fbbf24'
                                        : '#f87171',
                                border: `1px solid ${currentStatus === 'Active'
                                    ? 'rgba(16, 185, 129, 0.35)'
                                    : currentStatus === 'Maintenance'
                                        ? 'rgba(245, 158, 11, 0.35)'
                                        : 'rgba(239, 68, 68, 0.35)'}`
                            }}
                        >
                            <span
                                className="status-dot-indicator"
                                style={{
                                    background: currentStatus === 'Active'
                                        ? '#10b981'
                                        : currentStatus === 'Maintenance'
                                            ? '#f59e0b'
                                            : '#ef4444'
                                }}
                            />
                            {currentStatus === 'Active' ? 'Opérationnel / En Service' : currentStatus === 'Maintenance' ? 'En Maintenance / Atelier' : 'Réformé / Hors Service'}
                        </span>

                        <button
                            type="button"
                            className="vehicle-close-btn"
                            onClick={onClose}
                            title="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <div className="vehicle-modal-body">
                        {/* Section 1: Vehicle Category Selector */}
                        <div className="vehicle-section-box">
                            <div className="vehicle-section-header">
                                <span className="vehicle-section-title">
                                    <Truck size={16} /> Catégorie & Gabarit de Flotte
                                </span>
                                <span className="vehicle-section-badge">Typologie</span>
                            </div>

                            <div className="vehicle-category-grid">
                                {VEHICLE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`vehicle-category-card ${currentType === cat.id ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: cat.id })}
                                    >
                                        <span className="vehicle-cat-icon">{React.createElement(cat.icon, { size: 20 })}</span>
                                        <span className="vehicle-cat-label">{cat.label}</span>
                                        <span className="vehicle-cat-desc">{cat.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Model & Registration */}
                        <div className="vehicle-section-box">
                            <div className="vehicle-section-header">
                                <span className="vehicle-section-title">
                                    <CreditCard size={16} /> Modèle & Immatriculation Officielle
                                </span>
                                <span className="vehicle-section-badge">Registre</span>
                            </div>

                            {/* Model and Make */}
                            <div className="vehicle-field-group">
                                <label className="vehicle-field-label">
                                    Marque & Modèle du Véhicule <span className="required-dot">*</span>
                                </label>
                                <div className="vehicle-input-wrapper">
                                    <span className="vehicle-input-icon"><Truck size={16} /></span>
                                    <input
                                        required
                                        className="vehicle-text-input"
                                        placeholder="ex. Mercedes Sprinter 316 / Renault Master L3H2"
                                        value={formData.model || ''}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Suggestion Chips */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Suggestions de véhicules fréquents :
                                </div>
                                <div className="vehicle-chips-row">
                                    {VEHICLE_PRESETS.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`vehicle-suggestion-chip ${formData.model === p.label ? 'active' : ''}`}
                                            onClick={() => handleSelectPreset(p)}
                                        >
                                            <span>{React.createElement(p.icon, { size: 14 })}</span>
                                            <span>{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="vehicle-subgrid-2" style={{ marginTop: '6px' }}>
                                {/* License Plate */}
                                <div className="vehicle-field-group">
                                    <label className="vehicle-field-label">
                                        Numéro d'Immatriculation (Plaque) <span className="required-dot">*</span>
                                    </label>
                                    <div className="vehicle-input-wrapper">
                                        <span className="vehicle-input-icon"><CreditCard size={16} /></span>
                                        <input
                                            required
                                            className="vehicle-text-input"
                                            style={{ paddingRight: '50px', letterSpacing: '0.8px', fontWeight: '700' }}
                                            placeholder="123 TU 4567"
                                            value={formData.plateNumber || ''}
                                            onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                                        />
                                        <span className="vehicle-trailing-badge">TU</span>
                                    </div>
                                </div>

                                {/* Max Payload */}
                                <div className="vehicle-field-group">
                                    <label className="vehicle-field-label">
                                        Charge Utile Max (kg)
                                    </label>
                                    <div className="vehicle-input-wrapper">
                                        <span className="vehicle-input-icon"><Scale size={16} /></span>
                                        <input
                                            type="number"
                                            className="vehicle-text-input"
                                            style={{ paddingRight: '50px' }}
                                            placeholder="ex. 1500"
                                            value={formData.capacityWeight !== undefined ? formData.capacityWeight : ''}
                                            onChange={e => setFormData({ ...formData, capacityWeight: e.target.value })}
                                        />
                                        <span className="vehicle-trailing-badge">KG</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Payload Presets */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Préréglages de tonnage rapide :
                                </div>
                                <div className="vehicle-chips-row">
                                    {PAYLOAD_PRESETS.map((kg, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`vehicle-suggestion-chip ${Number(formData.capacityWeight) === kg ? 'active' : ''}`}
                                            onClick={() => handleSelectPayload(kg)}
                                        >
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Scale size={12} /> {kg.toLocaleString()} kg
                                            </span>
                                            <span style={{ opacity: 0.6, fontSize: '10px' }}>({(kg / 1000).toFixed(1)} T)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Commission Status */}
                        <div className="vehicle-section-box">
                            <div className="vehicle-section-header">
                                <span className="vehicle-section-title">
                                    <ShieldCheck size={16} /> Statut Opérationnel & Disponibilité Flotte
                                </span>
                                <span className="vehicle-section-badge">Affectation</span>
                            </div>

                            <div className="vehicle-status-grid">
                                <button
                                    type="button"
                                    className={`vehicle-status-btn ${currentStatus === 'Active' ? 'active status-active' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Active' })}
                                >
                                    <span className="status-dot-indicator status-dot-green" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: '700' }}>Opérationnel</div>
                                        <div style={{ color: '#64748b', fontSize: '10.5px' }}>En Service / Disponible</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`vehicle-status-btn ${currentStatus === 'Maintenance' ? 'active status-maintenance' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Maintenance' })}
                                >
                                    <span className="status-dot-indicator status-dot-amber" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: '700' }}>Maintenance</div>
                                        <div style={{ color: '#64748b', fontSize: '10.5px' }}>Garage / Atelier</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`vehicle-status-btn ${currentStatus === 'Inactive' ? 'active status-inactive' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                >
                                    <span className="status-dot-indicator status-dot-red" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: '700' }}>Réformé</div>
                                        <div style={{ color: '#64748b', fontSize: '10.5px' }}>Hors Service</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Live Vehicle Preview Card */}
                        {(formData.model || formData.plateNumber) && (
                            <div className="vehicle-preview-card">
                                <div className="vehicle-preview-left">
                                    <div className="vehicle-avatar-box">
                                        {renderTypeIcon(currentType, 22)}
                                    </div>
                                    <div>
                                        <h4 className="vehicle-preview-name">
                                            {formData.model || 'Nouveau Véhicule de Flotte'}
                                        </h4>
                                        <p className="vehicle-preview-sub">
                                            Immat: <strong style={{ color: '#c4b5fd' }}>{formData.plateNumber || '—'}</strong>
                                            {formData.capacityWeight ? ` • Charge: ${Number(formData.capacityWeight).toLocaleString()} kg (~${(Number(formData.capacityWeight)/1000).toFixed(1)} T)` : ''}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className="vehicle-status-badge-pill"
                                    style={{
                                        background: currentStatus === 'Active'
                                            ? 'rgba(16, 185, 129, 0.15)'
                                            : currentStatus === 'Maintenance'
                                                ? 'rgba(245, 158, 11, 0.15)'
                                                : 'rgba(239, 68, 68, 0.15)',
                                        color: currentStatus === 'Active'
                                            ? '#34d399'
                                            : currentStatus === 'Maintenance'
                                                ? '#fbbf24'
                                                : '#f87171',
                                        border: `1px solid ${currentStatus === 'Active'
                                            ? 'rgba(16, 185, 129, 0.35)'
                                            : currentStatus === 'Maintenance'
                                                ? 'rgba(245, 158, 11, 0.35)'
                                                : 'rgba(239, 68, 68, 0.35)'}`
                                    }}
                                >
                                    <span
                                        className="status-dot-indicator"
                                        style={{
                                            background: currentStatus === 'Active'
                                                ? '#10b981'
                                                : currentStatus === 'Maintenance'
                                                    ? '#f59e0b'
                                                    : '#ef4444'
                                        }}
                                    />
                                    {currentStatus === 'Active' ? 'Opérationnel' : currentStatus === 'Maintenance' ? 'Atelier' : 'Réformé'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="vehicle-modal-footer">
                        <div className="vehicle-footer-summary">
                            <span>Véhicule: <strong className="summary-highlight">{formData.model || 'Nouveau'}</strong></span>
                            {formData.plateNumber && (
                                <>
                                    <span>•</span>
                                    <span>Immat: <strong className="summary-highlight">{formData.plateNumber}</strong></span>
                                </>
                            )}
                        </div>

                        <div className="vehicle-footer-btns">
                            <button
                                type="button"
                                className="vehicle-btn-secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="vehicle-btn-primary"
                            >
                                <Sparkles size={16} />
                                <span>{editingId ? 'Enregistrer les Caractéristiques' : 'Commissionner le Véhicule'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleModal;
