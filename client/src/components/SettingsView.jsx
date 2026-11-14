import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddressAutocomplete from './AddressAutocomplete';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import './SettingsView.css';
import { 
    Settings, 
    Globe, 
    CreditCard, 
    Building, 
    Building2,
    Save, 
    Database, 
    AlertCircle, 
    CheckCircle2,
    RefreshCcw,
    MapPin,
    Mail,
    Phone,
    Hash,
    Landmark,
    FileText,
    Check,
    Copy,
    Sparkles,
    Layers,
    Search,
    ShieldCheck,
    Coins,
    BookOpen,
    Lightbulb,
    BarChart3,
    Receipt,
    FileSpreadsheet,
    Percent,
    ArrowUpRight,
    X
} from 'lucide-react';

const SettingsView = () => {
    const [activeTab, setActiveTab] = useState('company'); // company, currencies, accounting
    const { showSuccess, showError, showInfo } = useNotification();
    const confirm = useConfirm();
    const [selectedCompany, setSelectedCompany] = useState('bright'); // 'bright' or 'square'
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [accountSearch, setAccountSearch] = useState('');
    const [copiedField, setCopiedField] = useState(null);

    // Company Settings
    const [companySettings, setCompanySettings] = useState(null);

    // Currencies
    const [currencies, setCurrencies] = useState([]);

    // Chart of Accounts
    const [chartOfAccounts, setChartOfAccounts] = useState({});

    useEffect(() => {
        setCompanySettings(null); // Clear previous settings to prevent race conditions
        setError(null);
        fetchData();
    }, [activeTab, selectedCompany]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'company') {
                const res = await api.get(`/settings/company?key=${selectedCompany}`);
                setCompanySettings(res.data);
            } else if (activeTab === 'currencies') {
                const res = await api.get('/settings/currencies');
                setCurrencies(res.data || []);
            } else if (activeTab === 'accounting') {
                const res = await api.get('/settings/chart-of-accounts');
                setChartOfAccounts(res.data || {});
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Impossible de récupérer les paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        setSaving(true);
        try {
            await api.put(`/settings/company?key=${selectedCompany}`, companySettings);
            const companyTitle = selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event';
            showSuccess(`Configuration ${companyTitle} enregistrée avec succès !`, "Paramètres Enregistrés");
            setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err) {
            showError('Échec de synchronisation système : ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateField = (path, value) => {
        const keys = path.split('.');
        const updated = { ...companySettings };
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        setCompanySettings(updated);
    };

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        showInfo(`${fieldName} copié dans le presse-papier`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSeedCurrencies = async () => {
        const ok = await confirm({
            title: 'Initialisation des Devises',
            message: 'Initialiser les devises par défaut (TND, EUR, USD) ? Cette action configurera les devises de facturation et les parités de base.',
            confirmText: 'Initialiser les Devises',
            cancelText: 'Annuler'
        });
        
        if (!ok) return;

        try {
            await api.post('/settings/currencies/seed');
            showSuccess('Devises financières initialisées avec succès', "Initialisation Terminée");
            fetchData();
        } catch (err) {
            if (err.response?.status === 403) {
                showError("Accès Refusé : Vous n'avez pas les permissions requises", "Erreur Permission");
            } else {
                showError('Échec de l\'initialisation des devises : ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleSeedAccounts = async () => {
        const ok = await confirm({
            title: 'Génération du Plan Comptable',
            message: `Générer le plan comptable standard pour l'entité ${selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'} ?`,
            confirmText: 'Générer le Plan',
            cancelText: 'Annuler'
        });

        if (!ok) return;

        try {
            await api.post('/accounting/seed');
            showSuccess(`Plan comptable généré pour ${selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'}`, "Comptabilité Synchronisée");
            fetchData();
        } catch (err) {
            showError('Échec de la génération comptable : ' + (err.response?.data?.error || err.message));
        }
    };

    // Filter accounts by search term
    const getFilteredAccounts = () => {
        if (!accountSearch.trim()) return chartOfAccounts;
        const query = accountSearch.toLowerCase();
        const filtered = {};

        Object.entries(chartOfAccounts).forEach(([className, accounts]) => {
            const matchingAccounts = (accounts || []).filter(acc => 
                (acc.code && acc.code.toLowerCase().includes(query)) ||
                (acc.name && acc.name.toLowerCase().includes(query)) ||
                (acc.category && acc.category.toLowerCase().includes(query))
            );
            if (matchingAccounts.length > 0) {
                filtered[className] = matchingAccounts;
            }
        });

        return filtered;
    };

    const totalAccountsCount = Object.values(chartOfAccounts).reduce((acc, list) => acc + (list?.length || 0), 0);
    const filteredAccountsCount = Object.values(getFilteredAccounts()).reduce((acc, list) => acc + (list?.length || 0), 0);

    return (
        <div className="settings-container">
            {/* --- TOP EXECUTIVE HEADER --- */}
            <header className="settings-header">
                <div className="settings-title-group">
                    <div className="settings-title-badge-wrap">
                        <span className="settings-title-badge">
                            <Settings size={22} />
                        </span>
                        <div>
                            <h1>Paramètres & Configuration Système</h1>
                            <p className="settings-subtitle">
                                Configurez l'identité légale et fiscale, la facturation, les coordonnées bancaires, les devises et le plan comptable.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="settings-header-right">
                    <div className="settings-system-status">
                        <span className="status-dot-pulse" />
                        <span className="status-text">Système Opérationnel</span>
                        <span className="status-divider">•</span>
                        <span className="status-company-tag">
                            {selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'}
                        </span>
                    </div>

                    {activeTab === 'company' && companySettings && (
                        <button
                            onClick={handleSaveCompany}
                            disabled={saving}
                            className="btn-header-save"
                            title="Enregistrer toutes les modifications"
                        >
                            <Save size={16} className={saving ? 'spin-animation' : ''} />
                            <span>{saving ? 'Sauvegarde...' : 'Enregistrer'}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* --- NAVIGATION TABS --- */}
            <div className="settings-nav-tabs-container">
                <nav className="settings-nav-tabs" aria-label="Onglets de paramètres">
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`settings-tab-btn tab-company ${activeTab === 'company' ? 'active' : ''}`}
                    >
                        <Building2 size={18} />
                        <span>Identité Entreprise</span>
                        <span className="tab-pill-badge">{selectedCompany === 'bright' ? 'Bright' : 'Square'}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('currencies')}
                        className={`settings-tab-btn tab-currencies ${activeTab === 'currencies' ? 'active' : ''}`}
                    >
                        <Coins size={18} />
                        <span>Devises & Taux de Change</span>
                        {currencies.length > 0 && <span className="tab-pill-badge">{currencies.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('accounting')}
                        className={`settings-tab-btn tab-accounting ${activeTab === 'accounting' ? 'active' : ''}`}
                    >
                        <BookOpen size={18} />
                        <span>Plan Comptable</span>
                        {totalAccountsCount > 0 && <span className="tab-pill-badge">{totalAccountsCount}</span>}
                    </button>
                </nav>
            </div>

            {/* ========================================================
               TAB 1: COMPANY INFO (BALANCED 2-COLUMN DASHBOARD)
               ======================================================== */}
            {activeTab === 'company' && (
                <div className="settings-tab-content">
                    {/* Brand Selector Cards */}
                    <div className="company-brand-selector">
                        <div
                            onClick={() => setSelectedCompany('bright')}
                            className={`brand-card-btn ${selectedCompany === 'bright' ? 'active bright-active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCompany('bright'); }}
                        >
                            <div className="brand-card-icon-box bright-icon-box">
                                <Sparkles size={24} />
                            </div>
                            <div className="brand-card-info">
                                <div className="brand-card-title">
                                    <span>Bright Stage</span>
                                    <span className="brand-profile-pill bright-pill">
                                        Profil Principal
                                    </span>
                                </div>
                                <p className="brand-card-desc">
                                    Événementiel, Audiovisuel, Écrans LED & Scénographie Technique
                                </p>
                            </div>
                            <div className="brand-card-badge">
                                {selectedCompany === 'bright' && <Check size={14} strokeWidth={3} />}
                            </div>
                        </div>

                        <div
                            onClick={() => setSelectedCompany('square')}
                            className={`brand-card-btn ${selectedCompany === 'square' ? 'active square-active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCompany('square'); }}
                        >
                            <div className="brand-card-icon-box square-icon-box">
                                <Layers size={24} />
                            </div>
                            <div className="brand-card-info">
                                <div className="brand-card-title">
                                    <span>Square Event</span>
                                    <span className="brand-profile-pill square-pill">
                                        Filiale & Mobilier
                                    </span>
                                </div>
                                <p className="brand-card-desc">
                                    Mobilier Événementiel, Aménagement d'Espaces & Logistique
                                </p>
                            </div>
                            <div className="brand-card-badge">
                                {selectedCompany === 'square' && <Check size={14} strokeWidth={3} />}
                            </div>
                        </div>
                    </div>

                    {/* Loading & Error States */}
                    {loading && (
                        <div className="settings-state-card settings-loading-card">
                            <RefreshCcw size={32} className="spin-animation settings-loading-icon" />
                            <h3>Chargement des paramètres {selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'}...</h3>
                            <p>Récupération des données d'entreprise en temps réel depuis le serveur.</p>
                        </div>
                    )}

                    {error && (
                        <div className="settings-error-banner">
                            <div className="settings-error-content">
                                <AlertCircle size={22} className="settings-error-icon" />
                                <div>
                                    <strong>Erreur de chargement :</strong> {error}
                                </div>
                            </div>
                            <button onClick={fetchData} className="btn-retry">
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Main Content Grid: Forms + Sticky Preview & Actions */}
                    {companySettings && !loading && (
                        <div className="settings-layout-grid">
                            
                            {/* --- LEFT COLUMN: DETAILED CONFIGURATION FORMS --- */}
                            <div className="settings-form-sections">
                                
                                {/* 1. General & Legal Information */}
                                <section className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-header-icon icon-blue">
                                            <Building size={20} />
                                        </div>
                                        <div>
                                            <h3>Identité Légale & Raison Sociale</h3>
                                            <p className="card-header-sub">Informations officielles figurant sur vos documents contractuels</p>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label>Nom Commercial</label>
                                            <div className="settings-input-wrapper">
                                                <Building2 size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.companyName || ''}
                                                    onChange={e => handleUpdateField('companyName', e.target.value)}
                                                    placeholder="Ex: Bright Stage"
                                                />
                                            </div>
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Raison Sociale Officielle</label>
                                            <div className="settings-input-wrapper">
                                                <ShieldCheck size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.legalName || ''}
                                                    onChange={e => handleUpdateField('legalName', e.target.value)}
                                                    placeholder="Ex: Bright Stage SARL"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label>Matricule Fiscal (NIF / TVA)</label>
                                            <div className="settings-input-wrapper">
                                                <Hash size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.taxId || ''}
                                                    onChange={e => handleUpdateField('taxId', e.target.value)}
                                                    placeholder="Ex: 1234567/A/B/000"
                                                />
                                            </div>
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Email Officiel de Contact</label>
                                            <div className="settings-input-wrapper">
                                                <Mail size={16} className="settings-input-icon" />
                                                <input
                                                    type="email"
                                                    className="settings-input-field"
                                                    value={companySettings.email || ''}
                                                    onChange={e => handleUpdateField('email', e.target.value)}
                                                    placeholder="contact@brightstage.tn"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label>Téléphone Standard</label>
                                            <div className="settings-input-wrapper">
                                                <Phone size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.phone || ''}
                                                    onChange={e => handleUpdateField('phone', e.target.value)}
                                                    placeholder="+216 29 953 753"
                                                />
                                            </div>
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Site Web Officiel</label>
                                            <div className="settings-input-wrapper">
                                                <Globe size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.website || ''}
                                                    onChange={e => handleUpdateField('website', e.target.value)}
                                                    placeholder="https://brightstage.tn"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Address & Location */}
                                <section className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-header-icon icon-rose">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3>Siège Social & Localisation</h3>
                                            <p className="card-header-sub">Adresse de facturation et localisation du dépôt central</p>
                                        </div>
                                    </div>

                                    <div className="settings-form-single">
                                        <div className="settings-form-group">
                                            <label>Adresse Complète (Recherche Intelligente OpenStreetMap / Google)</label>
                                            <div className="settings-input-wrapper settings-autocomplete-wrapper">
                                                <MapPin size={16} className="settings-input-icon" />
                                                <AddressAutocomplete
                                                    value={companySettings.address?.street || ''}
                                                    onChange={(addressData) => {
                                                        const updated = { ...companySettings };
                                                        if (!updated.address) updated.address = {};

                                                        if (addressData.street) updated.address.street = addressData.street;
                                                        if (addressData.city) updated.address.city = addressData.city;
                                                        if (addressData.postalCode) updated.address.postalCode = addressData.postalCode;
                                                        if (addressData.country) updated.address.country = addressData.country;

                                                        setCompanySettings(updated);
                                                    }}
                                                    placeholder="Saisissez votre adresse..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="settings-form-row row-3-col">
                                        <div className="settings-form-group">
                                            <label>Ville</label>
                                            <input
                                                type="text"
                                                className="settings-input-field no-icon-input"
                                                value={companySettings.address?.city || ''}
                                                onChange={e => handleUpdateField('address.city', e.target.value)}
                                                placeholder="Tunis"
                                            />
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Code Postal</label>
                                            <input
                                                type="text"
                                                className="settings-input-field no-icon-input"
                                                value={companySettings.address?.postalCode || ''}
                                                onChange={e => handleUpdateField('address.postalCode', e.target.value)}
                                                placeholder="1000"
                                            />
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Pays</label>
                                            <input
                                                type="text"
                                                className="settings-input-field no-icon-input"
                                                value={companySettings.address?.country || ''}
                                                onChange={e => handleUpdateField('address.country', e.target.value)}
                                                placeholder="Tunisie"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Invoicing & Quotes Defaults (NEW ENHANCEMENT) */}
                                <section className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-header-icon icon-purple">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <h3>Paramètres de Facturation & Numérotation</h3>
                                            <p className="card-header-sub">Préfixes de séries documentaires et taux de TVA par défaut</p>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label>Préfixe Factures</label>
                                            <div className="settings-input-wrapper">
                                                <Receipt size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.invoicePrefix || ''}
                                                    onChange={e => handleUpdateField('invoicePrefix', e.target.value)}
                                                    placeholder="Ex: INV- ou FACT-"
                                                />
                                            </div>
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Préfixe Devis</label>
                                            <div className="settings-input-wrapper">
                                                <FileSpreadsheet size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.quotePrefix || ''}
                                                    onChange={e => handleUpdateField('quotePrefix', e.target.value)}
                                                    placeholder="Ex: QUOT- ou DEV-"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label>Taux de TVA Standard (%)</label>
                                            <div className="settings-input-wrapper">
                                                <Percent size={16} className="settings-input-icon" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="settings-input-field"
                                                    value={companySettings.defaultVATRate !== undefined ? (companySettings.defaultVATRate > 1 ? companySettings.defaultVATRate : companySettings.defaultVATRate * 100) : 19}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        handleUpdateField('defaultVATRate', val / 100);
                                                    }}
                                                    placeholder="19"
                                                />
                                            </div>
                                        </div>

                                        <div className="settings-form-group">
                                            <label>Devise Principale du Compte</label>
                                            <div className="settings-input-wrapper">
                                                <Coins size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.defaultCurrency || 'TND'}
                                                    onChange={e => handleUpdateField('defaultCurrency', e.target.value)}
                                                    placeholder="TND"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 4. Banking Information */}
                                <section className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-header-icon icon-emerald">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h3>Coordonnées Bancaires & RIB</h3>
                                            <p className="card-header-sub">Informations bancaires pour les règlements par virement des clients</p>
                                        </div>
                                    </div>

                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label>Nom de la Banque</label>
                                            <div className="settings-input-wrapper">
                                                <Landmark size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.bankDetails?.bankName || ''}
                                                    onChange={e => handleUpdateField('bankDetails.bankName', e.target.value)}
                                                    placeholder="Ex: BIAT, Attijari, Amen Bank..."
                                                />
                                            </div>
                                        </div>

                                        <div className="settings-form-group">
                                            <label>IBAN / RIB (20 à 24 Caractères)</label>
                                            <div className="settings-input-wrapper">
                                                <CreditCard size={16} className="settings-input-icon" />
                                                <input
                                                    type="text"
                                                    className="settings-input-field"
                                                    value={companySettings.bankDetails?.iban || ''}
                                                    onChange={e => handleUpdateField('bankDetails.iban', e.target.value)}
                                                    placeholder="TN59 0800 1234 5678 9012 3456"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 5. Legal & Terms Settings */}
                                <section className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-header-icon icon-amber">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3>Mentions Légales & Conditions de Vente</h3>
                                            <p className="card-header-sub">Textes officiels imprimés en pied de page des factures et devis</p>
                                        </div>
                                    </div>

                                    <div className="settings-form-group" style={{ marginBottom: 18 }}>
                                        <label>Mentions Légales & Registre de Commerce (Pied de Page PDF)</label>
                                        <textarea
                                            className="settings-textarea-field"
                                            value={companySettings.legalMentions || ''}
                                            onChange={e => handleUpdateField('legalMentions', e.target.value)}
                                            rows={3}
                                            placeholder="Ex: SARL au capital de 10,000 DT - RC Tunis B1234567 - R.I.B: 0800..."
                                        />
                                    </div>

                                    <div className="settings-form-group">
                                        <label>Conditions Générales de Vente & Modalités de Paiement</label>
                                        <textarea
                                            className="settings-textarea-field"
                                            value={companySettings.termsAndConditions || ''}
                                            onChange={e => handleUpdateField('termsAndConditions', e.target.value)}
                                            rows={3}
                                            placeholder="Ex: Acompte de 50% à la commande, solde à la livraison. Validité de l'offre : 30 jours."
                                        />
                                    </div>
                                </section>

                            </div>

                            {/* --- RIGHT COLUMN: LIVE INTERACTIVE BRAND PREVIEW & ACTIONS --- */}
                            <aside className="settings-sidebar-sticky">
                                
                                {/* Corporate ID Business Card Preview */}
                                <div className="corporate-preview-card">
                                    <div className="corporate-card-top">
                                        <div 
                                            className="corporate-brand-emblem"
                                            style={{
                                                background: selectedCompany === 'bright' 
                                                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                                                    : 'linear-gradient(135deg, #f59e0b, #d97706)'
                                            }}
                                        >
                                            {selectedCompany === 'bright' ? 'BS' : 'SE'}
                                        </div>
                                        <span className="corporate-type-tag">
                                            Aperçu En-tête PDF
                                        </span>
                                    </div>

                                    <h2 className="corporate-name-display">
                                        {companySettings.companyName || (selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event')}
                                    </h2>
                                    <div className="corporate-legal-display">
                                        {companySettings.legalName || 'Raison Sociale Non Renseignée'}
                                    </div>

                                    <div className="corporate-meta-pills">
                                        <div 
                                            className="corporate-meta-item copyable-item"
                                            onClick={() => handleCopy(companySettings.taxId, 'Matricule Fiscal')}
                                            title="Cliquer pour copier"
                                        >
                                            <Hash size={14} />
                                            <span><strong>Matricule :</strong> {companySettings.taxId || 'Non Défini'}</span>
                                            {companySettings.taxId && (
                                                <span className="copy-icon-wrap">
                                                    {copiedField === 'Matricule Fiscal' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                                </span>
                                            )}
                                        </div>

                                        <div 
                                            className="corporate-meta-item copyable-item"
                                            onClick={() => handleCopy(companySettings.email, 'Email')}
                                            title="Cliquer pour copier"
                                        >
                                            <Mail size={14} />
                                            <span>{companySettings.email || 'Email non configuré'}</span>
                                            {companySettings.email && (
                                                <span className="copy-icon-wrap">
                                                    {copiedField === 'Email' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                                </span>
                                            )}
                                        </div>

                                        <div 
                                            className="corporate-meta-item copyable-item"
                                            onClick={() => handleCopy(companySettings.phone, 'Téléphone')}
                                            title="Cliquer pour copier"
                                        >
                                            <Phone size={14} />
                                            <span>{companySettings.phone || 'Téléphone non configuré'}</span>
                                            {companySettings.phone && (
                                                <span className="copy-icon-wrap">
                                                    {copiedField === 'Téléphone' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                                </span>
                                            )}
                                        </div>

                                        <div className="corporate-meta-item">
                                            <MapPin size={14} />
                                            <span>
                                                {companySettings.address?.street 
                                                    ? `${companySettings.address.street}, ${companySettings.address.city || ''} ${companySettings.address.postalCode || ''}`
                                                    : 'Adresse non configurée'}
                                            </span>
                                        </div>

                                        {companySettings.website && (
                                            <div className="corporate-meta-item">
                                                <Globe size={14} />
                                                <span>{companySettings.website}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div 
                                        className="corporate-bank-badge copyable-item"
                                        onClick={() => handleCopy(companySettings.bankDetails?.iban, 'RIB / IBAN')}
                                        title="Cliquer pour copier le RIB"
                                    >
                                        <div className="corporate-bank-badge-header">
                                            <span className="corporate-bank-label">
                                                Banque : {companySettings.bankDetails?.bankName || 'Non Renseignée'}
                                            </span>
                                            {companySettings.bankDetails?.iban && (
                                                <span className="copy-icon-wrap">
                                                    {copiedField === 'RIB / IBAN' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                                </span>
                                            )}
                                        </div>
                                        <div className="corporate-bank-iban">
                                            {companySettings.bankDetails?.iban || 'TN-- ---- ---- ---- ---- ----'}
                                        </div>
                                    </div>
                                </div>

                                {/* Save & Sync Action Card */}
                                <div className="settings-action-card">
                                    <button
                                        onClick={handleSaveCompany}
                                        disabled={saving}
                                        className="btn-settings-save"
                                    >
                                        <Save size={18} className={saving ? 'spin-animation' : ''} />
                                        <span>{saving ? 'Synchronisation en cours...' : 'Enregistrer la Configuration'}</span>
                                    </button>

                                    {lastSaved && (
                                        <div className="settings-last-saved">
                                            <CheckCircle2 size={14} />
                                            <span>Dernière sauvegarde réussie à {lastSaved}</span>
                                        </div>
                                    )}

                                    <p className="settings-sync-note">
                                        <Lightbulb size={16} className="sync-note-icon" />
                                        <span>Ces coordonnées s'appliquent automatiquement à toutes vos Factures, Devis et Bons de Livraison pour l'entité <strong>{selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'}</strong>.</span>
                                    </p>
                                </div>

                            </aside>

                        </div>
                    )}
                </div>
            )}

            {/* ========================================================
               TAB 2: CURRENCIES MANAGEMENT (SLEEK CARDS & TABLE)
               ======================================================== */}
            {activeTab === 'currencies' && (
                <div className="settings-subview-card">
                    <div className="settings-subview-header">
                        <div className="settings-subview-header-left">
                            <div className="subview-icon-badge icon-purple">
                                <Coins size={22} />
                            </div>
                            <div>
                                <h2 className="settings-subview-title">
                                    Gestion des Devises & Taux de Change
                                </h2>
                                <p className="settings-subview-desc">
                                    Définissez les monnaies autorisées pour la facturation internationale et leurs parités de change.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSeedCurrencies}
                            className="btn-action-seed btn-seed-purple"
                        >
                            <Globe size={16} />
                            <span>Initialiser Devises Standard</span>
                        </button>
                    </div>

                    {/* Currency Metrics Summary */}
                    {currencies.length > 0 && (
                        <div className="currencies-summary-grid">
                            <div className="currency-summary-card">
                                <span className="summary-label">Devises Enregistrées</span>
                                <span className="summary-val">{currencies.length}</span>
                            </div>
                            <div className="currency-summary-card">
                                <span className="summary-label">Devise Principale</span>
                                <span className="summary-val text-emerald">
                                    {currencies.find(c => c.isBaseCurrency)?.code || 'TND'}
                                </span>
                            </div>
                            <div className="currency-summary-card">
                                <span className="summary-label">Devises Étrangères</span>
                                <span className="summary-val text-blue">
                                    {currencies.filter(c => !c.isBaseCurrency).length}
                                </span>
                            </div>
                        </div>
                    )}

                    {currencies.length === 0 ? (
                        <div className="settings-state-card settings-empty-state">
                            <Coins size={44} className="empty-state-icon text-purple" />
                            <h4>Aucune devise configurée</h4>
                            <p>
                                Cliquez sur le bouton ci-dessus pour initialiser automatiquement les devises de référence (TND, EUR, USD).
                            </p>
                            <button
                                onClick={handleSeedCurrencies}
                                className="btn-action-seed btn-seed-purple"
                                style={{ marginTop: 16 }}
                            >
                                <Globe size={16} />
                                <span>Initialiser Devises Standard</span>
                            </button>
                        </div>
                    ) : (
                        <div className="settings-table-wrapper">
                            <table className="settings-modern-table">
                                <thead>
                                    <tr>
                                        <th>Code ISO</th>
                                        <th>Nom de la Devise</th>
                                        <th>Symbole</th>
                                        <th>Taux de Change</th>
                                        <th>Rôle & Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currencies.map(curr => (
                                        <tr key={curr._id}>
                                            <td className="currency-code-cell">
                                                <span className="currency-code-badge">{curr.code}</span>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{curr.name}</td>
                                            <td>
                                                <span className="currency-symbol-tag">{curr.symbol}</span>
                                            </td>
                                            <td className="currency-rate-cell">
                                                {curr.exchangeRate}
                                            </td>
                                            <td>
                                                {curr.isBaseCurrency ? (
                                                    <span className="badge-base-currency">
                                                        <Check size={12} strokeWidth={3} />
                                                        Devise de Référence
                                                    </span>
                                                ) : (
                                                    <span className="badge-secondary-currency">Devise Secondaire</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================
               TAB 3: CHART OF ACCOUNTS (ORGANIZED CLASSES)
               ======================================================== */}
            {activeTab === 'accounting' && (
                <div className="settings-subview-card">
                    <div className="settings-subview-header">
                        <div className="settings-subview-header-left">
                            <div className="subview-icon-badge icon-emerald">
                                <BarChart3 size={22} />
                            </div>
                            <div>
                                <h2 className="settings-subview-title">
                                    Plan Comptable Général
                                </h2>
                                <p className="settings-subview-desc">
                                    Structure comptable normalisée pour la génération des écritures de ventes, achats et trésorerie.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSeedAccounts}
                            className="btn-action-seed btn-seed-emerald"
                        >
                            <Database size={16} />
                            <span>Générer le Plan Standard</span>
                        </button>
                    </div>

                    {/* Filter Search Input & Stats */}
                    {Object.keys(chartOfAccounts).length > 0 && (
                        <div className="accounts-toolbar">
                            <div className="accounts-search-wrapper">
                                <Search size={16} className="settings-input-icon" />
                                <input
                                    type="text"
                                    className="settings-input-field"
                                    placeholder="Rechercher par numéro de compte ou libellé..."
                                    value={accountSearch}
                                    onChange={e => setAccountSearch(e.target.value)}
                                />
                                {accountSearch && (
                                    <button 
                                        className="search-clear-btn" 
                                        onClick={() => setAccountSearch('')}
                                        title="Effacer"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="accounts-count-tag">
                                {accountSearch ? (
                                    <span>{filteredAccountsCount} / {totalAccountsCount} comptes trouvés</span>
                                ) : (
                                    <span>Total : {totalAccountsCount} comptes dans le plan</span>
                                )}
                            </div>
                        </div>
                    )}

                    {Object.keys(chartOfAccounts).length === 0 ? (
                        <div className="settings-state-card settings-empty-state">
                            <BookOpen size={44} className="empty-state-icon text-emerald" />
                            <h4>Aucun compte comptable configuré</h4>
                            <p>
                                Cliquez sur "Générer le Plan Standard" pour initialiser l'arborescence comptable complète pour {selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'}.
                            </p>
                            <button
                                onClick={handleSeedAccounts}
                                className="btn-action-seed btn-seed-emerald"
                                style={{ marginTop: 16 }}
                            >
                                <Database size={16} />
                                <span>Générer le Plan Standard</span>
                            </button>
                        </div>
                    ) : (
                        <div className="accounts-classes-container">
                            {Object.entries(getFilteredAccounts()).map(([className, accounts]) => (
                                <div key={className} className="account-class-card">
                                    <div className="account-class-header">
                                        <div className="account-class-title-wrap">
                                            <span className="account-class-indicator" />
                                            <h4>{className}</h4>
                                        </div>
                                        <span className="account-class-count-badge">
                                            {accounts.length} Compte{accounts.length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div className="settings-table-wrapper">
                                        <table className="settings-modern-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '150px' }}>Numéro Compte</th>
                                                    <th>Libellé Officiel</th>
                                                    <th>Catégorie de Flux</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map(acc => (
                                                    <tr key={acc._id}>
                                                        <td className="account-code-cell">
                                                            <code>{acc.code}</code>
                                                        </td>
                                                        <td className="account-name-cell">
                                                            {acc.name}
                                                        </td>
                                                        <td>
                                                            <span className="account-category-pill">
                                                                {acc.category || 'Général'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- MOBILE STICKY SAVE BAR (Visible only on Mobile <= 768px when on company tab) --- */}
            {activeTab === 'company' && companySettings && (
                <div className="mobile-save-bar">
                    <button
                        onClick={handleSaveCompany}
                        disabled={saving}
                        className="mobile-btn-save"
                    >
                        <Save size={18} className={saving ? 'spin-animation' : ''} />
                        <span>{saving ? 'Sauvegarde...' : `Enregistrer (${selectedCompany === 'bright' ? 'Bright' : 'Square'})`}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
