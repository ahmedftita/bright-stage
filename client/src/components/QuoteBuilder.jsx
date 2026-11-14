import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useDialog } from '../context/ConfirmContext';
import { 
    Sparkles, 
    User, 
    Calendar, 
    Clock, 
    ArrowRight, 
    ArrowLeft, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    Layers, 
    Package, 
    Briefcase, 
    Building, 
    FileText, 
    Check, 
    Mail, 
    DollarSign,
    ShieldCheck
} from 'lucide-react';
import './QuoteBuilder.css';

const QuoteBuilder = () => {
    const navigate = useNavigate();
    const { showAlert } = useDialog();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        projectId: new URLSearchParams(window.location.search).get('projectId') || '',
        clientId: '',
        eventName: '',
        dates: { 
            start: new Date().toISOString().split('T')[0], 
            end: new Date().toISOString().split('T')[0], 
            totalDays: 1 
        },
        items: []
    });

    // Derived Financials
    const [financials, setFinancials] = useState({
        totalExclTax: 0,
        totalTax: 0,
        totalCost: 0,
        margin: 0,
        marginPercent: 0,
        stampDuty: 1.000,
        totalInclTax: 0
    });

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        calculateFinancials();
    }, [formData.items]);

    const fetchResources = async () => {
        try {
            const [clientRes, invRes, projectRes] = await Promise.all([
                api.get('/clients'),
                api.get('/inventory'),
                api.get('/projects')
            ]);
            setClients(clientRes.data);
            setInventory(invRes.data);
            setProjects(projectRes.data.filter(p => !p.status || p.status === 'Draft'));

            // Auto-load if projectId in URL
            const urlPid = new URLSearchParams(window.location.search).get('projectId');
            if (urlPid) {
                const proj = projectRes.data.find(p => p._id === urlPid);
                if (proj) handleImportProject(proj._id, projectRes.data);
            }

            setLoading(false);
        } catch (err) {
            console.warn("Professional Services: Some non-critical resources could not be synchronized.", err);
            setLoading(false);
        }
    };

    const handleImportProject = (projectId, freshProjects = null) => {
        const list = freshProjects || projects;
        const project = list.find(p => p._id === projectId);
        if (!project) return;

        setFormData({
            ...formData,
            projectId: project._id,
            clientId: project.clientId?._id || project.clientId || '',
            eventName: project.eventName || '',
            dates: {
                start: project.dates?.start ? new Date(project.dates.start).toISOString().split('T')[0] : '',
                end: project.dates?.end ? new Date(project.dates.end).toISOString().split('T')[0] : '',
                totalDays: project.dates?.totalDays || 1
            },
            items: (project.items || []).map(item => ({
                id: Date.now() + Math.random(),
                type: item.type || 'Rent',
                name: item.name,
                inventoryItem: item.inventoryItem?._id || item.inventoryItem,
                quantity: item.quantity,
                days: item.days || 1,
                price: item.price || 0,
                costPrice: item.costPrice || 0,
                discount: item.discount || 0
            }))
        });
    };

    const handleClientChange = (e) => {
        setFormData({ ...formData, clientId: e.target.value });
    };

    const handleDateChange = (field, value) => {
        let newDates = { ...formData.dates, [field]: value };

        // Validation: End date cannot be before Start date
        if (field === 'start' && newDates.end && value > newDates.end) {
            newDates.end = value;
        } else if (field === 'end' && newDates.start && value < newDates.start) {
            newDates.end = newDates.start;
        }

        // Day calculation
        if (newDates.start && newDates.end) {
            const diff = new Date(newDates.end) - new Date(newDates.start);
            newDates.totalDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
        }
        setFormData({ ...formData, dates: newDates });
    };

    const addItem = (type) => {
        const newItem = {
            id: Date.now(),
            type, // Rent, Sale, Service
            name: '',
            inventoryItem: null,
            quantity: 1,
            days: formData.dates.totalDays,
            price: 0,
            costPrice: 0,
            discount: 0
        };
        setFormData({ ...formData, items: [...formData.items, newItem] });
    };

    const updateItem = (id, field, value) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === id) {
                const updates = { [field]: value };

                // Auto-fill details if inventory item selected
                if (field === 'inventoryItem') {
                    const stockItem = inventory.find(i => i._id === value);
                    if (stockItem) {
                        updates.name = stockItem.name;
                        updates.price = stockItem.rentalPricePerDay || 0;
                        updates.costPrice = stockItem.purchasePrice || 0;
                        updates.brand = stockItem.brand;
                        updates.model = stockItem.model;
                    }
                }
                return { ...item, ...updates };
            }
            return item;
        });
        setFormData({ ...formData, items: updatedItems });
    };

    const removeItem = (id) => {
        setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
    };

    const calculateFinancials = () => {
        let totalExclTax = 0;
        let totalCost = 0;

        formData.items.forEach(item => {
            let lineTotal = 0;
            let lineCost = 0;

            if (item.type === 'Rent') {
                lineTotal = (item.price || 0) * (item.quantity || 0) * (item.days || 1);
                lineCost = (item.costPrice || 0) * (item.quantity || 0);
            } else if (item.type === 'Sale') {
                lineTotal = (item.price || 0) * (item.quantity || 0);
                lineCost = (item.costPrice || 0) * (item.quantity || 0);
            } else {
                lineTotal = (item.price || 0) * (item.quantity || 0);
                lineCost = (item.costPrice || 0) * (item.quantity || 0);
            }

            // Discount
            lineTotal = lineTotal * (1 - ((item.discount || 0) / 100));

            totalExclTax += lineTotal;
            totalCost += lineCost;
        });

        const totalTax = totalExclTax * 0.19; // 19% VAT
        const stampDuty = 1.000; // 1 DT Timbre
        const totalInclTax = totalExclTax + totalTax + stampDuty;
        const margin = totalExclTax - totalCost;
        const marginPercent = totalExclTax > 0 ? (margin / totalExclTax) * 100 : 0;

        setFinancials({ totalExclTax, totalTax, stampDuty, totalCost, margin, marginPercent, totalInclTax });
    };

    const handleSave = async () => {
        if (!formData.clientId || !formData.eventName) {
            showAlert({
                title: "Champs Obligatoires",
                message: "Veuillez sélectionner un client et renseigner le nom de l'événement.",
                type: "warning"
            });
            return;
        }

        const payload = {
            ...formData,
            status: 'Quote',
            financials
        };
        // Clean up temp IDs
        payload.items = payload.items.map(({ id, ...rest }) => rest);

        try {
            if (formData.projectId) {
                await api.put(`/projects/${formData.projectId}`, payload);
            } else {
                await api.post('/projects', payload);
            }

            await showAlert({
                title: "Devis Commercial Émis",
                message: `Devis créé avec succès !\n\nUn e-mail de proposition commerciale a été généré pour le client ${selectedClient?.name || ''}.\n\nStatut : Envoyé / Devis Actif`,
                type: "success"
            });
            navigate('/quotes');
        } catch (err) {
            showAlert({
                title: "Erreur de Sauvegarde",
                message: "Erreur lors de la sauvegarde du devis : " + err.message,
                type: "danger"
            });
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', color: '#818cf8', padding: '100px 20px', fontSize: '15px', fontWeight: '600' }}>
                Chargement du générateur de devis intelligent...
            </div>
        );
    }

    const selectedClient = clients.find(c => c._id === formData.clientId);

    return (
        <div className="quote-builder-container">
            {/* Header */}
            <div className="qb-header">
                <div className="qb-header-left">
                    <div className="qb-header-icon">
                        <Sparkles size={24} />
                    </div>
                    <div className="qb-header-titles">
                        <h1>Smart Quote Builder</h1>
                        <p className="qb-header-subtext">
                            Élaboration de devis commerciaux, estimation logistique et propositions clients
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="qb-steps">
                    <button 
                        type="button" 
                        className={`qb-step-btn ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
                        onClick={() => setStep(1)}
                    >
                        <span className="qb-step-badge">
                            {step > 1 ? <Check size={12} /> : '1'}
                        </span>
                        <span className="qb-step-name-full">Détails & Planning</span>
                        <span className="qb-step-name-mobile">Détails</span>
                    </button>
                    <button 
                        type="button" 
                        className={`qb-step-btn ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
                        onClick={() => setStep(2)}
                    >
                        <span className="qb-step-badge">
                            {step > 2 ? <Check size={12} /> : '2'}
                        </span>
                        <span className="qb-step-name-full">Lignes de Devis</span>
                        <span className="qb-step-name-mobile">Articles</span>
                    </button>
                    <button 
                        type="button" 
                        className={`qb-step-btn ${step === 3 ? 'active' : ''}`}
                        onClick={() => setStep(3)}
                    >
                        <span className="qb-step-badge">3</span>
                        <span className="qb-step-name-full">Récapitulatif</span>
                        <span className="qb-step-name-mobile">Bilan</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="qb-content">
                {/* STEP 1: Details */}
                {step === 1 && (
                    <div className="step-panel">
                        <div className="qb-card">
                            <div className="qb-card-glow" />

                            <div className="qb-card-header">
                                <div className="qb-card-title">
                                    <span className="qb-accent-bar" />
                                    <FileText size={18} />
                                    <span>Informations Générales & Planification</span>
                                </div>
                            </div>

                            <div className="qb-form-grid">
                                {/* Client Selection */}
                                <div className="form-group">
                                    <label>
                                        <User size={13} style={{ color: '#818cf8' }} />
                                        <span>Client Bénéficiaire</span>
                                    </label>
                                    <div className="qb-input-wrapper">
                                        <span className="qb-input-icon"><Building size={16} /></span>
                                        <select 
                                            value={formData.clientId} 
                                            onChange={handleClientChange} 
                                            className="qb-input"
                                        >
                                            <option value="">Sélectionner un client du répertoire...</option>
                                            {clients.map(c => (
                                                <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedClient && (
                                        <div className="client-info-card">
                                            <div className="client-info-item">
                                                <Clock size={14} style={{ color: '#818cf8' }} />
                                                <span>Délai de paiement : <strong>{selectedClient.paymentTerms || 30} jours</strong></span>
                                            </div>
                                            <div className="client-info-item">
                                                <DollarSign size={14} style={{ color: '#10b981' }} />
                                                <span>Chiffre cumulé : <strong>{(selectedClient.totalSpent || 0).toFixed(3)} DT</strong></span>
                                            </div>
                                            {selectedClient.phone && (
                                                <div className="client-info-item">
                                                    <span>Tél : <strong>{selectedClient.phone}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Event Name */}
                                <div className="form-group">
                                    <label>
                                        <Sparkles size={13} style={{ color: '#818cf8' }} />
                                        <span>Nom de l'Événement ou Projet</span>
                                    </label>
                                    <div className="qb-input-wrapper">
                                        <span className="qb-input-icon"><FileText size={16} /></span>
                                        <input
                                            type="text"
                                            value={formData.eventName}
                                            onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                                            className="qb-input"
                                            placeholder="Ex: Festival International d'Été 2026 / Gala Prestige"
                                        />
                                    </div>
                                </div>

                                {/* Dates Row */}
                                <div className="qb-dates-row">
                                    <div className="form-group">
                                        <label>
                                            <Calendar size={13} style={{ color: '#818cf8' }} />
                                            <span>Date de Début (Mise à disposition)</span>
                                        </label>
                                        <div className="qb-input-wrapper">
                                            <span className="qb-input-icon"><Calendar size={16} /></span>
                                            <input 
                                                type="date" 
                                                value={formData.dates.start} 
                                                onChange={e => handleDateChange('start', e.target.value)} 
                                                className="qb-input" 
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <Calendar size={13} style={{ color: '#818cf8' }} />
                                            <span>Date de Fin (Restitution convoi)</span>
                                        </label>
                                        <div className="qb-input-wrapper">
                                            <span className="qb-input-icon"><Calendar size={16} /></span>
                                            <input 
                                                type="date" 
                                                value={formData.dates.end} 
                                                onChange={e => handleDateChange('end', e.target.value)} 
                                                className="qb-input" 
                                                min={formData.dates.start}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Duration Banner */}
                                <div className="qb-duration-banner">
                                    <Clock size={16} />
                                    <span>
                                        Durée calculée de la mission : <strong className="qb-duration-highlight">{formData.dates.totalDays} jour(s)</strong> (appliquée automatiquement au calcul des locations de matériel).
                                    </span>
                                </div>
                            </div>

                            <div className="step-footer-actions">
                                <button 
                                    type="button" 
                                    className="qb-btn primary" 
                                    onClick={() => {
                                        if (!formData.clientId || !formData.eventName) {
                                            showAlert({
                                                title: "Champs Requis",
                                                message: "Veuillez sélectionner un client et renseigner le nom de l'événement.",
                                                type: "warning"
                                            });
                                            return;
                                        }
                                        setStep(2);
                                    }}
                                >
                                    <span>Suivant : Configurer les Articles</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Line Items */}
                {step === 2 && (
                    <div className="step-panel">
                        <div className="qb-card">
                            <div className="qb-card-glow" />

                            <div className="qb-card-header">
                                <div className="qb-card-title">
                                    <span className="qb-accent-bar" />
                                    <Layers size={18} />
                                    <span>Articles, Équipements & Prestations du Devis</span>
                                </div>

                                <div className="items-controls">
                                    <button 
                                        type="button" 
                                        className="qb-btn outline" 
                                        onClick={() => addItem('Rent')}
                                    >
                                        <Package size={15} />
                                        <span>+ Matériel (Location)</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        className="qb-btn outline" 
                                        onClick={() => addItem('Service')}
                                    >
                                        <Briefcase size={15} />
                                        <span>+ Prestation (Technique/Transport)</span>
                                    </button>
                                </div>
                            </div>

                            {formData.items.length === 0 ? (
                                <div className="qb-empty-items">
                                    <Package size={40} style={{ color: '#475569', marginBottom: '6px' }} />
                                    <strong style={{ color: '#cbd5e1', fontSize: '14px' }}>Aucun article ajouté au devis</strong>
                                    <p style={{ margin: 0, fontSize: '12.5px' }}>
                                        Cliquez sur les boutons ci-dessus pour ajouter des équipements ou des services techniques.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Data Table */}
                                    <div className="items-table-wrapper qb-desktop-only">
                                        <table className="items-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '100px' }}>Type</th>
                                                    <th>Description / Équipement</th>
                                                    <th style={{ width: '80px', textAlign: 'center' }}>Qté</th>
                                                    <th style={{ width: '80px', textAlign: 'center' }}>Jours</th>
                                                    <th style={{ width: '120px', textAlign: 'right' }}>Prix Unitaire</th>
                                                    <th style={{ width: '90px', textAlign: 'center' }}>Remise %</th>
                                                    <th style={{ width: '130px', textAlign: 'right' }}>Total Ligne</th>
                                                    <th style={{ width: '50px', textAlign: 'center' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <span className={`badge ${item.type.toLowerCase()}`}>
                                                                {item.type === 'Rent' ? 'Location' : item.type === 'Sale' ? 'Vente' : 'Service'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {item.type === 'Rent' || item.type === 'Sale' ? (
                                                                <select
                                                                    value={item.inventoryItem || ''}
                                                                    onChange={(e) => updateItem(item.id, 'inventoryItem', e.target.value)}
                                                                    className="qb-table-input"
                                                                    style={{ width: '100%' }}
                                                                >
                                                                    <option value="">-- Choisir un équipement du stock --</option>
                                                                    {inventory
                                                                        .filter(i => (item.type === 'Rent' ? i.type !== 'Sale' : i.type === 'Sale'))
                                                                        .map(i => (
                                                                            <option key={i._id} value={i._id}>
                                                                                {i.name} {i.brand ? `(${i.brand})` : ''} — Stock: {i.quantity || 0}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={item.name}
                                                                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                                    placeholder="Intitulé du service (ex: Régie Lumière, Montage, Transport)"
                                                                    className="qb-table-input"
                                                                    style={{ width: '100%' }}
                                                                />
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input 
                                                                type="number" 
                                                                value={item.quantity} 
                                                                onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                                                                className="qb-table-input small" 
                                                                min="1"
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input 
                                                                type="number" 
                                                                value={item.days} 
                                                                onChange={e => updateItem(item.id, 'days', parseFloat(e.target.value) || 1)} 
                                                                className="qb-table-input small" 
                                                                disabled={item.type === 'Sale'} 
                                                                min="1"
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <input 
                                                                type="number" 
                                                                value={item.price} 
                                                                onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} 
                                                                className="qb-table-input medium" 
                                                                step="0.001"
                                                                min="0"
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input 
                                                                type="number" 
                                                                value={item.discount} 
                                                                onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} 
                                                                className="qb-table-input small" 
                                                                min="0"
                                                                max="100"
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="row-total-cell">
                                                                {(((item.price || 0) * (item.quantity || 0) * (item.type === 'Rent' ? (item.days || 1) : 1)) * (1 - ((item.discount || 0) / 100))).toFixed(3)} DT
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button 
                                                                type="button"
                                                                onClick={() => removeItem(item.id)} 
                                                                className="qb-btn-icon"
                                                                title="Supprimer la ligne"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="qb-items-cards qb-mobile-only">
                                        {formData.items.map((item) => {
                                            const lineTotal = (((item.price || 0) * (item.quantity || 0) * (item.type === 'Rent' ? (item.days || 1) : 1)) * (1 - ((item.discount || 0) / 100))).toFixed(3);
                                            return (
                                                <div className="qb-item-card" key={item.id}>
                                                    <div className="qb-item-card-top">
                                                        <div className="qb-item-badge-wrap">
                                                            <span className={`badge ${item.type.toLowerCase()}`}>
                                                                {item.type === 'Rent' ? 'Location' : item.type === 'Sale' ? 'Vente' : 'Service'}
                                                            </span>
                                                            <span className="qb-item-line-total">{lineTotal} DT</span>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeItem(item.id)} 
                                                            className="qb-btn-icon"
                                                            title="Supprimer la ligne"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    <div className="qb-item-card-field">
                                                        <label>Description / Équipement</label>
                                                        {item.type === 'Rent' || item.type === 'Sale' ? (
                                                            <select
                                                                value={item.inventoryItem || ''}
                                                                onChange={(e) => updateItem(item.id, 'inventoryItem', e.target.value)}
                                                                className="qb-table-input"
                                                                style={{ width: '100%' }}
                                                            >
                                                                <option value="">-- Choisir un équipement du stock --</option>
                                                                {inventory
                                                                    .filter(i => (item.type === 'Rent' ? i.type !== 'Sale' : i.type === 'Sale'))
                                                                    .map(i => (
                                                                        <option key={i._id} value={i._id}>
                                                                            {i.name} {i.brand ? `(${i.brand})` : ''} — Stock: {i.quantity || 0}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={item.name}
                                                                onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                                placeholder="Intitulé du service (ex: Régie Lumière...)"
                                                                className="qb-table-input"
                                                                style={{ width: '100%' }}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="qb-item-card-grid">
                                                        <div className="qb-card-mini-field">
                                                            <label>Quantité</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.quantity} 
                                                                onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                                                                className="qb-table-input" 
                                                                min="1"
                                                            />
                                                        </div>
                                                        {item.type === 'Rent' && (
                                                            <div className="qb-card-mini-field">
                                                                <label>Jours</label>
                                                                <input 
                                                                type="number" 
                                                                value={item.days} 
                                                                onChange={e => updateItem(item.id, 'days', parseFloat(e.target.value) || 1)} 
                                                                className="qb-table-input" 
                                                                min="1"
                                                            />
                                                            </div>
                                                        )}
                                                        <div className="qb-card-mini-field">
                                                            <label>Prix Unitaire (DT)</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.price} 
                                                                onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} 
                                                                className="qb-table-input" 
                                                                step="0.001"
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div className="qb-card-mini-field">
                                                            <label>Remise %</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.discount} 
                                                                onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} 
                                                                className="qb-table-input" 
                                                                min="0"
                                                                max="100"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Financials Bar */}
                            <div className="financials-bar">
                                <div className="fin-metric">
                                    <span>Total Net (HT)</span>
                                    <strong>{financials.totalExclTax.toFixed(3)} DT</strong>
                                </div>
                                <div className="fin-metric">
                                    <span>TVA Collectée (19%)</span>
                                    <strong>{financials.totalTax.toFixed(3)} DT</strong>
                                </div>
                                <div className="fin-metric">
                                    <span>Timbre Fiscal</span>
                                    <strong>{financials.stampDuty.toFixed(3)} DT</strong>
                                </div>
                                <div className="fin-metric positive">
                                    <span>Montant Total (TTC)</span>
                                    <strong>{financials.totalInclTax.toFixed(3)} DT</strong>
                                </div>
                            </div>

                            <div className="actions-row">
                                <button 
                                    type="button" 
                                    className="qb-btn secondary" 
                                    onClick={() => setStep(1)}
                                >
                                    <ArrowLeft size={16} />
                                    <span>Retour aux Détails</span>
                                </button>
                                <button 
                                    type="button" 
                                    className="qb-btn primary" 
                                    onClick={() => setStep(3)}
                                    disabled={formData.items.length === 0}
                                >
                                    <span>Étape Suivante : Récapitulatif</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Review & Finalize */}
                {step === 3 && (
                    <div className="step-panel">
                        <div className="qb-card">
                            <div className="qb-card-glow" />

                            <div className="qb-card-header">
                                <div className="qb-card-title">
                                    <span className="qb-accent-bar" />
                                    <ShieldCheck size={18} />
                                    <span>Récapitulatif Financier & Validation</span>
                                </div>
                            </div>

                            <div className="review-card">
                                <div className="review-header-info">
                                    <div>
                                        <h3>{formData.eventName}</h3>
                                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                                            Client : <strong style={{ color: '#ffffff' }}>{selectedClient?.name || 'Non spécifié'}</strong>
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className="badge rent">
                                            {formData.items.length} article(s)
                                        </span>
                                        <span className="badge service">
                                            {formData.dates.totalDays} jour(s)
                                        </span>
                                    </div>
                                </div>

                                <div className="total-row">
                                    <span>Période de location planifiée</span>
                                    <strong>Du {formData.dates.start} au {formData.dates.end}</strong>
                                </div>
                                <div className="total-row">
                                    <span>Total Hors Taxes (HT)</span>
                                    <strong>{financials.totalExclTax.toFixed(3)} DT</strong>
                                </div>
                                <div className="total-row">
                                    <span>Taxe sur la Valeur Ajoutée (TVA 19%)</span>
                                    <strong>{financials.totalTax.toFixed(3)} DT</strong>
                                </div>
                                <div className="total-row">
                                    <span>Droit de Timbre Fiscal</span>
                                    <strong>{financials.stampDuty.toFixed(3)} DT</strong>
                                </div>
                                <div className="total-row large">
                                    <span>Net à Payer Global (TTC)</span>
                                    <span>{financials.totalInclTax.toFixed(3)} DT</span>
                                </div>
                            </div>

                            <div className="actions-row">
                                <button 
                                    type="button" 
                                    className="qb-btn secondary" 
                                    onClick={() => setStep(2)}
                                >
                                    <ArrowLeft size={16} />
                                    <span>Modifier les Articles</span>
                                </button>
                                <button 
                                    type="button" 
                                    className="qb-btn success" 
                                    onClick={handleSave}
                                >
                                    <Mail size={18} />
                                    <span>Créer le Devis & Envoyer le PDF au Client</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuoteBuilder;
