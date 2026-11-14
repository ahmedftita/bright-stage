import React, { useState } from 'react';
import {
    UserPlus, User, Mail, Lock, Phone, CreditCard,
    MapPin, Shield, Eye, EyeOff, Zap, Check, X,
    HardHat, Package, Wrench, Crown
} from 'lucide-react';
import './AddUserModal.css';

const ROLES_CONFIG = [
    { key: 'Worker', label: 'Worker', icon: Zap, desc: 'Technicien Terrain', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)' },
    { key: 'Site Manager', label: 'Site Manager', icon: HardHat, desc: 'Régie & Chantier', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' },
    { key: 'Storekeeper', label: 'Storekeeper', icon: Package, desc: 'Gestion Stock', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
    { key: 'Maintenancier', label: 'Maintenancier', icon: Wrench, desc: 'Maintenance & SAV', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' },
    { key: 'Manager', label: 'Manager', icon: Shield, desc: 'Supervision & Projets', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
    { key: 'Founder', label: 'Founder', icon: Crown, desc: 'Direction & Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' }
];

const AddUserModal = ({
    isOpen,
    onClose,
    newUserData,
    setNewUserData,
    onSubmit,
    isSubmitting
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [generatedHint, setGeneratedHint] = useState(false);

    if (!isOpen) return null;

    const currentRole = newUserData.role || 'Worker';
    const activeRoleConfig = ROLES_CONFIG.find(r => r.key === currentRole) || ROLES_CONFIG[0];

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let pass = 'BS#';
        for (let i = 0; i < 5; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        pass += '!26';
        setNewUserData({ ...newUserData, password: pass });
        setShowPassword(true);
        setGeneratedHint(true);
        setTimeout(() => setGeneratedHint(false), 2000);
    };

    return (
        <div className="user-modal-overlay" onClick={onClose}>
            <div className="user-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow backdrop */}
                <div className="user-ambient-glow" />

                {/* Header */}
                <div className="user-modal-header">
                    <div className="user-header-left">
                        <div className="user-header-icon-badge">
                            <UserPlus size={22} />
                        </div>
                        <div className="user-header-title-group">
                            <h2>Ajouter un Collaborateur</h2>
                            <p className="user-header-subtext">Création de compte d'accès interne et privilèges d'équipe</p>
                        </div>
                    </div>

                    <div className="user-header-right">
                        <span
                            className="user-role-badge-pill"
                            style={{
                                background: activeRoleConfig.bg,
                                color: activeRoleConfig.color,
                                border: `1px solid ${activeRoleConfig.border}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {React.createElement(activeRoleConfig.icon, { size: 13 })} {activeRoleConfig.label}
                        </span>

                        <button
                            type="button"
                            className="user-close-btn"
                            onClick={onClose}
                            title="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="user-modal-body">
                        {/* Section 1: Role Selection */}
                        <div className="user-section-box">
                            <div className="user-section-header">
                                <span className="user-section-title">
                                    <Shield size={16} /> Rôle d'Accès & Privilèges
                                </span>
                                <span className="user-section-badge">Obligatoire</span>
                            </div>

                            <div className="user-role-grid">
                                {ROLES_CONFIG.map(r => {
                                    const isActive = currentRole === r.key;
                                    return (
                                        <button
                                            key={r.key}
                                            type="button"
                                            className={`user-role-card-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => setNewUserData({ ...newUserData, role: r.key })}
                                            style={isActive ? {
                                                background: r.bg,
                                                borderColor: r.color,
                                                boxShadow: `0 4px 16px ${r.bg}`
                                            } : {}}
                                        >
                                            <span className="user-role-icon">
                                                {React.createElement(r.icon, { size: 18, color: isActive ? r.color : '#94a3b8' })}
                                            </span>
                                            <span className="user-role-name" style={isActive ? { color: r.color } : {}}>
                                                {r.label}
                                            </span>
                                            <span className="user-role-desc">{r.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Account Credentials */}
                        <div className="user-section-box">
                            <div className="user-section-header">
                                <span className="user-section-title">
                                    <User size={16} /> Identifiants de Connexion
                                </span>
                                <span className="user-section-badge">Sécurité</span>
                            </div>

                            <div className="user-subgrid-2">
                                <div className="user-field-group">
                                    <label className="user-field-label">
                                        Nom Complet <span className="required-dot">*</span>
                                    </label>
                                    <div className="user-input-wrapper">
                                        <span className="user-input-icon"><User size={16} /></span>
                                        <input
                                            required
                                            className="user-text-input"
                                            placeholder="ex. Karim Ben Salem"
                                            value={newUserData.name || ''}
                                            onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="user-field-group">
                                    <label className="user-field-label">
                                        Email Professionnel <span className="required-dot">*</span>
                                    </label>
                                    <div className="user-input-wrapper">
                                        <span className="user-input-icon"><Mail size={16} /></span>
                                        <input
                                            type="email"
                                            required
                                            className="user-text-input"
                                            placeholder="ex. karim@brightstage.tn"
                                            value={newUserData.email || ''}
                                            onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="user-field-group">
                                <label className="user-field-label">
                                    Mot de Passe d'Accès <span className="required-dot">*</span>
                                </label>
                                <div className="user-input-wrapper">
                                    <span className="user-input-icon"><Lock size={16} /></span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="user-text-input"
                                        style={{ paddingRight: '110px' }}
                                        placeholder="Mot de passe confidentiel..."
                                        value={newUserData.password || ''}
                                        onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="user-input-toggle-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        className="user-input-trailing-action"
                                        onClick={generatePassword}
                                        title="Générer automatiquement un mot de passe sécurisé"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        {generatedHint ? <><Check size={12} /> Prêt !</> : <><Zap size={12} /> Auto</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Contact & Identification */}
                        <div className="user-section-box">
                            <div className="user-section-header">
                                <span className="user-section-title">
                                    <CreditCard size={16} /> Coordonnées & Pièce d'Identité
                                </span>
                                <span className="user-section-badge">Facultatif</span>
                            </div>

                            <div className="user-subgrid-2">
                                <div className="user-field-group">
                                    <label className="user-field-label">Téléphone Mobile</label>
                                    <div className="user-input-wrapper">
                                        <span className="user-input-icon"><Phone size={16} /></span>
                                        <input
                                            className="user-text-input"
                                            placeholder="+216 -- --- ---"
                                            value={newUserData.phone || ''}
                                            onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="user-field-group">
                                    <label className="user-field-label">Numéro CIN / Passeport</label>
                                    <div className="user-input-wrapper">
                                        <span className="user-input-icon"><CreditCard size={16} /></span>
                                        <input
                                            className="user-text-input"
                                            style={{ paddingRight: '50px' }}
                                            placeholder="ex. 09876543"
                                            value={newUserData.cin || ''}
                                            onChange={e => setNewUserData({ ...newUserData, cin: e.target.value })}
                                        />
                                        <span className="user-trailing-badge">CIN</span>
                                    </div>
                                </div>
                            </div>

                            <div className="user-field-group">
                                <label className="user-field-label">Adresse de Résidence</label>
                                <div className="user-input-wrapper">
                                    <span className="user-input-icon"><MapPin size={16} /></span>
                                    <input
                                        className="user-text-input"
                                        placeholder="Rue, Ville, Code Postal..."
                                        value={newUserData.address || ''}
                                        onChange={e => setNewUserData({ ...newUserData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="user-modal-footer">
                        <div className="user-footer-summary">
                            <span>Collaborateur: <strong className="summary-highlight">{newUserData.name || 'Nouveau'}</strong></span>
                            <span>•</span>
                            <span style={{ color: activeRoleConfig.color, fontWeight: '700' }}>{activeRoleConfig.label}</span>
                        </div>

                        <div className="user-footer-btns">
                            <button
                                type="button"
                                className="user-btn-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="user-btn-primary"
                                disabled={isSubmitting}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                <UserPlus size={16} />
                                <span>{isSubmitting ? 'Création en cours...' : 'Créer l\'Utilisateur'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
