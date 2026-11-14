import React from 'react';
import { User, Car, CreditCard, Phone, ShieldCheck, Check, Zap, X } from 'lucide-react';
import './DriverModal.css';

const LICENSE_PRESETS = [
    { code: 'Cat. B', label: 'Voiture / Camionnette' },
    { code: 'Cat. C', label: 'Poids Lourd' },
    { code: 'Cat. CE', label: 'Semi-Remorque' },
    { code: 'Cat. BE', label: 'Remorque Lourde' },
    { code: 'CACES', label: 'Chariot / Nacelle' }
];

const DriverModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    editingId
}) => {
    if (!isOpen) return null;

    const isActive = formData.status === 'Active';

    const handleSelectCategory = (code) => {
        const current = formData.licenseNumber || '';
        if (current.includes(code)) {
            // Remove
            const updated = current.replace(code, '').trim();
            setFormData({ ...formData, licenseNumber: updated });
        } else {
            // Add prefix or append
            const updated = current ? `${current} (${code})` : `Permis ${code} - `;
            setFormData({ ...formData, licenseNumber: updated });
        }
    };

    return (
        <div className="driver-modal-overlay" onClick={onClose}>
            <div className="driver-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow backdrop */}
                <div className="driver-ambient-glow" />

                {/* Header */}
                <div className="driver-modal-header">
                    <div className="driver-header-left">
                        <div className="driver-header-icon-badge">
                            <Car size={22} />
                        </div>
                        <div className="driver-header-title-group">
                            <h2>
                                {editingId ? 'Modifier les Identifiants Chauffeur' : 'Enregistrer un Chauffeur / Opérateur'}
                            </h2>
                            <p className="driver-header-subtext">
                                Registre officiel de transport logistique et habilitations de conduite
                            </p>
                        </div>
                    </div>

                    <div className="driver-header-right">
                        <span
                            className="driver-status-badge-pill"
                            style={{
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: isActive ? '#34d399' : '#fbbf24',
                                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                            }}
                        >
                            <span
                                className="status-dot-indicator"
                                style={{ background: isActive ? '#10b981' : '#f59e0b' }}
                            />
                            {isActive ? 'Opérationnel / Actif' : 'En Congé / Inactif'}
                        </span>

                        <button
                            type="button"
                            className="driver-close-btn"
                            onClick={onClose}
                            title="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="driver-modal-body">
                        {/* Section 1: Status */}
                        <div className="driver-section-box">
                            <div className="driver-section-header">
                                <span className="driver-section-title">
                                    <ShieldCheck size={16} /> Disponibilité Logistique
                                </span>
                                <span className="driver-section-badge">Statut Flotte</span>
                            </div>

                            <div className="driver-status-grid">
                                <button
                                    type="button"
                                    className={`driver-status-card-btn ${isActive ? 'active status-active' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Active' })}
                                >
                                    <span className="status-dot-indicator status-dot-green" />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Opérationnel / En Service</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Prêt pour convoyage et tournées</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`driver-status-card-btn ${!isActive ? 'active status-inactive' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                >
                                    <span className="status-dot-indicator status-dot-amber" />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>En Congé / Hors Service</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Temporairement non assignable</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Identity & Driver License */}
                        <div className="driver-section-box">
                            <div className="driver-section-header">
                                <span className="driver-section-title">
                                    <Car size={16} /> Identité & Permis de Conduire
                                </span>
                                <span className="driver-section-badge">Obligatoire</span>
                            </div>

                            <div className="driver-field-group">
                                <label className="driver-field-label">
                                    Nom & Prénom du Conducteur <span className="required-dot">*</span>
                                </label>
                                <div className="driver-input-wrapper">
                                    <span className="driver-input-icon"><User size={16} /></span>
                                    <input
                                        required
                                        className="driver-text-input"
                                        placeholder="ex. Sami Ben Ali"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="driver-field-group">
                                <label className="driver-field-label">
                                    N° Permis de Conduire / Habilitation <span className="required-dot">*</span>
                                </label>
                                <div className="driver-input-wrapper">
                                    <span className="driver-input-icon"><CreditCard size={16} /></span>
                                    <input
                                        required
                                        className="driver-text-input"
                                        placeholder="ex. Permis 12/34567 (Cat. C, CE)"
                                        value={formData.licenseNumber || ''}
                                        onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* License Categories Chips */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Catégories de conduite rapides :
                                </div>
                                <div className="driver-license-chips-row">
                                    {LICENSE_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`driver-license-chip ${(formData.licenseNumber || '').includes(preset.code) ? 'active' : ''}`}
                                            onClick={() => handleSelectCategory(preset.code)}
                                        >
                                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                <CreditCard size={12} />
                                            </span>
                                            <span>{preset.code}</span>
                                            <span style={{ opacity: 0.65, fontSize: '10px' }}>({preset.label})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Contact Coordinates & National ID */}
                        <div className="driver-section-box">
                            <div className="driver-section-header">
                                <span className="driver-section-title">
                                    <Phone size={16} /> Coordonnées & Identification
                                </span>
                                <span className="driver-section-badge">Dispatch & Urgence</span>
                            </div>

                            <div className="driver-subgrid-2">
                                <div className="driver-field-group">
                                    <label className="driver-field-label">
                                        Téléphone Direct / Urgence
                                    </label>
                                    <div className="driver-input-wrapper">
                                        <span className="driver-input-icon"><Phone size={16} /></span>
                                        <input
                                            className="driver-text-input"
                                            placeholder="+216 -- --- ---"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="driver-field-group">
                                    <label className="driver-field-label">
                                        Numéro CIN / ID
                                    </label>
                                    <div className="driver-input-wrapper">
                                        <span className="driver-input-icon"><CreditCard size={16} /></span>
                                        <input
                                            className="driver-text-input"
                                            style={{ paddingRight: '50px' }}
                                            placeholder="ex. 09876543"
                                            value={formData.cin || ''}
                                            onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                        />
                                        <span className="driver-trailing-badge">CIN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Driver Preview Card */}
                        {(formData.name || formData.licenseNumber) && (
                            <div className="driver-preview-card">
                                <div className="preview-card-left">
                                    <div className="driver-avatar-circle">
                                        {(formData.name || 'D').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="preview-driver-name">
                                            {formData.name || 'Conducteur'}
                                        </h4>
                                        <p className="preview-driver-sub">
                                            {formData.licenseNumber || 'Numéro permis à définir'} • {formData.phone || 'Sans contact téléphonique'}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className="driver-status-badge-pill"
                                    style={{
                                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        color: isActive ? '#34d399' : '#fbbf24',
                                        border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                                    }}
                                >
                                    <span
                                        className="status-dot-indicator"
                                        style={{ background: isActive ? '#10b981' : '#f59e0b' }}
                                    />
                                    {isActive ? 'Opérationnel' : 'En Congé'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="driver-modal-footer">
                        <div className="driver-footer-summary">
                            <span>Chauffeur: <strong className="summary-highlight">{formData.name || 'Nouveau'}</strong></span>
                            <span>•</span>
                            <span style={{ color: isActive ? '#34d399' : '#fbbf24', fontWeight: '700' }}>
                                {isActive ? 'Prêt pour mission' : 'En congé'}
                            </span>
                        </div>

                        <div className="driver-footer-btns">
                            <button
                                type="button"
                                className="driver-btn-secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="driver-btn-primary"
                            >
                                <Zap size={15} />
                                <span>{editingId ? 'Mettre à jour le Chauffeur' : 'Autoriser le Chauffeur'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DriverModal;
