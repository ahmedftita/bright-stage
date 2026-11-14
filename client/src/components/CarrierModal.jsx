import React from 'react';
import { Truck, Car, ShieldCheck, User, CreditCard, Phone, Check, X } from 'lucide-react';
import './CarrierModal.css';

const TRUCK_PRESETS = [
    { label: 'Fourgon 12m³', icon: Truck },
    { label: 'Camion 19T Hayon', icon: Truck },
    { label: 'Semi-Remorque 38T', icon: Truck },
    { label: 'Iveco Daily', icon: Truck },
    { label: 'Pick-up / D-Max', icon: Car },
    { label: 'Plateau Événementiel', icon: Truck }
];

const CarrierModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    editingId
}) => {
    if (!isOpen) return null;

    const isActive = formData.status === 'Active';
    const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

    const handleSelectTruck = (label) => {
        setFormData({ ...formData, vehicleModel: label });
    };

    return (
        <div className="carrier-modal-overlay" onClick={onClose}>
            <div className="carrier-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow backdrop */}
                <div className="carrier-ambient-glow" />

                {/* Header */}
                <div className="carrier-modal-header">
                    <div className="carrier-header-left">
                        <div className="carrier-header-icon-badge">
                            <Truck size={22} />
                        </div>
                        <div className="carrier-header-title-group">
                            <h2>
                                {editingId ? 'Modifier le Partenaire Transporteur' : 'Enregistrer un Transporteur Agréé'}
                            </h2>
                            <p className="carrier-header-subtext">
                                Prestataire logistique tiers, immatriculation et capacité de convoyage
                            </p>
                        </div>
                    </div>

                    <div className="carrier-header-right">
                        <span
                            className="carrier-status-badge-pill"
                            style={{
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isActive ? '#34d399' : '#f87171',
                                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                            }}
                        >
                            <span
                                className="status-dot-indicator"
                                style={{ background: isActive ? '#10b981' : '#ef4444' }}
                            />
                            {isActive ? 'Opérationnel / Actif' : 'Suspendu / Inactif'}
                        </span>

                        <button
                            type="button"
                            className="carrier-close-btn"
                            onClick={onClose}
                            title="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <div className="carrier-modal-body">
                        {/* Section 1: Availability Status */}
                        <div className="carrier-section-box">
                            <div className="carrier-section-header">
                                <span className="carrier-section-title">
                                    <ShieldCheck size={16} /> Statut Opérationnel & Agrément
                                </span>
                                <span className="carrier-section-badge">Habilitation Fret</span>
                            </div>

                            <div className="carrier-status-grid">
                                <button
                                    type="button"
                                    className={`carrier-status-card-btn ${isActive ? 'active status-active' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Active' })}
                                >
                                    <span className="status-dot-indicator status-dot-green" />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Opérationnel / Actif</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Autorisé pour affrètement et livraisons</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`carrier-status-card-btn ${!isActive ? 'active status-inactive' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                >
                                    <span className="status-dot-indicator status-dot-red" />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Suspendu / Inactif</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Temporairement non affrété</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Identity & Contact */}
                        <div className="carrier-section-box">
                            <div className="carrier-section-header">
                                <span className="carrier-section-title">
                                    <User size={16} /> Identité du Transporteur
                                </span>
                                <span className="carrier-section-badge">Coordonnées</span>
                            </div>

                            <div className="carrier-subgrid-2">
                                <div className="carrier-field-group">
                                    <label className="carrier-field-label">
                                        Prénom <span className="required-dot">*</span>
                                    </label>
                                    <div className="carrier-input-wrapper">
                                        <span className="carrier-input-icon"><User size={16} /></span>
                                        <input
                                            required
                                            className="carrier-text-input"
                                            placeholder="Prénom"
                                            value={formData.firstName || ''}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="carrier-field-group">
                                    <label className="carrier-field-label">
                                        Nom de Famille <span className="required-dot">*</span>
                                    </label>
                                    <div className="carrier-input-wrapper">
                                        <span className="carrier-input-icon"><User size={16} /></span>
                                        <input
                                            required
                                            className="carrier-text-input"
                                            placeholder="Nom"
                                            value={formData.lastName || ''}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="carrier-subgrid-2">
                                <div className="carrier-field-group">
                                    <label className="carrier-field-label">
                                        Numéro CIN / ID Card <span className="required-dot">*</span>
                                    </label>
                                    <div className="carrier-input-wrapper">
                                        <span className="carrier-input-icon"><CreditCard size={16} /></span>
                                        <input
                                            required
                                            className="carrier-text-input"
                                            style={{ paddingRight: '50px' }}
                                            placeholder="ex. 04796469"
                                            value={formData.cin || ''}
                                            onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                        />
                                        <span className="carrier-trailing-badge">CIN</span>
                                    </div>
                                </div>

                                <div className="carrier-field-group">
                                    <label className="carrier-field-label">
                                        Téléphone de Contact <span className="required-dot">*</span>
                                    </label>
                                    <div className="carrier-input-wrapper">
                                        <span className="carrier-input-icon"><Phone size={16} /></span>
                                        <input
                                            required
                                            className="carrier-text-input"
                                            placeholder="+216 -- --- ---"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Vehicle Specs */}
                        <div className="carrier-section-box">
                            <div className="carrier-section-header">
                                <span className="carrier-section-title">
                                    <Truck size={16} /> Caractéristiques du Véhicule
                                </span>
                                <span className="carrier-section-badge">Fret Routier</span>
                            </div>

                            <div className="carrier-subgrid-2">
                                <div className="carrier-field-group">
                                    <label className="carrier-field-label">
                                        Immatriculation (Plaque) <span className="required-dot">*</span>
                                    </label>
                                    <div className="carrier-input-wrapper">
                                        <span className="carrier-input-icon"><CreditCard size={16} /></span>
                                        <input
                                            required
                                            className="carrier-text-input"
                                            style={{ paddingRight: '50px', letterSpacing: '0.5px', fontWeight: '700' }}
                                            placeholder="ex. 195 TU 916"
                                            value={formData.vehiclePlate || ''}
                                            onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                                        />
                                        <span className="carrier-trailing-badge">TU</span>
                                    </div>
                                </div>

                                <div className="carrier-field-group">
                                    <label className="carrier-field-label">
                                        Modèle / Type de Camion
                                    </label>
                                    <div className="carrier-input-wrapper">
                                        <span className="carrier-input-icon"><Truck size={16} /></span>
                                        <input
                                            className="carrier-text-input"
                                            placeholder="ex. Iveco Daily 15m³, Camion 19T"
                                            value={formData.vehicleModel || ''}
                                            onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Truck Suggestions */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Types de véhicules courants :
                                </div>
                                <div className="carrier-chips-row">
                                    {TRUCK_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`carrier-suggestion-chip ${formData.vehicleModel === preset.label ? 'active' : ''}`}
                                            onClick={() => handleSelectTruck(preset.label)}
                                        >
                                            <span>{React.createElement(preset.icon, { size: 14 })}</span>
                                            <span>{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Live Carrier Preview Card */}
                        {(fullName || formData.vehiclePlate) && (
                            <div className="carrier-preview-card">
                                <div className="preview-card-left">
                                    <div className="carrier-avatar-circle">
                                        {(fullName || 'T').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="preview-carrier-name">
                                            {fullName || 'Nouveau Transporteur'}
                                        </h4>
                                        <p className="preview-carrier-sub">
                                            {formData.vehicleModel || 'Véhicule'} • Immat: <strong style={{ color: '#60a5fa' }}>{formData.vehiclePlate || '—'}</strong>
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className="carrier-status-badge-pill"
                                    style={{
                                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: isActive ? '#34d399' : '#f87171',
                                        border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                                    }}
                                >
                                    <span
                                        className="status-dot-indicator"
                                        style={{ background: isActive ? '#10b981' : '#ef4444' }}
                                    />
                                    {isActive ? 'Opérationnel' : 'Suspendu'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="carrier-modal-footer">
                        <div className="carrier-footer-summary">
                            <span>Partenaire: <strong className="summary-highlight">{fullName || 'Nouveau'}</strong></span>
                            {formData.vehiclePlate && (
                                <>
                                    <span>•</span>
                                    <span>Véhicule: <strong className="summary-highlight">{formData.vehiclePlate}</strong></span>
                                </>
                            )}
                        </div>

                        <div className="carrier-footer-btns">
                            <button
                                type="button"
                                className="carrier-btn-secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="carrier-btn-primary"
                            >
                                <Check size={16} />
                                <span>{editingId ? 'Enregistrer les Modifications' : 'Enregistrer le Transporteur'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CarrierModal;
