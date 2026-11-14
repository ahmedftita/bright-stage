import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { 
    Box, MapPin, Layers, Search, RefreshCw, 
    ChevronRight, Wrench, AlertTriangle, HelpCircle, 
    Package, Sparkles, ClipboardList, User, Clock
} from 'lucide-react';
import './MaintenanceView.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const STATE_OPTIONS = [
    {
        value: 'Cassé',
        label: 'Cassé',
        subtitle: 'Matériel endommagé ou hors service nécessitant diagnostic critique ou remplacement.',
        icon: AlertTriangle,
        color: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.3)',
        badge: 'Critique'
    },
    {
        value: 'à vérifier',
        label: 'À Vérifier',
        subtitle: 'Matériel nécessitant une inspection de contrôle ou test de routine.',
        icon: HelpCircle,
        color: '#eab308',
        glow: 'rgba(234, 179, 8, 0.3)',
        badge: 'Inspection'
    },
    {
        value: 'à réparer',
        label: 'À Réparer',
        subtitle: 'Défaut identifié nécessitant une intervention technique ou pièces.',
        icon: Wrench,
        color: '#f97316',
        glow: 'rgba(249, 115, 22, 0.3)',
        badge: 'Atelier'
    }
];

const MaintenanceView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();

    const isMaintenancier = user?.role === 'Maintenancier' || user?.role?.toLowerCase() === 'maintenancier';

    const [items, setItems] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Cassé', 'à vérifier', 'à réparer'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Modal State for Product Status Selection / Reporting
    const [selectedItemForState, setSelectedItemForState] = useState(null);
    const [selectedTicketForState, setSelectedTicketForState] = useState(null);
    const [chosenState, setChosenState] = useState('à vérifier');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [diagnosticNotes, setDiagnosticNotes] = useState('');
    const [validationError, setValidationError] = useState('');
    const [isSubmittingState, setIsSubmittingState] = useState(false);

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            loadDataSilently();
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [invRes, ticketsRes] = await Promise.all([
                axios.get(`${API_URL}/inventory`),
                axios.get(`${API_URL}/maintenance`)
            ]);
            setItems(invRes.data || []);
            setTickets(ticketsRes.data || []);
        } catch (error) {
            console.error("Error fetching data for maintenance:", error);
            showError("Impossible de charger les données de maintenance");
        } finally {
            setLoading(false);
        }
    };

    const loadDataSilently = async () => {
        try {
            const [invRes, ticketsRes] = await Promise.all([
                axios.get(`${API_URL}/inventory`),
                axios.get(`${API_URL}/maintenance`)
            ]);
            setItems(invRes.data || []);
            setTickets(ticketsRes.data || []);
        } catch (error) {
            // Silent background sync
        }
    };

    const getTicketNotes = (ticket) => {
        if (ticket.notes) return ticket.notes;
        if (ticket.repairNotes) {
            return ticket.repairNotes.replace(/\s*\[Qté:\s*\d+\]/i, '').trim();
        }
        return ticket.issueDescription || 'Aucun rapport technique spécifié';
    };

    const getTicketQuantity = (ticket) => {
        if (ticket.quantity && ticket.quantity > 0) return ticket.quantity;
        const match = (ticket.repairNotes || '').match(/\[Qté:\s*(\d+)\]/i);
        if (match) return parseInt(match[1], 10);
        return 1;
    };

    const getTicketState = (ticket) => {
        return ticket.state || ticket.inventoryItem?.state || 'à vérifier';
    };

    const getCategoryColor = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('son')) return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' };
        if (cat.includes('lumière')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' };
        if (cat.includes('led') || cat.includes('vidéo') || cat.includes('écran')) return { bg: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' };
        if (cat.includes('câblage')) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
        if (cat.includes('structure')) return { bg: 'rgba(100, 116, 139, 0.1)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)' };
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.2)' };
    };

    const getStateInfo = (state) => {
        const st = state || 'Fonctionnel';
        switch (st) {
            case 'Cassé':
                return {
                    label: 'CASSÉ',
                    dotClass: 'broken',
                    color: '#f43f5e'
                };
            case 'à vérifier':
                return {
                    label: 'À VÉRIFIER',
                    dotClass: 'warning',
                    color: '#f59e0b'
                };
            case 'à réparer':
                return {
                    label: 'À RÉPARER',
                    dotClass: 'repair',
                    color: '#f97316'
                };
            case 'Fonctionnel':
            default:
                return {
                    label: 'FONCTIONNEL',
                    dotClass: 'active',
                    color: '#10b981'
                };
        }
    };

    const handleOpenStateModal = (item, defaultState = null) => {
        if (!item) return;
        setSelectedItemForState(item);
        setSelectedTicketForState(null);
        const validStates = ['Cassé', 'à vérifier', 'à réparer'];
        const initial = defaultState || (validStates.includes(item.state) ? item.state : 'à vérifier');
        setChosenState(initial);
        setItemQuantity(1);
        setDiagnosticNotes('');
        setValidationError('');
    };

    const handleOpenTicketStateModal = (ticket) => {
        if (!ticket.inventoryItem) return;
        setSelectedItemForState(ticket.inventoryItem);
        setSelectedTicketForState(ticket);
        setChosenState(getTicketState(ticket));
        setItemQuantity(getTicketQuantity(ticket));
        setDiagnosticNotes(getTicketNotes(ticket));
        setValidationError('');
    };

    const handleStartMaintenance = async (ticket) => {
        if (!ticket?._id) return;
        const qty = getTicketQuantity(ticket);
        const itemName = ticket.inventoryItem?.name || "cet équipement";
        const ok = await confirm({
            title: "Mise en Maintenance",
            message: `Confirmer la mise en maintenance de "${itemName}" ?\n${qty} unité(s) sera déduite du stock disponible en magasin jusqu'à sa remise en service.`,
            confirmText: "Mettre en Maintenance",
            type: "warning"
        });
        if (!ok) return;
        try {
            const res = await axios.put(`${API_URL}/maintenance/${ticket._id}/start-maintenance`);
            showSuccess(res.data?.message || `"${itemName}" est maintenant En Maintenance (-${qty} en stock)`);
            loadData();
        } catch (err) {
            console.error("Error starting maintenance:", err);
            showError("Échec de la mise en maintenance: " + (err.response?.data?.error || err.message));
        }
    };

    const handleResolveTicket = async (ticket) => {
        if (!ticket?._id) return;
        const qty = ticket.deductedQuantity || getTicketQuantity(ticket);
        const willRestore = ticket.quantityDeducted || ticket.status === 'In Maintenance';
        const itemName = ticket.inventoryItem?.name || "cet équipement";
        const msg = willRestore
            ? `Confirmer la remise en service de "${itemName}" ?\n${qty} unité(s) sera réintégrée au stock disponible.`
            : `Confirmer la remise en service de "${itemName}" ?`;
        const ok = await confirm({
            title: "Remise en Service",
            message: msg,
            confirmText: "Remettre en Service",
            type: "success"
        });
        if (!ok) return;
        try {
            await axios.put(`${API_URL}/maintenance/${ticket._id}/resolve`, { resolutionNotes: 'Remis en service fonctionnel' });
            showSuccess(`"${itemName}" a été remis en service avec succès !${willRestore ? ` (+${qty} unité(s) réintégrée(s) au stock)` : ''}`, "Maintenance");
            loadData();
        } catch (err) {
            console.error(err);
            showError("Échec de la remise en service: " + (err.response?.data?.error || err.message));
        }
    };

    const handleSaveItemState = async () => {
        if (!selectedItemForState) return;

        // Validation: Diagnostic Notes is mandatory
        if (!diagnosticNotes.trim()) {
            setValidationError('Le rapport technique / diagnostic est obligatoire.');
            showError('Veuillez saisir les notes de diagnostic (Obligatoire)');
            return;
        }

        // Validation: Quantity
        const qty = parseInt(itemQuantity, 10);
        const maxQty = selectedItemForState.quantity || 1;
        if (isNaN(qty) || qty < 1) {
            setValidationError('Veuillez entrer une quantité valide (minimum 1).');
            showError('Quantité invalide');
            return;
        }
        if (qty > maxQty) {
            setValidationError(`La quantité (${qty}) ne peut pas dépasser le stock total (${maxQty}).`);
            showError(`Quantité supérieure au stock disponible (${maxQty})`);
            return;
        }

        setIsSubmittingState(true);
        setValidationError('');
        try {
            await axios.put(`${API_URL}/maintenance/item-state/${selectedItemForState._id}`, {
                state: chosenState,
                quantity: qty,
                notes: diagnosticNotes.trim(),
                ticketId: selectedTicketForState?._id,
                reportedBy: user?.name || "Technicien Maintenance",
                reportedByRole: user?.role || ""
            });

            showSuccess(`État mis à jour : "${chosenState}" (${qty} unité(s))`, "Maintenance");
            setSelectedItemForState(null);
            setSelectedTicketForState(null);
            loadData();
        } catch (err) {
            console.error("Error saving state:", err);
            showError("Échec de la mise à jour: " + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmittingState(false);
        }
    };

    // Active maintenance requests (Not Fixed or Resolved)
    const activeTickets = tickets.filter(t => 
        t.inventoryItem && 
        t.status !== 'Fixed' && 
        t.status !== 'Resolved'
    );

    const isRequestsView = Boolean(isMaintenancier);

    const filteredTickets = activeTickets.filter(ticket => {
        const item = ticket.inventoryItem || {};
        const q = searchQuery.toLowerCase().trim();
        const notes = getTicketNotes(ticket).toLowerCase();
        const reporter = (ticket.reportedBy || '').toLowerCase();
        const matchesSearch = !q || 
            item.name?.toLowerCase().includes(q) || 
            item.brand?.toLowerCase().includes(q) || 
            item.barcode?.toLowerCase().includes(q) ||
            notes.includes(q) ||
            reporter.includes(q);

        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        const ticketState = getTicketState(ticket);
        const matchesStatus = filterStatus === 'All' ? true : ticketState === filterStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const filteredItems = items.filter(item => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            item.name?.toLowerCase().includes(q) || 
            item.brand?.toLowerCase().includes(q) || 
            item.model?.toLowerCase().includes(q) ||
            item.barcode?.toLowerCase().includes(q);

        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        const matchesStatus = filterStatus === 'All' ? true : item.state === filterStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const currentList = isRequestsView ? filteredTickets : filteredItems;
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const paginatedItems = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const changePage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Counters for active tickets
    const ticketsBrokenCount = activeTickets.filter(t => getTicketState(t) === 'Cassé').length;
    const ticketsVerifyCount = activeTickets.filter(t => getTicketState(t) === 'à vérifier').length;
    const ticketsRepairCount = activeTickets.filter(t => getTicketState(t) === 'à réparer').length;

    // Counters for inventory items
    const countBroken = items.filter(i => i.state === 'Cassé').length;
    const countVerify = items.filter(i => i.state === 'à vérifier').length;
    const countRepair = items.filter(i => i.state === 'à réparer').length;

    const uniqueCategories = [
        ...new Set(
            isRequestsView 
                ? activeTickets.map(t => t.inventoryItem?.category || 'Autre')
                : items.map(i => i.category || 'Autre')
        )
    ].filter(Boolean).sort();

    return (
        <div className="maint-container">
            {/* Header Section */}
            <div className="maint-header">
                <div>
                    <div className="maint-title-group">
                        <div className="maint-icon-badge">
                            <Box size={28} />
                        </div>
                        <h1 className="maint-page-title">
                            {isMaintenancier ? 'Maintenance & Atelier' : 'Maintenance'}
                        </h1>
                    </div>
                    <p className="maint-page-subtitle">
                        {isMaintenancier 
                            ? "Demandes d'intervention, pannes et réparations signalées en temps réel"
                            : "Gérez et suivez l'état technique de vos équipements audiovisuels"
                        }
                    </p>
                </div>

                <div className="maint-header-actions">
                    <button className="premium-btn secondary" onClick={loadData}>
                        <RefreshCw size={16} /> Actualiser
                    </button>
                    {isRequestsView ? (
                        <>
                            <button 
                                className={`premium-btn ${filterStatus === 'Cassé' ? 'danger-outline' : 'secondary'}`} 
                                onClick={() => { setFilterStatus(filterStatus === 'Cassé' ? 'All' : 'Cassé'); setCurrentPage(1); }}
                            >
                                <AlertTriangle size={16} /> Cassé ({ticketsBrokenCount})
                            </button>
                            <button 
                                className={`premium-btn ${filterStatus === 'à vérifier' ? 'primary' : 'secondary'}`}
                                onClick={() => { setFilterStatus(filterStatus === 'à vérifier' ? 'All' : 'à vérifier'); setCurrentPage(1); }}
                                style={filterStatus === 'à vérifier' ? { background: '#f59e0b', color: '#000' } : {}}
                            >
                                <HelpCircle size={16} /> à vérifier ({ticketsVerifyCount})
                            </button>
                            <button 
                                className={`premium-btn ${filterStatus === 'à réparer' ? 'primary' : 'secondary'}`}
                                onClick={() => { setFilterStatus(filterStatus === 'à réparer' ? 'All' : 'à réparer'); setCurrentPage(1); }}
                            >
                                <Wrench size={16} /> À Réparer ({ticketsRepairCount})
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                className={`premium-btn ${filterStatus === 'Cassé' ? 'danger-outline' : 'secondary'}`} 
                                onClick={() => { setFilterStatus(filterStatus === 'Cassé' ? 'All' : 'Cassé'); setCurrentPage(1); }}
                            >
                                <AlertTriangle size={16} /> Cassé ({countBroken})
                            </button>
                            <button 
                                className={`premium-btn ${filterStatus === 'à vérifier' ? 'primary' : 'secondary'}`}
                                onClick={() => { setFilterStatus(filterStatus === 'à vérifier' ? 'All' : 'à vérifier'); setCurrentPage(1); }}
                                style={filterStatus === 'à vérifier' ? { background: '#f59e0b', color: '#000' } : {}}
                            >
                                <HelpCircle size={16} /> à vérifier ({countVerify})
                            </button>
                            <button 
                                className={`premium-btn ${filterStatus === 'à réparer' ? 'primary' : 'secondary'}`}
                                onClick={() => { setFilterStatus(filterStatus === 'à réparer' ? 'All' : 'à réparer'); setCurrentPage(1); }}
                            >
                                <Wrench size={16} /> À Réparer ({countRepair})
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Condition Filter Pills */}
            <div className="maint-status-pills">
                <button 
                    className={`maint-status-pill ${filterStatus === 'All' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('All'); setCurrentPage(1); }}
                >
                    <span>
                        {isRequestsView 
                            ? `Toutes les demandes (${activeTickets.length})` 
                            : `Tous les produits (${items.length})`
                        }
                    </span>
                </button>
                <button 
                    className={`maint-status-pill pill-broken ${filterStatus === 'Cassé' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('Cassé'); setCurrentPage(1); }}
                >
                    <span className="state-dot broken" style={{ display: 'inline-block' }} />
                    <span>Cassé ({isRequestsView ? ticketsBrokenCount : countBroken})</span>
                </button>
                <button 
                    className={`maint-status-pill pill-warning ${filterStatus === 'à vérifier' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('à vérifier'); setCurrentPage(1); }}
                >
                    <span className="state-dot warning" style={{ display: 'inline-block' }} />
                    <span>à vérifier ({isRequestsView ? ticketsVerifyCount : countVerify})</span>
                </button>
                <button 
                    className={`maint-status-pill pill-repair ${filterStatus === 'à réparer' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('à réparer'); setCurrentPage(1); }}
                >
                    <span className="state-dot repair" style={{ display: 'inline-block' }} />
                    <span>à réparer ({isRequestsView ? ticketsRepairCount : countRepair})</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="maint-filter-bar">
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', opacity: 0.8 }} size={20} />
                    <input 
                        type="text" 
                        placeholder={isRequestsView ? "Rechercher une demande (matériel, rapport, demandeur)..." : "Rechercher équipement..."} 
                        value={searchQuery} 
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="premium-search-input"
                        style={{ paddingLeft: '55px' }}
                    />
                </div>
                <div className="maint-category-select-box">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                        className="premium-select"
                    >
                        <option value="">Toutes Catégories</option>
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Content Grid */}
            <div className="maint-grid">
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '120px', color: '#6366f1' }}>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>Chargement des données de maintenance...</div>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.01)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                            <Sparkles size={42} color="#818cf8" />
                        </div>
                        <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0 0 6px 0' }}>
                            {isRequestsView ? "Aucune demande de maintenance en attente" : "Aucun matériel trouvé"}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                            {isRequestsView 
                                ? "Tous les équipements signalés sont en état opérationnel ou ont été réparés." 
                                : "Aucun matériel ne correspond à vos critères de recherche."
                            }
                        </p>
                    </div>
                ) : isRequestsView ? (
                    /* ── MAINTENANCE REQUESTS VIEW (FOR MAINTENANCIER & TAB) ── */
                    paginatedItems.map(ticket => {
                        const item = ticket.inventoryItem || {};
                        const state = getTicketState(ticket);
                        const stateInfo = getStateInfo(state);
                        const colors = getCategoryColor(item.category);
                        const qty = getTicketQuantity(ticket);
                        const notes = getTicketNotes(ticket);
                        const reporter = ticket.reportedBy || 'Utilisateur';
                        const dateStr = ticket.createdAt || ticket.dateReported 
                            ? new Date(ticket.createdAt || ticket.dateReported).toLocaleString('fr-FR', {
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) 
                            : '-';

                        return (
                            <div 
                                key={ticket._id} 
                                className="asset-premium-card"
                                style={{ 
                                    cursor: 'default',
                                    borderLeft: `4px solid ${stateInfo.color}`,
                                    background: 'linear-gradient(180deg, #1d1e2c 0%, #151622 100%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
                                }}
                            >
                                <div>
                                    <div className="card-top" style={{ marginBottom: '14px' }}>
                                        <span className="category-tag" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                                            <Layers size={12} /> {item.category || 'Autre'}
                                        </span>
                                        <div className="status-indicator">
                                            <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px', marginRight: '8px', color: stateInfo.color }}>
                                                {stateInfo.label}
                                            </span>
                                            <span className={`state-dot ${stateInfo.dotClass}`}></span>
                                        </div>
                                    </div>

                                    <div className="card-main">
                                        <h3 className="asset-title" style={{ fontSize: '16.5px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>
                                            {item.name || 'Équipement'}
                                        </h3>
                                        <p className="asset-subtitle" style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px 0' }}>
                                            {item.brand || 'Générique'} {item.model ? `• ${item.model}` : ''} {item.barcode ? `• Code: ${item.barcode}` : ''}
                                        </p>

                                        {/* Quantité concernée Highlight Box */}
                                        <div style={{
                                            padding: '12px 16px',
                                            background: (ticket.quantityDeducted || ticket.status === 'In Maintenance') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                            borderRadius: '14px',
                                            border: (ticket.quantityDeducted || ticket.status === 'In Maintenance') ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '14px'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (ticket.quantityDeducted || ticket.status === 'In Maintenance') ? '#fbbf24' : '#f87171', fontWeight: '800', fontSize: '13px' }}>
                                                    <Box size={16} /> Quantité concernée :
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                                                    Stock en magasin : <strong style={{ color: '#ffffff' }}>{item.quantity ?? 0}</strong>
                                                    {(ticket.quantityDeducted || ticket.status === 'In Maintenance') && (
                                                        <span style={{ color: '#fbbf24', marginLeft: '6px', fontWeight: '700' }}>(-{ticket.deductedQuantity || qty} en maintenance)</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>
                                                {qty} <span style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>unité(s)</span>
                                            </div>
                                        </div>

                                        {/* Diagnostic Notes Box */}
                                        <div style={{
                                            padding: '14px 16px',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            marginBottom: '14px'
                                        }}>
                                            <div style={{ 
                                                fontSize: '11px', 
                                                fontWeight: '800', 
                                                color: '#818cf8', 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.8px', 
                                                marginBottom: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <ClipboardList size={14} /> Rapport technique / Diagnostic :
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#f1f5f9', lineHeight: '1.5', fontStyle: 'italic', wordBreak: 'break-word' }}>
                                                "{notes}"
                                            </p>
                                        </div>

                                        {/* Reporter & Timestamp */}
                                        <div className="maint-card-reporter-row">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={13} /> Demandé par: <strong style={{ color: '#ffffff' }}>{reporter}</strong>
                                                {ticket.reportedByRole && (
                                                    <span style={{ color: '#818cf8', fontSize: '11px', fontWeight: '700' }}>({ticket.reportedByRole})</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {dateStr}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Maintenancier Actions */}
                                <div className="maint-card-actions">
                                    {/* Button 1: en Maintenance */}
                                    {ticket.quantityDeducted || ticket.status === 'In Maintenance' ? (
                                        <button
                                            type="button"
                                            className="premium-btn"
                                            disabled
                                            style={{ 
                                                flex: 1, 
                                                padding: '10px 14px', 
                                                fontSize: '12px', 
                                                justifyContent: 'center',
                                                background: 'rgba(245, 158, 11, 0.15)',
                                                color: '#f59e0b',
                                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                                cursor: 'default',
                                                fontWeight: '800',
                                                boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)'
                                            }}
                                            title="Actuellement en maintenance. La quantité a été déduite du stock disponible."
                                        >
                                            <Wrench size={14} /> en Maintenance (-{ticket.deductedQuantity || qty})
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="premium-btn secondary"
                                            style={{ 
                                                flex: 1, 
                                                padding: '10px 14px', 
                                                fontSize: '12px', 
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))',
                                                border: '1px solid rgba(245, 158, 11, 0.5)',
                                                color: '#fbbf24',
                                                cursor: 'pointer',
                                                fontWeight: '800'
                                            }}
                                            onClick={() => handleStartMaintenance(ticket)}
                                            title="Cliquer pour déduire la quantité du stock et mettre en maintenance"
                                        >
                                            <Wrench size={14} /> en Maintenance
                                        </button>
                                    )}

                                    {/* Button 2: Remettre en service */}
                                    <button
                                        type="button"
                                        className="premium-btn primary"
                                        style={{ 
                                            flex: 1.2, 
                                            padding: '10px 14px', 
                                            fontSize: '12px', 
                                            justifyContent: 'center', 
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                            cursor: 'pointer',
                                            fontWeight: '800'
                                        }}
                                        onClick={() => handleResolveTicket(ticket)}
                                        title="Remettre en service et réintégrer la quantité au stock disponible"
                                    >
                                        <Sparkles size={14} /> Remettre en service
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    /* ── INVENTORY GRID VIEW (FOR DECLARING ISSUES ON ANY PRODUCT) ── */
                    paginatedItems.map(item => {
                        const colors = getCategoryColor(item.category);
                        const stateInfo = getStateInfo(item.state);
                        return (
                            <div 
                                key={item._id} 
                                className="asset-premium-card"
                                onClick={() => handleOpenStateModal(item)}
                                title="Cliquer pour changer l'état (Cassé, à vérifier, à réparer)"
                            >
                                <div className="card-top">
                                    <span className="category-tag" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                                        <Layers size={12} /> {item.category || 'Autre'}
                                    </span>
                                    <div className="status-indicator">
                                        <span style={{ fontSize: '11px', fontWeight: '800', opacity: 0.8, marginRight: '8px', color: stateInfo.color }}>
                                            {stateInfo.label}
                                        </span>
                                        <span className={`state-dot ${stateInfo.dotClass}`}></span>
                                    </div>
                                </div>

                                <div className="card-main">
                                    <h3 className="asset-title">{item.name}</h3>
                                    <p className="asset-subtitle">{item.brand || 'Generic'} • {item.model || 'Standard'}</p>
                                    
                                    <div className="stats-container" style={{ marginBottom: 0 }}>
                                        <div className="stat-pill">
                                            <div className="stat-icon"><Box size={14} /></div>
                                            <div className="stat-content">
                                                <span className="s-label">Qty</span>
                                                <span className="s-value">{item.quantity || 0}</span>
                                            </div>
                                        </div>
                                        <div className="stat-pill">
                                            <div className="stat-icon"><MapPin size={14} /></div>
                                            <div className="stat-content">
                                                <span className="s-label">Map</span>
                                                <span className="s-value">{item.storageLocation?.zone || '-'}/{item.storageLocation?.shelving || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="maint-pagination-container">
                    <button 
                        onClick={() => changePage(currentPage - 1)} 
                        disabled={currentPage === 1} 
                        className="page-pagination-btn"
                    >
                        Précédent
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i + 1} 
                            onClick={() => changePage(i + 1)} 
                            className={`page-pagination-btn ${currentPage === i + 1 ? 'current' : ''}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button 
                        onClick={() => changePage(currentPage + 1)} 
                        disabled={currentPage === totalPages} 
                        className="page-pagination-btn"
                    >
                        Suivant <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* ── STATE SELECTION MODAL ── */}
            {selectedItemForState && (
                <div className="state-modal-overlay" onClick={() => setSelectedItemForState(null)}>
                    <div className="state-modal-card" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="state-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="state-header-icon-box">
                                    <Wrench size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                                        État & Condition du Matériel
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                                        Définissez la condition technique de ce produit
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedItemForState(null)} className="close-x-btn">&times;</button>
                        </div>

                        {/* Target Item Banner */}
                        <div className="state-target-banner">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="state-pkg-icon">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: '700' }}>
                                        {selectedItemForState.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                        {selectedItemForState.barcode && (
                                            <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                                                Code: {selectedItemForState.barcode}
                                            </span>
                                        )}
                                        {selectedItemForState.category && (
                                            <span style={{ fontSize: '11px', color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                                {selectedItemForState.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', marginBottom: '4px' }}>État actuel:</div>
                                <span className={`stock-state-pill ${selectedItemForState.state || 'Fonctionnel'}`}>
                                    {selectedItemForState.state || 'Fonctionnel'}
                                </span>
                            </div>
                        </div>

                        {/* Status Options Grid */}
                        <div className="state-options-container">
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                                Choisir la nouvelle condition :
                            </div>

                            <div className="state-options-grid">
                                {STATE_OPTIONS.map(opt => {
                                    const IconComponent = opt.icon;
                                    const isSelected = chosenState === opt.value;
                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => setChosenState(opt.value)}
                                            className={`state-option-card ${isSelected ? 'selected' : ''}`}
                                            style={{
                                                '--opt-color': opt.color,
                                                '--opt-glow': opt.glow
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div className="state-opt-icon" style={{ background: `${opt.color}20`, color: opt.color, border: `1px solid ${opt.color}40` }}>
                                                    <IconComponent size={20} />
                                                </div>
                                                <span className="state-opt-badge" style={{ background: `${opt.color}20`, color: opt.color }}>
                                                    {opt.badge}
                                                </span>
                                            </div>

                                            <div style={{ marginTop: '12px' }}>
                                                <div style={{ fontSize: '16px', fontWeight: '800', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                                                    {opt.label}
                                                </div>
                                                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                                                    {opt.subtitle}
                                                </p>
                                            </div>

                                            <div className={`state-opt-radio ${isSelected ? 'checked' : ''}`}>
                                                {isSelected && <div className="state-opt-radio-inner" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantity & Mandatory Diagnostic Notes */}
                        <div className="state-form-body">
                            {/* Quantity Input */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>Quantité concernée</span>
                                        <span style={{ color: '#ef4444', fontSize: '15px' }}>*</span>
                                    </label>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        Stock disponible: <strong style={{ color: '#818cf8', fontSize: '13px' }}>{selectedItemForState.quantity || 0}</strong>
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedItemForState.quantity || 1}
                                        value={itemQuantity}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setItemQuantity(val === '' ? '' : parseInt(val, 10));
                                            if (validationError) setValidationError('');
                                        }}
                                        className="state-notes-textarea"
                                        style={{ 
                                            width: '120px', 
                                            padding: '12px 16px', 
                                            fontSize: '16px', 
                                            fontWeight: '800', 
                                            textAlign: 'center',
                                            color: '#ffffff',
                                            background: 'rgba(15, 23, 42, 0.85)'
                                        }}
                                        required
                                    />
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                                        unité(s) à affecter
                                    </span>
                                </div>
                            </div>

                            {/* Mandatory Diagnostic Notes */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>Notes de diagnostic / Rapport technique</span>
                                        <span style={{ color: '#ef4444', fontSize: '15px' }}>*</span>
                                    </label>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#f87171',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        padding: '3px 9px',
                                        borderRadius: '6px',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Obligatoire
                                    </span>
                                </div>
                                <textarea
                                    rows="3"
                                    value={diagnosticNotes}
                                    onChange={e => {
                                        setDiagnosticNotes(e.target.value);
                                        if (validationError) setValidationError('');
                                    }}
                                    placeholder="Ex: Câble d'alimentation coupé, optique à recalibrer, dalle fissurée... (Rapport technique obligatoire)"
                                    className={`state-notes-textarea ${validationError && !diagnosticNotes.trim() ? 'field-error' : ''}`}
                                    required
                                />
                                {validationError && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#f43f5e', fontSize: '12px', fontWeight: '700' }}>
                                        <AlertTriangle size={14} />
                                        <span>{validationError}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="state-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedItemForState(null)}
                                className="premium-cancel-btn"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveItemState}
                                disabled={isSubmittingState || !diagnosticNotes.trim() || !itemQuantity || itemQuantity < 1}
                                className="premium-save-btn"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: (!diagnosticNotes.trim() || !itemQuantity || itemQuantity < 1) 
                                        ? 'rgba(255, 255, 255, 0.08)' 
                                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    boxShadow: (!diagnosticNotes.trim() || !itemQuantity || itemQuantity < 1) 
                                        ? 'none' 
                                        : '0 4px 14px rgba(99, 102, 241, 0.4)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '12px 24px',
                                    color: (!diagnosticNotes.trim() || !itemQuantity || itemQuantity < 1) ? '#64748b' : '#ffffff',
                                    fontWeight: '800',
                                    cursor: (!diagnosticNotes.trim() || !itemQuantity || itemQuantity < 1) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.25s ease'
                                }}
                            >
                                <Sparkles size={16} />
                                <span>{isSubmittingState ? 'Enregistrement...' : 'Appliquer l\'état'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceView;
