import React, { useState } from 'react';
import { 
    Building2, User, Users, Landmark, Phone, Mail, 
    MapPin, FileText, Hash, Plus, Copy, Check, X, Zap, Edit3 
} from 'lucide-react';
import './ClientModal.css';

const ROLE_PRESETS = ['Chef de projet', 'Comptabilité', 'Directeur Général', 'Régisseur Général', 'Responsable Logistique'];

const clientTypes = [
    { key: 'Société', label: 'Société', icon: Building2, desc: 'Entreprise' },
    { key: 'Particulier', label: 'Particulier', icon: User, desc: 'Client Privé' },
    { key: 'Association', label: 'Association', icon: Users, desc: 'ONG / Club' },
    { key: 'Public', label: 'Public', icon: Landmark, desc: 'Institution' },
];

const ClientModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    isReadOnly,
    canEdit,
    switchToEdit,
    clientsCount = 0
}) => {
    const [copiedField, setCopiedField] = useState(null);

    if (!isOpen) return null;

    const copyToClipboard = (text, fieldKey) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleAddContact = () => {
        setFormData({
            ...formData,
            contacts: [
                ...(formData.contacts || []),
                { name: '', role: 'Chef de projet', phone: '', email: '' }
            ]
        });
    };

    const handleRemoveContact = (index) => {
        const updated = [...(formData.contacts || [])];
        updated.splice(index, 1);
        setFormData({ ...formData, contacts: updated });
    };

    const handleUpdateContact = (index, field, value) => {
        const updated = [...(formData.contacts || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, contacts: updated });
    };

    const handleGenerateId = () => {
        const year = new Date().getFullYear();
        const num = String(clientsCount + 1).padStart(2, '0');
        setFormData({ ...formData, customId: `CLI-${year}-${num}` });
    };

    const currentType = formData.type || 'Société';

    const getTypeColor = (type) => {
        switch (type) {
            case 'Société': return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
            case 'Particulier': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
            case 'Association': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
            default: return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
        }
    };

    const typeStyle = getTypeColor(currentType);

    const renderTypeBadgeIcon = () => {
        const t = clientTypes.find(c => c.key === currentType);
        return t ? React.createElement(t.icon, { size: 13, style: { display: 'inline', verticalAlign: 'middle', marginRight: '5px' } }) : null;
    };

    return (
        <div className="client-modal-overlay" onClick={onClose}>
            <div className="client-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Ambient Halo */}
                <div className="client-ambient-glow" />

                {/* Modal Header */}
                <div className="client-modal-header">
                    <div className="client-header-left">
                        <div className="client-header-icon-badge">
                            <Users size={22} />
                        </div>
                        <div className="client-header-title-group">
                            <h2>
                                {isReadOnly
                                    ? 'Fiche Dossier Client'
                                    : (formData._id ? 'Modifier le Compte Client' : 'Enregistrer un Nouveau Client')}
                            </h2>
                            <p className="client-header-subtext">
                                {isReadOnly
                                    ? 'Synthèse légale, conditions de paiement et réseau de correspondants'
                                    : 'Identification fiscale, coordonnées de facturation et représentants désignés'}
                            </p>
                        </div>
                    </div>

                    <div className="client-header-right">
                        <span
                            className="client-type-badge-pill"
                            style={{ background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}` }}
                        >
                            {renderTypeBadgeIcon()} {currentType}
                        </span>

                        {formData.customId && (
                            <span style={{
                                fontSize: '11.5px',
                                fontFamily: 'monospace',
                                fontWeight: '700',
                                padding: '4px 9px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#a5b4fc',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                {formData.customId}
                            </span>
                        )}

                        <button
                            type="button"
                            className="client-close-btn"
                            onClick={onClose}
                            title="Fermer (Échap)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Read-Only Mode (Executive Profile Sheet) */}
                {isReadOnly ? (
                    <div className="client-modal-body">
                        {/* Hero Header Card */}
                        <div className="client-dossier-hero">
                            <div className="dossier-hero-left">
                                <div className="dossier-avatar-large">
                                    {(formData.name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="dossier-name">{formData.name || 'Client sans nom'}</h3>
                                    <div className="dossier-tags-row">
                                        <span
                                            className="client-type-badge-pill"
                                            style={{ background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}` }}
                                        >
                                            {renderTypeBadgeIcon()} {currentType}
                                        </span>
                                        {formData.customId && (
                                            <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                                ID: {formData.customId}
                                            </span>
                                        )}
                                        {formData.matriculeFiscal && (
                                            <button
                                                type="button"
                                                className="dossier-copy-chip"
                                                onClick={() => copyToClipboard(formData.matriculeFiscal, 'mf')}
                                            >
                                                {copiedField === 'mf' ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                                                <span>MF: {formData.matriculeFiscal}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {formData.phone && (
                                    <a href={`tel:${formData.phone}`} className="dossier-quick-action-link action-link-phone">
                                        <Phone size={14} />
                                        <span>Appeler</span>
                                    </a>
                                )}
                                {formData.email && (
                                    <a href={`mailto:${formData.email}`} className="dossier-quick-action-link action-link-email">
                                        <Mail size={14} />
                                        <span>Email</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 2-Column Grid */}
                        <div className="client-two-columns-layout">
                            {/* Left: General & Fiscal Specs */}
                            <div className="client-section-box">
                                <div className="client-section-header">
                                    <span className="client-section-title">
                                        <Building2 size={16} /> Fiche Entreprise & Siège
                                    </span>
                                    <span className="client-section-badge">Fiscal & Commercial</span>
                                </div>

                                <div className="client-subgrid-2">
                                    <div>
                                        <div className="client-field-label">Matricule Fiscal</div>
                                        <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: '700', marginTop: '4px' }}>
                                            {formData.matriculeFiscal || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="client-field-label">Délai de Paiement</div>
                                        <div style={{ color: '#818cf8', fontSize: '13.5px', fontWeight: '700', marginTop: '4px' }}>
                                            {formData.paymentTerms !== undefined ? `${formData.paymentTerms} jours` : '30 jours'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="client-field-label">Adresse du Siège</div>
                                    <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '4px' }}>
                                        {formData.address || 'Aucune adresse renseignée'}
                                    </div>
                                </div>

                                {formData.city && (
                                    <div>
                                        <div className="client-field-label">Ville / Région</div>
                                        <div style={{ color: '#fff', fontSize: '13px', marginTop: '4px' }}>
                                            {formData.city}
                                        </div>
                                    </div>
                                )}

                                {formData.notes && (
                                    <div style={{ marginTop: '6px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="client-field-label" style={{ color: '#818cf8' }}>Notes & Instructions</div>
                                        <div style={{ color: '#94a3b8', fontSize: '12.5px', marginTop: '4px', whiteSpace: 'pre-line' }}>
                                            {formData.notes}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Primary Contact & Secondary Representatives */}
                            <div className="client-section-box">
                                <div className="client-section-header">
                                    <span className="client-section-title">
                                        <User size={16} /> Point de Contact Principal
                                    </span>
                                    <span className="client-section-badge">Référent Direct</span>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.025)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                                        {formData.contactPerson || 'Non spécifié'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12.5px', color: '#94a3b8' }}>
                                        {formData.phone && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> {formData.phone}
                                            </span>
                                        )}
                                        {formData.email && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> {formData.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="client-section-header" style={{ marginTop: '8px' }}>
                                    <span className="client-section-title" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Users size={14} /> Représentants Délégués ({formData.contacts?.length || 0})
                                    </span>
                                </div>

                                {formData.contacts && formData.contacts.length > 0 ? (
                                    <div className="client-contacts-scrollbox">
                                        {formData.contacts.map((c, i) => (
                                            <div key={i} className="client-contact-card">
                                                <div className="contact-card-top">
                                                    <span className="contact-index-pill">
                                                        #{i + 1} {c.role || 'Contact'}
                                                    </span>
                                                </div>
                                                <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#fff' }}>
                                                    {c.name || 'Sans nom'}
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                                    {c.phone && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <Phone size={12} /> {c.phone}
                                                        </span>
                                                    )}
                                                    {c.email && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <Mail size={12} /> {c.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '10px 0' }}>
                                        Aucun représentant secondaire enregistré pour ce client.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Edit / Create Form Mode */
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div className="client-modal-body">
                            {/* Two-Column Grid */}
                            <div className="client-two-columns-layout">
                                {/* Left Column: Identity & Localization */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Card 1: Identity & Legal Form */}
                                    <div className="client-section-box">
                                        <div className="client-section-header">
                                            <span className="client-section-title">
                                                <Building2 size={16} /> Statut Juridique & Raison Sociale
                                            </span>
                                            <span className="client-section-badge">Étape 1</span>
                                        </div>

                                        {/* Category Interactive Pills */}
                                        <div className="client-field-group">
                                            <label className="client-field-label">Catégorie Juridique</label>
                                            <div className="client-type-selector-grid">
                                                {clientTypes.map(t => (
                                                    <button
                                                        key={t.key}
                                                        type="button"
                                                        className={`client-type-pill-btn ${currentType === t.key ? 'active' : ''}`}
                                                        onClick={() => setFormData({ ...formData, type: t.key })}
                                                    >
                                                        <span className="pill-icon">{React.createElement(t.icon, { size: 14 })}</span>
                                                        <span>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Company / Client Name */}
                                        <div className="client-field-group">
                                            <label className="client-field-label">
                                                Raison Sociale / Nom Légal <span className="required-dot">*</span>
                                            </label>
                                            <div className="client-input-wrapper">
                                                <span className="client-input-icon"><Building2 size={16} /></span>
                                                <input
                                                    required
                                                    className="client-text-input"
                                                    placeholder="Ex: Maghreb Media Tech, SARL..."
                                                    value={formData.name || ''}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* ID & Matricule Fiscal */}
                                        <div className="client-subgrid-2">
                                            <div className="client-field-group">
                                                <label className="client-field-label">ID Compte Interne</label>
                                                <div className="client-input-wrapper">
                                                    <span className="client-input-icon"><Hash size={16} /></span>
                                                    <input
                                                        className="client-text-input"
                                                        style={{ paddingRight: '70px' }}
                                                        placeholder="CLI-2026-01"
                                                        value={formData.customId || ''}
                                                        onChange={e => setFormData({ ...formData, customId: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="client-input-trailing-action"
                                                        onClick={handleGenerateId}
                                                        title="Générer automatiquement un ID"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                    >
                                                        <Zap size={12} /> Auto
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="client-field-group">
                                                <label className="client-field-label">Matricule Fiscal</label>
                                                <div className="client-input-wrapper">
                                                    <span className="client-input-icon"><FileText size={16} /></span>
                                                    <input
                                                        className="client-text-input"
                                                        style={{ paddingRight: '56px' }}
                                                        placeholder="1234567/A/M/000"
                                                        value={formData.matriculeFiscal || ''}
                                                        onChange={e => setFormData({ ...formData, matriculeFiscal: e.target.value })}
                                                    />
                                                    <span className="client-input-trailing-badge">MF</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Address & Commercial Terms */}
                                    <div className="client-section-box">
                                        <div className="client-section-header">
                                            <span className="client-section-title">
                                                <MapPin size={16} /> Siège Social & Facturation
                                            </span>
                                            <span className="client-section-badge">Étape 2</span>
                                        </div>

                                        <div className="client-field-group">
                                            <label className="client-field-label">Adresse du Siège</label>
                                            <div className="client-input-wrapper">
                                                <span className="client-input-icon"><MapPin size={16} /></span>
                                                <input
                                                    className="client-text-input"
                                                    placeholder="Rue, Z.I., Bâtiment, Étage..."
                                                    value={formData.address || ''}
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="client-subgrid-2">
                                            <div className="client-field-group">
                                                <label className="client-field-label">Ville / Gouvernorat</label>
                                                <div className="client-input-wrapper">
                                                    <span className="client-input-icon"><Building2 size={16} /></span>
                                                    <input
                                                        className="client-text-input"
                                                        placeholder="Tunis, Sousse, Sfax..."
                                                        value={formData.city || ''}
                                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="client-field-group">
                                                <label className="client-field-label">Délai de Paiement</label>
                                                <select
                                                    className="client-text-input"
                                                    style={{ paddingLeft: '14px', cursor: 'pointer' }}
                                                    value={formData.paymentTerms !== undefined ? formData.paymentTerms : 30}
                                                    onChange={e => setFormData({ ...formData, paymentTerms: Number(e.target.value) })}
                                                >
                                                    <option value={0}>Comptant (Immédiat)</option>
                                                    <option value={15}>15 Jours</option>
                                                    <option value={30}>30 Jours (Standard)</option>
                                                    <option value={60}>60 Jours</option>
                                                    <option value={90}>90 Jours</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="client-field-group">
                                            <label className="client-field-label">Consignes & Notes Internes</label>
                                            <div className="client-input-wrapper">
                                                <span className="client-input-icon" style={{ top: '14px' }}><FileText size={16} /></span>
                                                <textarea
                                                    className="client-textarea"
                                                    placeholder="Consignes de livraison, accès badges, protocole comptable..."
                                                    value={formData.notes || ''}
                                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Primary Contact & Authorized Representatives */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Card 3: Key Contact Person */}
                                    <div className="client-section-box">
                                        <div className="client-section-header">
                                            <span className="client-section-title">
                                                <User size={16} /> Point de Contact Principal
                                            </span>
                                            <span className="client-section-badge" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.1)' }}>
                                                Référent Clé
                                            </span>
                                        </div>

                                        <div className="client-field-group">
                                            <label className="client-field-label">Responsable / Interlocuteur</label>
                                            <div className="client-input-wrapper">
                                                <span className="client-input-icon"><User size={16} /></span>
                                                <input
                                                    className="client-text-input"
                                                    placeholder="Ex: M. Karim Ben Salem"
                                                    value={formData.contactPerson || ''}
                                                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="client-subgrid-2">
                                            <div className="client-field-group">
                                                <label className="client-field-label">Téléphone Principal</label>
                                                <div className="client-input-wrapper">
                                                    <span className="client-input-icon"><Phone size={16} /></span>
                                                    <input
                                                        className="client-text-input"
                                                        placeholder="+216 -- --- ---"
                                                        value={formData.phone || ''}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="client-field-group">
                                                <label className="client-field-label">Email Officiel</label>
                                                <div className="client-input-wrapper">
                                                    <span className="client-input-icon"><Mail size={16} /></span>
                                                    <input
                                                        type="email"
                                                        className="client-text-input"
                                                        placeholder="contact@entreprise.tn"
                                                        value={formData.email || ''}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 4: Authorized Representatives (Contacts Délégués) */}
                                    <div className="client-section-box" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div className="client-section-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="client-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={16} /> Contacts Délégués
                                                </span>
                                                <span className="client-section-badge">
                                                    {formData.contacts?.length || 0}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className="add-contact-outline-btn"
                                                onClick={handleAddContact}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={14} /> Ajouter
                                            </button>
                                        </div>

                                        {/* Contact cards list or empty state */}
                                        {formData.contacts && formData.contacts.length > 0 ? (
                                            <div className="client-contacts-scrollbox">
                                                {formData.contacts.map((contact, idx) => (
                                                    <div key={idx} className="client-contact-card">
                                                        <div className="contact-card-top">
                                                            <span className="contact-index-pill">
                                                                #{idx + 1}
                                                            </span>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <input
                                                                    className="contact-mini-input"
                                                                    style={{ width: '160px', padding: '4px 8px', fontSize: '11px', color: '#818cf8', fontWeight: '700' }}
                                                                    placeholder="Rôle (ex: Comptable)"
                                                                    value={contact.role || ''}
                                                                    onChange={e => handleUpdateContact(idx, 'role', e.target.value)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="contact-delete-btn"
                                                                    onClick={() => handleRemoveContact(idx)}
                                                                    title="Supprimer ce contact"
                                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Full Name */}
                                                        <div className="client-input-wrapper">
                                                            <span className="client-input-icon" style={{ left: '10px' }}><User size={15} /></span>
                                                            <input
                                                                className="contact-mini-input"
                                                                style={{ paddingLeft: '32px' }}
                                                                placeholder="Nom & Prénom du représentant"
                                                                value={contact.name || ''}
                                                                onChange={e => handleUpdateContact(idx, 'name', e.target.value)}
                                                            />
                                                        </div>

                                                        {/* Phone & Email */}
                                                        <div className="contact-inputs-grid">
                                                            <div className="client-input-wrapper">
                                                                <span className="client-input-icon" style={{ left: '10px' }}><Phone size={14} /></span>
                                                                <input
                                                                    className="contact-mini-input"
                                                                    style={{ paddingLeft: '32px' }}
                                                                    placeholder="Tél direct"
                                                                    value={contact.phone || ''}
                                                                    onChange={e => handleUpdateContact(idx, 'phone', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="client-input-wrapper">
                                                                <span className="client-input-icon" style={{ left: '10px' }}><Mail size={14} /></span>
                                                                <input
                                                                    type="email"
                                                                    className="contact-mini-input"
                                                                    style={{ paddingLeft: '32px' }}
                                                                    placeholder="Email professionnel"
                                                                    value={contact.email || ''}
                                                                    onChange={e => handleUpdateContact(idx, 'email', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="client-contacts-empty" style={{ flex: 1, justifyContent: 'center' }}>
                                                <div className="empty-contacts-icon">
                                                    <Users size={28} />
                                                </div>
                                                <div className="empty-contacts-title">
                                                    Aucun représentant secondaire
                                                </div>
                                                <p className="empty-contacts-desc">
                                                    Spécifiez des interlocuteurs dédiés (Chef de projet, Comptable, Régisseur) pour fluidifier le suivi d'équipe.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="add-contact-outline-btn"
                                                    onClick={handleAddContact}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Plus size={14} /> Ajouter le premier représentant
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions Footer */}
                        <div className="client-modal-footer">
                            <div className="client-footer-summary">
                                <span>Profil: <strong className="summary-highlight">{currentType}</strong></span>
                                <span>•</span>
                                <span><strong className="summary-highlight">{formData.contacts?.length || 0}</strong> représentant(s)</span>
                                {formData.matriculeFiscal && (
                                    <>
                                        <span>•</span>
                                        <span style={{ fontFamily: 'monospace' }}>MF: {formData.matriculeFiscal}</span>
                                    </>
                                )}
                            </div>

                            <div className="client-footer-btns">
                                <button
                                    type="button"
                                    className="client-btn-secondary"
                                    onClick={onClose}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="client-btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Check size={16} />
                                    <span>{formData._id ? 'Mettre à jour' : 'Enregistrer le Profil'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Footer for Read-Only Mode */}
                {isReadOnly && (
                    <div className="client-modal-footer">
                        <div className="client-footer-summary">
                            <span>Dossier client certifié</span>
                        </div>
                        <div className="client-footer-btns">
                            <button
                                type="button"
                                className="client-btn-secondary"
                                onClick={onClose}
                            >
                                Fermer
                            </button>
                            {canEdit && (
                                <button
                                    type="button"
                                    className="client-btn-primary"
                                    onClick={switchToEdit}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Edit3 size={15} />
                                    <span>Modifier la Fiche</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientModal;
