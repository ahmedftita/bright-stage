import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
    Trash2, Save, ClipboardList, Truck, Package, Search, Plus, 
    RefreshCw, X, Calendar, User, Phone, MapPin, CheckCircle, 
    AlertCircle, XCircle, FileText, ChevronRight, Layers, Sparkles
} from 'lucide-react';
import './Logistics.css';
import './DeliveryNoteForm.css';
import { CONFIG } from '../config';
import TunisiaLocationSelector from './TunisiaLocationSelector';

const API_URL = CONFIG.API_URL;

const DeliveryNoteForm = ({ onClose, onSuccess, id: editId }) => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();
    const { id: routeId } = useParams();
    const id = editId || routeId; 
    const isEditMode = !!id;

    const [carriers, setCarriers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transportType, setTransportType] = useState('internal');

    // Browse Inventory Modal State
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [replacingItemIndex, setReplacingItemIndex] = useState(null);
    const [inventorySearch, setInventorySearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [formData, setFormData] = useState({
        project: '',
        client: '',
        date: new Date().toISOString().split('T')[0],
        returnDate: '',
        carrier: '',
        vehiclePlate: '',
        vehicleModel: '',
        driverName: '',
        driverPhone: '',
        driverCin: '',
        status: 'Draft',
        notes: '',
        items: [],
        isIndividual: false,
        address: ''
    });

    const handleClose = () => {
        if (onClose) onClose();
        else navigate('/delivery-notes');
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [carrRes, driverRes, vehicleRes, invRes, clientRes] = await Promise.all([
                    axios.get(`${API_URL}/carriers`),
                    axios.get(`${API_URL}/drivers`),
                    axios.get(`${API_URL}/vehicles`),
                    axios.get(`${API_URL}/inventory`),
                    axios.get(`${API_URL}/clients`)
                ]);

                setCarriers(carrRes.data || []);
                setDrivers(driverRes.data || []);
                setVehicles(vehicleRes.data || []);
                setInventory(invRes.data || []);
                setClients(clientRes.data || []);

                if (isEditMode) {
                    const noteRes = await axios.get(`${API_URL}/delivery-notes/${id}`);
                    const note = noteRes.data;
                    setFormData({
                        ...note,
                        date: note.date ? new Date(note.date).toISOString().split('T')[0] : '',
                        returnDate: note.returnDate ? new Date(note.returnDate).toISOString().split('T')[0] : '',
                        project: note.project?._id || note.project || '',
                        client: note.client?._id || note.client || note.project?.clientId?._id || note.project?.clientId || '',
                        carrier: note.carrier?._id || note.carrier || '',
                        address: note.address || '',
                        driverName: note.driverName || '',
                        driverPhone: note.driverPhone || '',
                        driverCin: note.driverCin || '',
                        vehicleModel: note.vehicleModel || '',
                        vehiclePlate: note.vehiclePlate || '',
                        status: note.status || 'Draft',
                        notes: note.notes || '',
                        items: (note.items || []).map(it => ({
                            ...it,
                            quantity: it.quantity !== undefined ? it.quantity : 1,
                            name: it.name || (it.inventoryItem && typeof it.inventoryItem === 'object' ? it.inventoryItem.name : '')
                        })),
                        isIndividual: note.isIndividual || false
                    });
                    if (note.carrier) {
                        setTransportType('external');
                    } else {
                        setTransportType('internal');
                    }
                }
            } catch (err) {
                console.error("Error loading logistics data:", err);
                showError("Could not sync logistics records", "System Error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, isEditMode]);

    const handleCarrierChange = (e) => {
        const carrierId = e.target.value;
        if (!carrierId) {
            setFormData(prev => ({ ...prev, carrier: '' }));
            return;
        }

        const selectedCarrier = carriers.find(c => c._id === carrierId);
        if (selectedCarrier) {
            setFormData(prev => ({
                ...prev,
                carrier: carrierId,
                vehiclePlate: selectedCarrier.vehiclePlate || '',
                vehicleModel: selectedCarrier.vehicleModel || '',
                driverName: `${selectedCarrier.firstName} ${selectedCarrier.lastName}`,
                driverCin: selectedCarrier.cin || '',
                driverPhone: selectedCarrier.phone || ''
            }));
        }
    };

    const handleDriverChange = (e) => {
        const driverId = e.target.value;
        const selectedDriver = drivers.find(d => d._id === driverId);
        if (selectedDriver) {
            setFormData(prev => ({
                ...prev,
                driverName: selectedDriver.name,
                driverCin: selectedDriver.cin || prev.driverCin,
                driverPhone: selectedDriver.phone || prev.driverPhone
            }));
        }
    };

    const handleVehicleChange = (e) => {
        const vehicleId = e.target.value;
        const selectedVehicle = vehicles.find(v => v._id === vehicleId);
        if (selectedVehicle) {
            setFormData(prev => ({
                ...prev,
                vehiclePlate: selectedVehicle.plateNumber,
                vehicleModel: selectedVehicle.model
            }));
        }
    };

    const handleOpenInventoryModal = (index = null) => {
        setReplacingItemIndex(index);
        setInventorySearch('');
        setSelectedCategory('All');
        setShowInventoryModal(true);
    };

    const handleSelectInventoryItem = (invItem) => {
        if (replacingItemIndex !== null) {
            const newItems = [...formData.items];
            newItems[replacingItemIndex] = {
                ...newItems[replacingItemIndex],
                inventoryItem: invItem._id,
                name: newItems[replacingItemIndex].name || invItem.name
            };
            setFormData(prev => ({ ...prev, items: newItems }));
        } else {
            setFormData(prev => ({
                ...prev,
                items: [
                    ...prev.items,
                    {
                        inventoryItem: invItem._id,
                        name: invItem.name,
                        quantity: 1
                    }
                ]
            }));
        }
        setShowInventoryModal(false);
        setReplacingItemIndex(null);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const categories = ['All', ...new Set(inventory.map(i => i.category || 'Autre').filter(Boolean))];

    const filteredInventory = inventory.filter(item => {
        const q = inventorySearch.toLowerCase().trim();
        const matchesSearch = !q || 
            item.name?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q) ||
            item.brand?.toLowerCase().includes(q) ||
            item.model?.toLowerCase().includes(q);
            
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const matchedDriverId = drivers.find(d => 
        (formData.driverName && d.name?.toLowerCase().trim() === formData.driverName?.toLowerCase().trim()) ||
        (formData.driverCin && d.cin === formData.driverCin) ||
        (formData.driverPhone && d.phone === formData.driverPhone)
    )?._id || '';

    const matchedVehicleId = vehicles.find(v => 
        (formData.vehiclePlate && v.plateNumber?.toLowerCase().trim() === formData.vehiclePlate?.toLowerCase().trim()) ||
        (formData.vehiclePlate && v.plateNumber?.replace(/\s+/g, '') === formData.vehiclePlate?.replace(/\s+/g, '')) ||
        (formData.vehicleModel && v.model?.toLowerCase().trim() === formData.vehicleModel?.toLowerCase().trim())
    )?._id || '';

    // Duration calculation
    const getDurationText = () => {
        if (!formData.date || !formData.returnDate) return null;
        const d1 = new Date(formData.date);
        const d2 = new Date(formData.returnDate);
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        if (diff > 0) return `${diff} jour${diff > 1 ? 's' : ''}`;
        if (diff === 0) return 'Même jour';
        return null;
    };
    const durationText = getDurationText();

    const selectedClientObj = clients.find(c => c._id === formData.client);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                isIndividual: !formData.project
            };

            if (transportType === 'internal') {
                payload.carrier = null;
            }

            // Clean up empty ObjectIds to prevent Mongoose CastError
            if (!payload.project || payload.project === "") delete payload.project;
            if (!payload.client || payload.client === "") delete payload.client;
            if (!payload.carrier || payload.carrier === "") delete payload.carrier;
            if (!payload.returnDate || payload.returnDate === "") payload.returnDate = null;
            
            if (payload.items) {
                payload.items = payload.items.map(item => {
                    const newItem = { ...item };
                    if (newItem.inventoryItem && typeof newItem.inventoryItem === 'object') {
                        newItem.inventoryItem = newItem.inventoryItem._id;
                    }
                    if (!newItem.inventoryItem || newItem.inventoryItem === "" || newItem.inventoryItem === "null") {
                        delete newItem.inventoryItem;
                    }
                    return newItem;
                });
            }

            if (isEditMode) {
                await axios.put(`${API_URL}/delivery-notes/${id}`, payload);
                showSuccess("Bon de livraison mis à jour avec succès", "Succès");
            } else {
                await axios.post(`${API_URL}/delivery-notes`, payload);
                showSuccess("Nouveau bon de livraison généré avec succès", "Succès");
            }
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err) {
            showError("Échec du traitement: " + (err.response?.data?.error || err.message), "Erreur");
        }
    };

    if (loading) return (
        <div className="dispatch-modal-overlay">
            <div style={{ color: '#818cf8', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles className="animate-spin" size={20} />
                <span>Synchronisation du registre logistique...</span>
            </div>
        </div>
    );

    const isDraft = formData.status === 'Draft';
    const isValidated = formData.status === 'Validated';
    const isCancelled = formData.status === 'Cancelled';

    return (
        <>
            <div className="dispatch-modal-overlay" onClick={handleClose}>
                <div className="dispatch-modal-card" onClick={e => e.stopPropagation()}>
                    {/* Ambient glow backdrop */}
                    <div className="dispatch-ambient-glow" />

                {/* Header */}
                <div className="dispatch-modal-header">
                    <div className="dispatch-header-left">
                        <div className="dispatch-header-icon-badge">
                            <ClipboardList size={24} />
                        </div>
                        <div className="dispatch-header-title-group">
                            <h2>
                                {isEditMode ? 'Modifier le Bon de Livraison' : 'Générer un Bon de Livraison'}
                            </h2>
                            <p className="dispatch-header-subtext">
                                Registre des mouvements logistiques, matériel assigné et suivi convoi
                            </p>
                        </div>
                    </div>

                    <div className="dispatch-header-right">
                        {/* Live Status Pill */}
                        <span
                            className="dispatch-status-badge-pill"
                            style={{
                                background: isValidated 
                                    ? 'rgba(16, 185, 129, 0.15)' 
                                    : isDraft 
                                        ? 'rgba(245, 158, 11, 0.15)' 
                                        : 'rgba(239, 68, 68, 0.15)',
                                color: isValidated 
                                    ? '#34d399' 
                                    : isDraft 
                                        ? '#fbbf24' 
                                        : '#f87171',
                                border: `1px solid ${isValidated 
                                    ? 'rgba(16, 185, 129, 0.35)' 
                                    : isDraft 
                                        ? 'rgba(245, 158, 11, 0.35)' 
                                        : 'rgba(239, 68, 68, 0.35)'}`
                            }}
                        >
                            <span
                                className="status-dot-indicator"
                                style={{
                                    background: isValidated ? '#10b981' : isDraft ? '#f59e0b' : '#ef4444'
                                }}
                            />
                            {isValidated ? 'Validé / Confirmé' : isDraft ? 'Brouillon / En Cours' : 'Annulé'}
                        </span>

                        <button
                            type="button"
                            className="dispatch-close-btn"
                            onClick={handleClose}
                            title="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="dispatch-modal-body">
                        {/* Section 1: Client & Timeline */}
                        <div className="dispatch-section-box">
                            <div className="dispatch-section-header">
                                <span className="dispatch-section-title">
                                    <User size={15} /> Destinataire & Calendrier du Convoi
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {durationText && (
                                        <span className="mission-duration-pill">
                                            ⏱️ Durée : {durationText}
                                        </span>
                                    )}
                                    <span className="dispatch-section-badge">Planning</span>
                                </div>
                            </div>

                            <div className="dispatch-grid-client-dates">
                                {/* Client Selection */}
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">
                                        Client Destinataire <span className="required-dot">*</span>
                                    </label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><User size={16} /></span>
                                        <select
                                            required
                                            value={formData.client || ''}
                                            onChange={e => {
                                                const clientId = e.target.value;
                                                const selectedClient = clients.find(c => c._id === clientId);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    client: clientId,
                                                    address: prev.address || (selectedClient?.address ? selectedClient.address : prev.address)
                                                }));
                                            }}
                                            className="dispatch-select-input"
                                        >
                                            <option value="">-- Sélectionner le client --</option>
                                            {clients.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} {c.contactPerson ? `(${c.contactPerson})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Dispatch Date */}
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">
                                        Date de Départ <span className="required-dot">*</span>
                                    </label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><Calendar size={16} /></span>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="dispatch-text-input"
                                        />
                                    </div>
                                </div>

                                {/* Return Date */}
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">
                                        Date de Retour Estimée
                                    </label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><Calendar size={16} /></span>
                                        <input
                                            type="date"
                                            value={formData.returnDate}
                                            onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                                            className="dispatch-text-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Destination Address (Tunisia Location Selector) */}
                        <TunisiaLocationSelector
                            value={formData.address || ''}
                            onChange={(newAddress) => setFormData(prev => ({ ...prev, address: newAddress }))}
                        />

                        {/* Section 3: Fleet & Transport */}
                        <div className="dispatch-section-box">
                            <div className="dispatch-section-header">
                                <span className="dispatch-section-title">
                                    <Truck size={15} /> Transport & Logistique de Convoi
                                </span>
                                {/* Segmented Toggle: Internal vs External */}
                                <div className="transport-segmented-tabs">
                                    <button
                                        type="button"
                                        className={`transport-tab-btn ${transportType === 'internal' ? 'active' : ''}`}
                                        onClick={() => {
                                            setTransportType('internal');
                                            setFormData(prev => ({ ...prev, carrier: '' }));
                                        }}
                                    >
                                        <Truck size={14} />
                                        <span>Flotte Interne</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`transport-tab-btn ${transportType === 'external' ? 'active' : ''}`}
                                        onClick={() => setTransportType('external')}
                                    >
                                        <Layers size={14} />
                                        <span>Transporteur Externe</span>
                                    </button>
                                </div>
                            </div>

                            {/* Internal: Quick Selectors for Drivers & Vehicles */}
                            {transportType === 'internal' && (
                                <div className="dispatch-subgrid-2">
                                    <div className="dispatch-field-group">
                                        <label className="dispatch-field-label">
                                            Chauffeur Interne Agréé
                                        </label>
                                        <div className="dispatch-input-wrapper">
                                            <span className="dispatch-input-icon"><User size={16} /></span>
                                            <select 
                                                value={matchedDriverId} 
                                                onChange={handleDriverChange} 
                                                className="dispatch-select-input"
                                            >
                                                <option value="">-- Choisir un chauffeur interne --</option>
                                                {drivers.map(d => <option key={d._id} value={d._id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="dispatch-field-group">
                                        <label className="dispatch-field-label">
                                            Véhicule de Flotte Affecté
                                        </label>
                                        <div className="dispatch-input-wrapper">
                                            <span className="dispatch-input-icon"><Truck size={16} /></span>
                                            <select 
                                                value={matchedVehicleId} 
                                                onChange={handleVehicleChange} 
                                                className="dispatch-select-input"
                                            >
                                                <option value="">-- Choisir un véhicule de flotte --</option>
                                                {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.model}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* External: Partner Carrier Database */}
                            {transportType === 'external' && (
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">
                                        Partenaire Transporteur Logistique Agréé
                                    </label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><Truck size={16} /></span>
                                        <select 
                                            value={formData.carrier || ''} 
                                            onChange={handleCarrierChange} 
                                            className="dispatch-select-input"
                                        >
                                            <option value="">-- Choisir un prestataire transporteur --</option>
                                            {carriers.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {c.firstName} {c.lastName} — {c.vehicleModel} ({c.vehiclePlate || 'Immat'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* 4-Column Transport Details Subgrid */}
                            <div className="dispatch-subgrid-4">
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">Nom du Chauffeur</label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><User size={15} /></span>
                                        <input 
                                            type="text" 
                                            placeholder="Nom complet"
                                            className="dispatch-text-input" 
                                            value={formData.driverName} 
                                            onChange={e => setFormData({ ...formData, driverName: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">Téléphone Contact</label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><Phone size={15} /></span>
                                        <input 
                                            type="text" 
                                            placeholder="+216 -- --- ---"
                                            className="dispatch-text-input" 
                                            value={formData.driverPhone} 
                                            onChange={e => setFormData({ ...formData, driverPhone: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">Modèle Véhicule</label>
                                    <div className="dispatch-input-wrapper">
                                        <span className="dispatch-input-icon"><Truck size={15} /></span>
                                        <input 
                                            type="text" 
                                            placeholder="ex. Master / Sprinter"
                                            className="dispatch-text-input" 
                                            value={formData.vehicleModel} 
                                            onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">Immatriculation</label>
                                    <div className="dispatch-input-wrapper">
                                        <input 
                                            type="text" 
                                            placeholder="123 TU 4567"
                                            className="dispatch-text-input" 
                                            style={{ paddingLeft: '14px', paddingRight: '45px', fontWeight: '700' }}
                                            value={formData.vehiclePlate} 
                                            onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })} 
                                        />
                                        <span className="dispatch-trailing-badge">TU</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Assigned Hardware */}
                        <div className="dispatch-section-box">
                            <div className="hardware-header-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Package size={17} style={{ color: '#818cf8' }} />
                                    <span className="dispatch-section-title" style={{ margin: 0 }}>
                                        Matériel & Équipements Assignés
                                    </span>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        background: 'rgba(99, 102, 241, 0.15)', 
                                        color: '#a5b4fc', 
                                        padding: '2px 8px', 
                                        borderRadius: '12px', 
                                        fontWeight: '700',
                                        border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}>
                                        {formData.items.length} {formData.items.length === 1 ? 'Article' : 'Articles'}
                                    </span>
                                </div>

                                <button 
                                    type="button" 
                                    onClick={() => handleOpenInventoryModal(null)} 
                                    className="hardware-add-btn"
                                >
                                    <Plus size={15} strokeWidth={2.5} />
                                    <span>+ Ajouter du Matériel</span>
                                </button>
                            </div>

                            {/* Equipment Rows List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                                {formData.items.length === 0 ? (
                                    <div className="hardware-empty-box">
                                        <div style={{ 
                                            width: '44px', height: '44px', borderRadius: '12px', 
                                            background: 'rgba(99, 102, 241, 0.1)', display: 'flex', 
                                            alignItems: 'center', justifyContent: 'center', color: '#818cf8' 
                                        }}>
                                            <Package size={22} />
                                        </div>
                                        <div style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '13.5px' }}>
                                            Aucun matériel assigné à ce convoi
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            Cliquez sur <strong>+ Ajouter du Matériel</strong> pour parcourir l'inventaire en temps réel.
                                        </div>
                                    </div>
                                ) : (
                                    formData.items.map((item, index) => {
                                        const invItem = (item.inventoryItem && typeof item.inventoryItem === 'object' && item.inventoryItem.name)
                                            ? item.inventoryItem
                                            : inventory.find(i => i._id === (item.inventoryItem?._id || item.inventoryItem))
                                              || inventory.find(i => i.name?.toLowerCase().trim() === item.name?.toLowerCase().trim());

                                        return (
                                            <div key={index} className="hardware-item-card">
                                                {/* Product Badge */}
                                                <div className="hardware-product-badge">
                                                    <div className="hardware-cube-icon">
                                                        <Package size={16} />
                                                    </div>
                                                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {invItem ? invItem.name : (item.name || 'Article lié')}
                                                        </div>
                                                        {invItem?.category && (
                                                            <span style={{ fontSize: '10.5px', color: '#a5b4fc', fontWeight: '600' }}>
                                                                {invItem.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenInventoryModal(index)}
                                                        title="Changer d'article"
                                                        className="hardware-swap-btn"
                                                    >
                                                        <RefreshCw size={12} />
                                                    </button>
                                                </div>

                                                {/* Custom Designation Input */}
                                                <div className="hardware-designation-box" style={{ flex: 1.5, minWidth: 0 }}>
                                                    <input 
                                                        type="text" 
                                                        value={item.name || ''} 
                                                        onChange={e => updateItem(index, 'name', e.target.value)} 
                                                        placeholder="Désignation personnalisée..." 
                                                        className="dispatch-text-input"
                                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                                    />
                                                </div>

                                                {/* Quantity Input */}
                                                <div className="hardware-qty-box">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity !== undefined ? item.quantity : 1} 
                                                        onChange={e => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} 
                                                        style={{ 
                                                            width: '100%', background: 'transparent', border: 'none', 
                                                            color: '#fff', fontSize: '13px', fontWeight: '700', 
                                                            textAlign: 'center', outline: 'none' 
                                                        }}
                                                        title="Quantité"
                                                    />
                                                </div>

                                                {/* Delete Button */}
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItem(index)} 
                                                    className="hardware-delete-btn"
                                                    title="Supprimer cet article"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Section 5: Status & Notes */}
                        <div className="dispatch-section-box">
                            <div className="dispatch-section-header">
                                <span className="dispatch-section-title">
                                    <FileText size={15} /> Statut du Bon & Notes Internes
                                </span>
                                <span className="dispatch-section-badge">Contrôle</span>
                            </div>

                            <div className="dispatch-subgrid-2">
                                {/* Interactive Status Buttons */}
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">Statut du Registre</label>
                                    <div className="dispatch-status-grid">
                                        <button
                                            type="button"
                                            className={`dispatch-status-btn ${isDraft ? 'active status-draft' : ''}`}
                                            onClick={() => setFormData({ ...formData, status: 'Draft' })}
                                        >
                                            <span className="status-dot-indicator" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: '700' }}>Brouillon</div>
                                                <div className="dispatch-status-btn-subtext" style={{ color: '#64748b', fontSize: '10.5px' }}>En préparation</div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            className={`dispatch-status-btn ${isValidated ? 'active status-validated' : ''}`}
                                            onClick={() => setFormData({ ...formData, status: 'Validated' })}
                                        >
                                            <span className="status-dot-indicator" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: '700' }}>Validé</div>
                                                <div className="dispatch-status-btn-subtext" style={{ color: '#64748b', fontSize: '10.5px' }}>Prêt au départ</div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            className={`dispatch-status-btn ${isCancelled ? 'active status-cancelled' : ''}`}
                                            onClick={() => setFormData({ ...formData, status: 'Cancelled' })}
                                        >
                                            <span className="status-dot-indicator" style={{ background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ color: '#fff', fontSize: '12.5px', fontWeight: '700' }}>Annulé</div>
                                                <div className="dispatch-status-btn-subtext" style={{ color: '#64748b', fontSize: '10.5px' }}>Non expédié</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Logistic Notes */}
                                <div className="dispatch-field-group">
                                    <label className="dispatch-field-label">Instructions & Notes Internes</label>
                                    <textarea 
                                        rows="2" 
                                        value={formData.notes} 
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                                        className="dispatch-text-input" 
                                        placeholder="Consignes particulières, accès au site, contact sécurité..." 
                                        style={{ height: '76px', resize: 'none', padding: '10px 14px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="dispatch-modal-footer">
                        <div className="dispatch-footer-summary">
                            <span>Client : <strong className="summary-highlight">{selectedClientObj?.name || 'Non spécifié'}</strong></span>
                            <span>•</span>
                            <span>Matériel : <strong className="summary-highlight">{formData.items.length} unité{formData.items.length > 1 ? 's' : ''}</strong></span>
                            <span>•</span>
                            <span>Transport : <strong className="summary-highlight">{transportType === 'internal' ? 'Flotte Interne' : 'Transporteur Externe'}</strong></span>
                        </div>

                        <div className="dispatch-footer-btns">
                            <button
                                type="button"
                                className="dispatch-btn-secondary"
                                onClick={handleClose}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="dispatch-btn-primary"
                            >
                                <Save size={16} />
                                <span>{isEditMode ? 'Mettre à Jour le Registre' : 'Générer le Bon de Livraison'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {/* ── BROWSE INVENTORY MODAL ── */}
        {showInventoryModal && (
            <div className="inv-modal-overlay" onClick={() => setShowInventoryModal(false)}>
                <div className="inv-modal-card" onClick={e => e.stopPropagation()}>
                        {/* Ambient glow */}
                        <div className="dispatch-ambient-glow" style={{ width: '450px', height: '140px' }} />

                        {/* Header */}
                        <div className="inv-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                                <div style={{ 
                                    width: '42px', height: '42px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))', 
                                    border: '1px solid rgba(99, 102, 241, 0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#818cf8', flexShrink: 0
                                }}>
                                    <Package size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                                        Parcourir l'Inventaire & Assigner
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                                        {replacingItemIndex !== null ? "Remplacer l'article sélectionné" : "Sélectionnez un équipement pour l'assigner au convoi"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowInventoryModal(false)} 
                                className="dispatch-close-btn" 
                                style={{ width: '36px', height: '36px', position: 'relative', zIndex: 1 }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div style={{ padding: '16px 28px', background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Search size={16} style={{ position: 'absolute', left: '14px', color: '#818cf8' }} />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Rechercher par nom, marque, modèle ou catégorie (ex: Beam, Sunstripe, Console, Micro...)"
                                    value={inventorySearch}
                                    onChange={e => setInventorySearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(15, 23, 42, 0.8)',
                                        border: '1px solid rgba(99, 102, 241, 0.25)',
                                        borderRadius: '12px',
                                        padding: '11px 40px 11px 42px',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {inventorySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setInventorySearch('')}
                                        style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="inv-category-pills">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`inv-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                                >
                                    {cat} {cat === 'All' ? `(${inventory.length})` : ''}
                                </button>
                            ))}
                        </div>

                        {/* Items List */}
                        <div style={{ padding: '16px 28px', overflowY: 'auto', flex: 1, maxHeight: '420px' }}>
                            {filteredInventory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                                    <Package size={36} style={{ color: '#334155', marginBottom: '10px' }} />
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                        Aucun matériel trouvé pour "{inventorySearch}"
                                    </p>
                                </div>
                            ) : (
                                filteredInventory.map(item => (
                                    <div
                                        key={item._id}
                                        className="inv-item-card"
                                        onClick={() => handleSelectInventoryItem(item)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '10px',
                                                background: 'rgba(99, 102, 241, 0.12)',
                                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#818cf8',
                                                flexShrink: 0
                                            }}>
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700' }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                                    {item.category && (
                                                        <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', padding: '2px 8px', borderRadius: '6px' }}>
                                                            {item.category}
                                                        </span>
                                                    )}
                                                    {item.brand && (
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {item.brand}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="inv-item-card-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    color: (item.quantity || 0) > 0 ? '#34d399' : '#f87171',
                                                    background: (item.quantity || 0) > 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                                    padding: '3px 9px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${(item.quantity || 0) > 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                                                }}>
                                                    Stock: {item.quantity || 0}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="inv-select-btn"
                                            >
                                                Sélectionner
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeliveryNoteForm;
