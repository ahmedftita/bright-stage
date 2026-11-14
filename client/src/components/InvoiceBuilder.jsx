import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useConfirm, useDialog } from '../context/ConfirmContext';
import { 
    Receipt, 
    User, 
    Calendar, 
    Percent, 
    Zap, 
    Plus, 
    Trash2, 
    X, 
    Save, 
    CheckCircle2, 
    Building, 
    Tag
} from 'lucide-react';
import './InvoiceBuilder.css';

const InvoiceBuilder = ({ isOpen = true, onClose, onSuccess, initialProjectId }) => {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { showAlert } = useDialog();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taxRule, setTaxRule] = useState('Standard'); // Standard, Reduced, Suspended

    // Form State
    const [formData, setFormData] = useState({
        relatedProject: initialProjectId || new URLSearchParams(window.location.search).get('projectId') || '',
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [] // { id, name, description, quantity, unitPrice, total }
    });

    const [financials, setFinancials] = useState({
        totalExclTax: 0,
        totalTax: 0,
        stampDuty: 1.000,
        totalInclTax: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchResources();
        }
    }, [isOpen]);

    useEffect(() => {
        calculateFinancials();
    }, [formData.items, taxRule]);

    const fetchResources = async () => {
        try {
            const [clientRes, projectRes] = await Promise.all([
                api.get('/clients'),
                api.get('/projects')
            ]);
            setClients(clientRes.data || []);
            const activeProjects = (projectRes.data || []).filter(p => p.status === 'Confirmed' || p.status === 'Done');
            setProjects(activeProjects);

            // Auto-load if projectId in URL or props
            const targetPid = initialProjectId || new URLSearchParams(window.location.search).get('projectId');
            if (targetPid) {
                const proj = activeProjects.find(p => p._id === targetPid);
                if (proj) handleImportProject(proj._id, activeProjects);
            }

            setLoading(false);
        } catch (err) {
            console.error("Error loading resources:", err);
            setLoading(false);
        }
    };

    const handleClientChange = (e) => {
        setFormData({ ...formData, clientId: e.target.value });
    };

    const handleImportProject = (projectId, freshProjects = null) => {
        const list = freshProjects || projects;
        const project = list.find(p => p._id === projectId);
        if (!project) return;

        // Map project items to invoice items
        const newItems = (project.items || []).map(item => {
            const days = item.days || 1;
            const discount = (item.discount || 0) / 100;
            const unitPrice = (item.price || 0) * days * (1 - discount);

            return {
                id: Date.now() + Math.random(),
                name: item.name,
                description: `${item.name} (${item.brand || ''} ${item.model || ''}) - ${days} Jour(s)`,
                quantity: item.quantity || 1,
                unitPrice: unitPrice,
                total: unitPrice * (item.quantity || 1)
            };
        });

        setFormData({
            ...formData,
            relatedProject: project._id,
            clientId: project.clientId?._id || project.clientId || '',
            items: newItems
        });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                id: Date.now(),
                name: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                total: 0
            }]
        });
    };

    const updateItem = (id, field, value) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === id) {
                const updates = { [field]: value };
                // Auto-calc line total if qty or price changes
                if (field === 'quantity' || field === 'unitPrice') {
                    const qty = field === 'quantity' ? (parseFloat(value) || 0) : item.quantity;
                    const price = field === 'unitPrice' ? (parseFloat(value) || 0) : item.unitPrice;
                    updates.total = qty * price;
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
        const totalExclTax = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);

        let rate = 0.19;
        if (taxRule === 'Reduced') rate = 0.07;
        if (taxRule === 'Suspended') rate = 0;

        const totalTax = totalExclTax * rate;
        const stampDuty = 1.000;
        const totalInclTax = totalExclTax + totalTax + stampDuty;

        setFinancials({ totalExclTax, totalTax, stampDuty, totalInclTax });
    };

    const handleSave = async (status = 'Draft') => {
        if (!formData.clientId) {
            showAlert({
                title: "Client Requis",
                message: "Veuillez sélectionner un client pour cette facture.",
                type: "warning"
            });
            return;
        }

        const selectedClient = clients.find(c => c._id === formData.clientId);

        const payload = {
            client: {
                id: selectedClient?._id,
                name: selectedClient?.name,
                address: selectedClient?.address,
                taxId: selectedClient?.taxId,
                contactPerson: selectedClient?.contactPerson
            },
            date: formData.date,
            dueDate: formData.dueDate,
            items: formData.items.map(({ id, ...rest }) => rest),
            financials,
            status: status,
            relatedProject: formData.relatedProject
        };

        try {
            await api.post('/invoices', payload);
            await showAlert({
                title: "Facture Enregistrée",
                message: `La facture a été créée avec succès (${status === 'Draft' ? 'Brouillon' : 'Validée et Publiée'}) !`,
                type: "success"
            });
            if (onSuccess) {
                onSuccess();
            } else if (onClose) {
                onClose();
            } else {
                navigate('/invoices');
            }
        } catch (err) {
            showAlert({
                title: "Erreur de Création",
                message: "Erreur lors de la création de la facture : " + (err.response?.data?.error || err.message),
                type: "danger"
            });
        }
    };

    const handleModalClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/invoices');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="invoice-modal-overlay" onClick={handleModalClose}>
            <div className="invoice-modal-card" onClick={e => e.stopPropagation()}>
                {/* Ambient glow */}
                <div className="invoice-ambient-glow" />

                {/* Modal Header */}
                <div className="invoice-modal-header">
                    <div className="invoice-header-left">
                        <div className="invoice-header-icon-badge">
                            <Receipt size={24} />
                        </div>
                        <div className="invoice-header-title-group">
                            <h2>Invoice Builder</h2>
                            <p className="invoice-header-subtext">
                                Émission de facture, calcul de TVA automatique et intégration projet
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleModalClose}
                        className="invoice-close-btn"
                        title="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="invoice-modal-body">
                    {/* Quick Import from Project */}
                    <div className="invoice-import-box">
                        <label className="invoice-import-label">
                            <Zap size={14} />
                            <span>Import Rapide depuis un Projet Confirmé</span>
                        </label>
                        <div className="invoice-input-wrapper">
                            <span className="invoice-input-icon"><Zap size={15} /></span>
                            <select
                                value={formData.relatedProject}
                                onChange={(e) => handleImportProject(e.target.value)}
                                className="invoice-select-input"
                            >
                                <option value="">-- Sélectionner un projet confirmé pour importer son matériel --</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.eventName} ({p.client?.name || p.clientId?.name || 'Client'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Section: Client & Metadata */}
                    <div className="invoice-section-box">
                        <div className="invoice-grid-4">
                            {/* Client */}
                            <div className="invoice-field-group">
                                <label className="invoice-field-label">
                                    <User size={13} style={{ color: '#fbbf24' }} />
                                    <span>Client</span>
                                </label>
                                <div className="invoice-input-wrapper">
                                    <span className="invoice-input-icon"><Building size={15} /></span>
                                    <select 
                                        value={formData.clientId} 
                                        onChange={handleClientChange} 
                                        className="invoice-select-input"
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {clients.map(c => (
                                            <option key={c._id} value={c._id}>
                                                {c.name} {c.company ? `(${c.company})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Invoice Date */}
                            <div className="invoice-field-group">
                                <label className="invoice-field-label">
                                    <Calendar size={13} style={{ color: '#fbbf24' }} />
                                    <span>Date d'Émission</span>
                                </label>
                                <div className="invoice-input-wrapper">
                                    <span className="invoice-input-icon"><Calendar size={15} /></span>
                                    <input 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                        className="invoice-text-input" 
                                    />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="invoice-field-group">
                                <label className="invoice-field-label">
                                    <Calendar size={13} style={{ color: '#fbbf24' }} />
                                    <span>Date d'Échéance</span>
                                </label>
                                <div className="invoice-input-wrapper">
                                    <span className="invoice-input-icon"><Calendar size={15} /></span>
                                    <input 
                                        type="date" 
                                        value={formData.dueDate} 
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                                        className="invoice-text-input" 
                                    />
                                </div>
                            </div>

                            {/* Tax Mode */}
                            <div className="invoice-field-group">
                                <label className="invoice-field-label">
                                    <Percent size={13} style={{ color: '#fbbf24' }} />
                                    <span>Régime TVA</span>
                                </label>
                                <div className="invoice-input-wrapper">
                                    <span className="invoice-input-icon"><Tag size={15} /></span>
                                    <select 
                                        value={taxRule} 
                                        onChange={e => setTaxRule(e.target.value)} 
                                        className="invoice-select-input"
                                    >
                                        <option value="Standard">Standard (19%)</option>
                                        <option value="Reduced">Réduit (7%)</option>
                                        <option value="Suspended">En Suspension (0%)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Line Items */}
                    <div className="invoice-section-box">
                        <div className="invoice-section-header">
                            <span className="invoice-section-title">
                                <Receipt size={16} />
                                <span>Lignes de Facturation & Prestations ({formData.items.length})</span>
                            </span>
                        </div>

                        {/* Desktop Table View */}
                        <div className="invoice-items-table-wrapper invoice-desktop-only">
                            <table className="invoice-items-table">
                                <thead>
                                    <tr>
                                        <th>Désignation / Article</th>
                                        <th style={{ width: '90px', textAlign: 'center' }}>Qté</th>
                                        <th style={{ width: '130px', textAlign: 'right' }}>Prix Unitaire HT</th>
                                        <th style={{ width: '130px', textAlign: 'right' }}>Total Ligne HT</th>
                                        <th style={{ width: '50px', textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '30px 15px', color: '#64748b' }}>
                                                Aucune ligne ajoutée. Cliquez sur <strong>+ Ajouter une Ligne</strong> ci-dessous ou importez un projet.
                                            </td>
                                        </tr>
                                    ) : (
                                        formData.items.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <input 
                                                        type="text" 
                                                        value={item.name} 
                                                        onChange={e => updateItem(item.id, 'name', e.target.value)} 
                                                        placeholder="Nom de l'article / service" 
                                                        className="invoice-table-input" 
                                                        style={{ marginBottom: '5px' }} 
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={item.description} 
                                                        onChange={e => updateItem(item.id, 'description', e.target.value)} 
                                                        placeholder="Description complémentaire..." 
                                                        className="invoice-table-input" 
                                                        style={{ fontSize: '11.5px', color: '#94a3b8' }} 
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onChange={e => updateItem(item.id, 'quantity', e.target.value)} 
                                                        className="invoice-table-input small" 
                                                        min="1"
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <input 
                                                        type="number" 
                                                        value={item.unitPrice} 
                                                        onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} 
                                                        className="invoice-table-input medium" 
                                                        step="0.001"
                                                        min="0"
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#f8fafc' }}>
                                                    {(item.total || 0).toFixed(3)} DT
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeItem(item.id)} 
                                                        className="invoice-delete-btn"
                                                        title="Supprimer la ligne"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Items Cards View */}
                        <div className="invoice-items-cards invoice-mobile-only">
                            {formData.items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 15px', color: '#64748b', fontSize: '13px' }}>
                                    Aucune ligne ajoutée. Cliquez sur <strong>+ Ajouter une Ligne</strong> ci-dessous.
                                </div>
                            ) : (
                                formData.items.map(item => (
                                    <div className="invoice-item-card" key={item.id}>
                                        <div className="invoice-item-card-top">
                                            <span className="invoice-item-line-total">
                                                {(item.total || 0).toFixed(3)} DT HT
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => removeItem(item.id)} 
                                                className="invoice-delete-btn"
                                                title="Supprimer la ligne"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="invoice-item-card-field">
                                            <label>Désignation & Description</label>
                                            <input 
                                                type="text" 
                                                value={item.name} 
                                                onChange={e => updateItem(item.id, 'name', e.target.value)} 
                                                placeholder="Nom de l'article / service" 
                                                className="invoice-table-input" 
                                            />
                                            <input 
                                                type="text" 
                                                value={item.description} 
                                                onChange={e => updateItem(item.id, 'description', e.target.value)} 
                                                placeholder="Description complémentaire..." 
                                                className="invoice-table-input" 
                                                style={{ fontSize: '12px', color: '#94a3b8' }} 
                                            />
                                        </div>

                                        <div className="invoice-item-card-grid">
                                            <div className="invoice-card-mini-field">
                                                <label>Quantité</label>
                                                <input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={e => updateItem(item.id, 'quantity', e.target.value)} 
                                                    className="invoice-table-input" 
                                                    min="1"
                                                />
                                            </div>
                                            <div className="invoice-card-mini-field">
                                                <label>Prix Unitaire HT (DT)</label>
                                                <input 
                                                    type="number" 
                                                    value={item.unitPrice} 
                                                    onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} 
                                                    className="invoice-table-input" 
                                                    step="0.001"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            type="button" 
                            className="invoice-add-item-btn" 
                            onClick={addItem}
                        >
                            <Plus size={15} />
                            <span>+ Ajouter une Ligne</span>
                        </button>
                    </div>

                    {/* Financials Bar */}
                    <div className="invoice-financials-bar">
                        <div className="invoice-fin-metric">
                            <span>Total Net (HT)</span>
                            <strong>{financials.totalExclTax.toFixed(3)} DT</strong>
                        </div>
                        <div className="invoice-fin-metric">
                            <span>TVA ({taxRule === 'Standard' ? '19%' : taxRule === 'Reduced' ? '7%' : '0%'})</span>
                            <strong>{financials.totalTax.toFixed(3)} DT</strong>
                        </div>
                        <div className="invoice-fin-metric">
                            <span>Timbre Fiscal</span>
                            <strong>{financials.stampDuty.toFixed(3)} DT</strong>
                        </div>
                        <div className="invoice-fin-metric positive">
                            <span>Montant Net à Payer (TTC)</span>
                            <strong>{financials.totalInclTax.toFixed(3)} DT</strong>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="invoice-modal-footer">
                    <button 
                        type="button" 
                        className="invoice-btn-cancel" 
                        onClick={handleModalClose}
                    >
                        Annuler
                    </button>

                    <div className="invoice-footer-btns">
                        <button 
                            type="button" 
                            className="invoice-btn-draft" 
                            onClick={() => handleSave('Draft')}
                        >
                            <Save size={16} />
                            <span>Enregistrer comme Brouillon</span>
                        </button>

                        <button 
                            type="button" 
                            className="invoice-btn-validate" 
                            onClick={async () => {
                                const ok = await confirm({
                                    title: "Validation Définitive",
                                    message: "Valider et émettre cette facture ? Cela effectuera la publication officielle et le verrouillage comptable.",
                                    confirmText: "Valider & Émettre",
                                    type: "success"
                                });
                                if (ok) {
                                    handleSave('Validated');
                                }
                            }}
                        >
                            <CheckCircle2 size={16} />
                            <span>Valider & Émettre la Facture</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceBuilder;
