import React from 'react';
import './FreelancerModal.css';
import {
    User,
    Wrench,
    Banknote,
    Phone,
    Mail,
    CreditCard,
    X,
    Zap,
    HardHat,
    Volume2,
    Lightbulb,
    Video,
    ClipboardList,
    Sliders
} from 'lucide-react';

const SPECIALTY_PRESETS = [
    { label: 'Son / Audio', icon: Volume2 },
    { label: 'Lumière / Light', icon: Lightbulb },
    { label: 'Rigger / Accroche', icon: Wrench },
    { label: 'Vidéo / LED Wall', icon: Video },
    { label: 'Électricien', icon: Zap },
    { label: 'Machiniste / Plateau', icon: Sliders },
    { label: 'Régisseur Général', icon: ClipboardList }
];

const RATE_PRESETS = [100, 150, 200, 250, 300];

const FreelancerModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    editingId
}) => {
    if (!isOpen) return null;

    const isActive = formData.status === 'Active';

    const handleSelectSpecialty = (chipLabel) => {
        setFormData({ ...formData, specialty: chipLabel });
    };

    const handleSelectRate = (rate) => {
        setFormData({ ...formData, dailyRate: rate });
    };

    return (
        <div className="freelancer-modal-overlay" onClick={onClose}>
            <div className="freelancer-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow backdrop */}
                <div className="freelancer-ambient-glow" />

                {/* Header */}
                <div className="freelancer-modal-header">
                    <div className="freelancer-header-left">
                        <div className="freelancer-header-icon-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                            <HardHat size={26} />
                        </div>
                        <div className="freelancer-header-title-group">
                            <h2>
                                {editingId ? 'Modifier le Profil Freelance' : 'Intégrer un Talent Technique'}
                            </h2>
                            <p className="freelancer-header-subtext">
                                Tarification journalière, domaine technique et coordonnées d'affectation
                            </p>
                        </div>
                    </div>

                    <div className="freelancer-header-right">
                        <span
                            className="freelancer-status-badge-pill"
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
                            {isActive ? 'Disponible / On Call' : 'Indisponible / Booked'}
                        </span>

                        <button
                            type="button"
                            className="freelancer-close-btn"
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
                    <div className="freelancer-modal-body">
                        {/* Section 1: Availability Status */}
                        <div className="freelancer-section-box">
                            <div className="freelancer-section-header">
                                <span className="freelancer-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={16} /> Statut de Disponibilité
                                </span>
                                <span className="freelancer-section-badge">Opérationnel</span>
                            </div>

                            <div className="freelancer-status-grid">
                                <button
                                    type="button"
                                    className={`freelancer-status-card-btn ${isActive ? 'active status-active' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Active' })}
                                >
                                    <span className="status-dot-indicator status-dot-green" />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Disponible / En Attente</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Prêt pour mission événementielle</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`freelancer-status-card-btn ${!isActive ? 'active status-inactive' : ''}`}
                                    onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                >
                                    <span className="status-dot-indicator status-dot-red" />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Indisponible / En Mission</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>Déjà mobilisé ou indisponible</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Identity & Technical Specialty */}
                        <div className="freelancer-section-box">
                            <div className="freelancer-section-header">
                                <span className="freelancer-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Wrench size={16} /> Spécialité & Compétence Métier
                                </span>
                                <span className="freelancer-section-badge">Profil Technique</span>
                            </div>

                            <div className="freelancer-subgrid-2">
                                <div className="freelancer-field-group">
                                    <label className="freelancer-field-label">
                                        Nom & Prénom <span className="required-dot">*</span>
                                    </label>
                                    <div className="freelancer-input-wrapper">
                                        <span className="freelancer-input-icon" style={{ display: 'flex', alignItems: 'center' }}><User size={16} /></span>
                                        <input
                                            required
                                            className="freelancer-text-input"
                                            placeholder="ex. Karim Trabelsi"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="freelancer-field-group">
                                    <label className="freelancer-field-label">
                                        Spécialité Principale <span className="required-dot">*</span>
                                    </label>
                                    <div className="freelancer-input-wrapper">
                                        <span className="freelancer-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Wrench size={16} /></span>
                                        <input
                                            required
                                            className="freelancer-text-input"
                                            placeholder="ex. Ingénieur Son, Rigger, Lumière"
                                            value={formData.specialty || ''}
                                            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Suggestion Chips */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                                    Suggestions rapides :
                                </div>
                                <div className="freelancer-chips-row">
                                    {SPECIALTY_PRESETS.map((chip, idx) => {
                                        const IconComp = chip.icon;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={`freelancer-suggestion-chip ${formData.specialty === chip.label ? 'active' : ''}`}
                                                onClick={() => handleSelectSpecialty(chip.label)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <IconComp size={14} />
                                                <span>{chip.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Compensation & Contact Coordinates */}
                        <div className="freelancer-section-box">
                            <div className="freelancer-section-header">
                                <span className="freelancer-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Banknote size={16} /> Rémunération & Coordonnées
                                </span>
                                <span className="freelancer-section-badge">Finance & Contact</span>
                            </div>

                            <div className="freelancer-subgrid-2">
                                <div className="freelancer-field-group">
                                    <label className="freelancer-field-label">
                                        Tarif Journalier (TND) <span className="required-dot">*</span>
                                    </label>
                                    <div className="freelancer-input-wrapper">
                                        <span className="freelancer-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Banknote size={16} /></span>
                                        <input
                                            type="number"
                                            required
                                            className="freelancer-text-input"
                                            style={{ paddingRight: '80px' }}
                                            placeholder="150"
                                            value={formData.dailyRate || ''}
                                            onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                                        />
                                        <span className="freelancer-trailing-badge">TND / j</span>
                                    </div>
                                    {/* Rate Presets */}
                                    <div className="freelancer-rate-presets">
                                        {RATE_PRESETS.map((rate) => (
                                            <button
                                                key={rate}
                                                type="button"
                                                className="freelancer-rate-preset-btn"
                                                onClick={() => handleSelectRate(rate)}
                                            >
                                                {rate} DT
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="freelancer-field-group">
                                    <label className="freelancer-field-label">
                                        Téléphone Direct <span className="required-dot">*</span>
                                    </label>
                                    <div className="freelancer-input-wrapper">
                                        <span className="freelancer-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Phone size={16} /></span>
                                        <input
                                            required
                                            className="freelancer-text-input"
                                            placeholder="+216 -- --- ---"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="freelancer-subgrid-2">
                                <div className="freelancer-field-group">
                                    <label className="freelancer-field-label">Email Personnel / Facturation</label>
                                    <div className="freelancer-input-wrapper">
                                        <span className="freelancer-input-icon" style={{ display: 'flex', alignItems: 'center' }}><Mail size={16} /></span>
                                        <input
                                            type="email"
                                            className="freelancer-text-input"
                                            placeholder="technicien@example.com"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="freelancer-field-group">
                                    <label className="freelancer-field-label">Numéro CIN / ID</label>
                                    <div className="freelancer-input-wrapper">
                                        <span className="freelancer-input-icon" style={{ display: 'flex', alignItems: 'center' }}><CreditCard size={16} /></span>
                                        <input
                                            className="freelancer-text-input"
                                            style={{ paddingRight: '50px' }}
                                            placeholder="01234567"
                                            value={formData.cin || ''}
                                            onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                        />
                                        <span className="freelancer-trailing-badge">CIN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Talent Preview Card */}
                        {(formData.name || formData.specialty) && (
                            <div className="freelancer-preview-card">
                                <div className="preview-card-left">
                                    <div className="preview-avatar-circle">
                                        {(formData.name || 'T').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="preview-talent-name">
                                            {formData.name || 'Nouveau Talent'}
                                        </h4>
                                        <p className="preview-talent-sub">
                                            {formData.specialty || 'Spécialité à définir'} • {formData.dailyRate ? `${formData.dailyRate} TND/jour` : 'Tarif à définir'}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className="freelancer-status-badge-pill"
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
                                    {isActive ? 'Disponible' : 'Occupé'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="freelancer-modal-footer">
                        <div className="freelancer-footer-summary">
                            <span>Talent: <strong className="summary-highlight">{formData.name || 'Nouveau'}</strong></span>
                            {formData.dailyRate && (
                                <>
                                    <span>•</span>
                                    <span>Tarif: <strong className="summary-highlight">{formData.dailyRate} TND/j</strong></span>
                                </>
                            )}
                        </div>

                        <div className="freelancer-footer-btns">
                            <button
                                type="button"
                                className="freelancer-btn-secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="freelancer-btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Zap size={16} />
                                <span>{editingId ? 'Mettre à jour le Profil' : 'Intégrer le Freelance'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FreelancerModal;
