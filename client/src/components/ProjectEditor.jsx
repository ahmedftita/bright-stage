import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useDialog } from '../context/ConfirmContext';
import './ProjectEditor.css';
import {
    FolderPlus,
    X,
    Check,
    FileText,
    Calendar,
    Users,
    Box,
    Layers,
    MapPin,
    User,
    Phone,
    Truck,
    Sparkles,
    Plus,
    Minus,
    Trash2,
    Search,
    ArrowRight,
    ArrowLeft,
    Clock,
    Building,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    Shield,
    RotateCcw,
    Flag
} from 'lucide-react';

const ProjectEditor = ({ project, onClose, onSave, initialDate }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const confirm = useConfirm();
    const { showAlert } = useDialog();

    const [activeTab, setActiveTab] = useState('general');

    const [formData, setFormData] = useState({
        eventName: '',
        status: 'Draft',
        client: { name: '', contactPerson: '', address: '', taxId: '', phone: '' },
        clientId: '',
        dates: { start: initialDate || '', end: initialDate || '' },
        siteName: '',
        siteAddress: '',
        notes: '',
        items: [],
        assignedUsers: [],
        team: {
            siteLeader: { name: '', phone: '' },
            chefChantier: ''
        },
        transport: {
            driverName: '',
            driverLicense: '',
            vehicleModel: '',
            vehiclePlate: ''
        }
    });

    const [clients, setClients] = useState([]);
    const [availableItems, setAvailableItems] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [itemSearch, setItemSearch] = useState('');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [filterSkill, setFilterSkill] = useState('');
    const [itemSource, setItemSource] = useState('internal');
    const [subcontractedItems, setSubcontractedItems] = useState([]);

    const [availability, setAvailability] = useState({
        unavailableUsers: [],
        unavailableVehicles: [],
        unavailableDrivers: [],
        restWarnings: [],
        itemAvailability: {}
    });

    const isLocked = project?.permissions?.locked === true;
    const canAdvanceStatus = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    // Normalize date to YYYY-MM-DD
    const normalizeDateStr = (d) => {
        if (!d) return '';
        try {
            if (typeof d === 'string') {
                return d.includes('T') ? d.split('T')[0] : d;
            }
            return new Date(d).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    // Pre-populate immediately from project prop if available
    useEffect(() => {
        if (project) {
            const resolvedClientId = typeof project.clientId === 'object' ? (project.clientId?._id || '') : (project.clientId || '');
            const resolvedChef = typeof project.team?.chefChantier === 'object' ? (project.team.chefChantier?._id || '') : (project.team?.chefChantier || '');
            const assignedIds = (project.assignedUsers || []).map(u => typeof u === 'object' ? u._id?.toString() : u?.toString()).filter(Boolean);

            const initialItems = (project.items || []).map(i => {
                const invObj = typeof i.inventoryItem === 'object' ? i.inventoryItem : null;
                const invId = invObj ? invObj._id : i.inventoryItem;
                const subId = typeof i.subcontractedItem === 'object' ? i.subcontractedItem?._id : i.subcontractedItem;
                return {
                    ...i,
                    inventoryItem: invId,
                    subcontractedItem: subId,
                    name: i.name || invObj?.name || 'Equipment',
                    quantity: i.quantity || 1,
                    source: i.source || (i.category === 'Subcontracted' ? 'subcontracted' : 'internal')
                };
            });

            setFormData(prev => ({
                ...prev,
                eventName: project.eventName || '',
                status: project.status || 'Draft',
                clientId: resolvedClientId,
                client: {
                    name: project.client?.name || '',
                    contactPerson: project.client?.contactPerson || '',
                    address: project.client?.address || '',
                    taxId: project.client?.taxId || '',
                    phone: project.client?.phone || ''
                },
                dates: {
                    start: normalizeDateStr(project.dates?.start),
                    end: normalizeDateStr(project.dates?.end)
                },
                siteName: project.siteName || '',
                siteAddress: project.siteAddress || '',
                notes: project.notes || '',
                team: {
                    siteLeader: project.team?.siteLeader || { name: '', phone: '' },
                    chefChantier: resolvedChef
                },
                transport: {
                    driverName: project.transport?.driverName || '',
                    driverLicense: project.transport?.driverLicense || '',
                    vehicleModel: project.transport?.vehicleModel || '',
                    vehiclePlate: project.transport?.vehiclePlate || ''
                },
                items: initialItems,
                assignedUsers: assignedIds
            }));
        }
    }, [project]);

    // Fetch master database lists and reload fresh project details
    useEffect(() => {
        fetchData();
    }, [project]);

    // Auto-save effect for existing project
    useEffect(() => {
        if (!project) return;
        const timer = setTimeout(() => {
            if (JSON.stringify(formData) !== JSON.stringify(project)) {
                saveProject(true);
            }
        }, 30000);
        return () => clearTimeout(timer);
    }, [formData]);

    // Availability Check Effect
    useEffect(() => {
        if (!project && initialDate) {
            setFormData(prev => ({
                ...prev,
                dates: {
                    start: initialDate,
                    end: initialDate
                }
            }));
        }
    }, [initialDate, project]);

    useEffect(() => {
        if (formData.dates?.start && formData.dates?.end) {
            checkAvailability();
        }
    }, [formData.dates?.start, formData.dates?.end]);

    const fetchData = async () => {
        try {
            const [clientsRes, itemsRes, vehiclesRes, driversRes, usersRes] = await Promise.all([
                api.get('/clients'),
                api.get('/inventory'),
                api.get('/vehicles'),
                api.get('/drivers'),
                api.get('/users')
            ]);

            const allClients = clientsRes.data || [];
            const allItems = itemsRes.data || [];
            const allVehicles = vehiclesRes.data || [];
            const allDrivers = driversRes.data || [];
            const allUsers = usersRes.data || [];

            setClients(allClients);
            setAvailableItems(allItems.filter(i => i.category !== 'Subcontracted'));
            setSubcontractedItems(allItems.filter(i => i.category === 'Subcontracted'));
            setVehicles(allVehicles);
            setDrivers(allDrivers);
            setUsers(allUsers);

            if (project && project._id) {
                const fullProjectRes = await api.get(`/projects/${project._id}`);
                const full = fullProjectRes.data;

                // 1. Resolve Client
                let resolvedClientId = '';
                if (full.clientId) {
                    resolvedClientId = typeof full.clientId === 'object' ? full.clientId._id : full.clientId;
                } else if (project.clientId) {
                    resolvedClientId = typeof project.clientId === 'object' ? project.clientId._id : project.clientId;
                } else if (full.client?.name) {
                    const matched = allClients.find(c => c.name && c.name.trim().toLowerCase() === full.client.name.trim().toLowerCase());
                    if (matched) resolvedClientId = matched._id;
                }

                // 2. Resolve Chef Chantier
                const resolvedChefChantier = typeof full.team?.chefChantier === 'object'
                    ? (full.team.chefChantier?._id || '')
                    : (full.team?.chefChantier || '');

                // 3. Normalize Assigned Users to string IDs
                const normalizedUsers = (full.assignedUsers || []).map(u =>
                    typeof u === 'object' ? u._id?.toString() : u?.toString()
                ).filter(Boolean);

                // 4. Normalize Items with names and IDs
                const normalizedItems = (full.items || []).map(i => {
                    const invObj = typeof i.inventoryItem === 'object' ? i.inventoryItem : null;
                    const invId = invObj ? invObj._id : i.inventoryItem;
                    const subId = typeof i.subcontractedItem === 'object' ? i.subcontractedItem?._id : i.subcontractedItem;
                    return {
                        ...i,
                        inventoryItem: invId,
                        subcontractedItem: subId,
                        name: i.name || invObj?.name || 'Equipment',
                        quantity: i.quantity || 1,
                        source: i.source || (i.category === 'Subcontracted' ? 'subcontracted' : 'internal')
                    };
                });

                // 5. Auto-sync driver license & vehicle plate if present in master list
                let driverLic = full.transport?.driverLicense || '';
                if (!driverLic && full.transport?.driverName) {
                    const foundDrv = allDrivers.find(d => d.name === full.transport.driverName);
                    if (foundDrv) driverLic = foundDrv.cin || foundDrv.licenseNumber || '';
                }

                let vehPlate = full.transport?.vehiclePlate || '';
                if (!vehPlate && full.transport?.vehicleModel) {
                    const foundVeh = allVehicles.find(v => v.model === full.transport.vehicleModel);
                    if (foundVeh) vehPlate = foundVeh.plateNumber || '';
                }

                setFormData({
                    ...full,
                    eventName: full.eventName || '',
                    status: full.status || 'Draft',
                    clientId: resolvedClientId,
                    client: {
                        name: full.client?.name || '',
                        contactPerson: full.client?.contactPerson || '',
                        address: full.client?.address || '',
                        taxId: full.client?.taxId || '',
                        phone: full.client?.phone || ''
                    },
                    dates: {
                        start: normalizeDateStr(full.dates?.start),
                        end: normalizeDateStr(full.dates?.end)
                    },
                    siteName: full.siteName || '',
                    siteAddress: full.siteAddress || '',
                    notes: full.notes || '',
                    team: {
                        siteLeader: full.team?.siteLeader || { name: '', phone: '' },
                        chefChantier: resolvedChefChantier
                    },
                    transport: {
                        driverName: full.transport?.driverName || '',
                        driverLicense: driverLic,
                        vehicleModel: full.transport?.vehicleModel || '',
                        vehiclePlate: vehPlate
                    },
                    items: normalizedItems,
                    assignedUsers: normalizedUsers
                });
            } else {
                // Pre-fill from query param if new project
                const clientIdParam = searchParams.get('clientId');
                if (clientIdParam) {
                    const client = allClients.find(c => c._id === clientIdParam);
                    if (client) {
                        setFormData(prev => ({
                            ...prev,
                            clientId: client._id,
                            client: {
                                name: client.name || '',
                                contactPerson: client.contactPerson || '',
                                address: client.address || '',
                                taxId: client.taxId || '',
                                phone: client.phone || ''
                            }
                        }));
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching project data:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async () => {
        try {
            const res = await api.post('/availability', {
                startDate: formData.dates.start,
                endDate: formData.dates.end,
                excludeProjectId: project?._id,
                siteAddress: formData.siteAddress
            });
            setAvailability(res.data);
        } catch (err) {
            console.error('Availability check failed:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleClientSelect = (e) => {
        const selectedId = e.target.value;
        const matched = clients.find(c => c._id === selectedId);
        if (matched) {
            setFormData(prev => ({
                ...prev,
                clientId: matched._id,
                client: {
                    name: matched.name || '',
                    contactPerson: matched.contactPerson || '',
                    address: matched.address || '',
                    taxId: matched.taxId || '',
                    phone: matched.phone || ''
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                clientId: '',
                client: { name: '', contactPerson: '', address: '', taxId: '', phone: '' }
            }));
        }
    };

    const handleAddItem = (item, source = itemSource) => {
        setFormData(prev => {
            const existingItem = prev.items.find(i => (i.inventoryItem?._id || i.inventoryItem) === item._id);

            if (source === 'internal') {
                const availData = availability.itemAvailability[item._id] || {};
                const available = availData.available !== undefined ? availData.available : item.quantity;
                const currentQty = existingItem ? existingItem.quantity : 0;

                if (currentQty + 1 > available) {
                    showAlert({
                        title: "Limite de stock",
                        message: `Impossible d'ajouter plus de ${available} articles depuis le stock disponible.`,
                        type: "warning"
                    });
                    return prev;
                }
            }

            let newItems;
            if (existingItem) {
                newItems = prev.items.map(i =>
                    (i.inventoryItem?._id || i.inventoryItem) === item._id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            } else {
                newItems = [...prev.items, {
                    inventoryItem: item._id,
                    name: item.name,
                    quantity: 1,
                    source: source,
                    price: item.price || item.rentalPrice || 0
                }];
            }
            return { ...prev, items: newItems };
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleQuantityChange = (index, delta) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === index) {
                    const newQty = Math.max(1, item.quantity + delta);

                    if (item.source === 'internal' && delta > 0) {
                        const availID = typeof item.inventoryItem === 'object' ? item.inventoryItem._id : item.inventoryItem;
                        const availData = availability.itemAvailability[availID] || {};
                        const available = availData.available !== undefined ? availData.available : 9999;

                        if (newQty > available) {
                            showAlert({
                                title: "Stock insuffisant",
                                message: `La quantité ne peut pas dépasser ${available} articles en stock.`,
                                type: "warning"
                            });
                            return item;
                        }
                    }

                    return { ...item, quantity: newQty };
                }
                return item;
            })
        }));
    };

    const saveProject = async (silent = false) => {
        if (!silent) setSaving(true);
        try {
            const payload = { ...formData };

            // Sanitization: clean ObjectId fields
            if (!payload.clientId || payload.clientId === "") {
                delete payload.clientId;
            } else if (typeof payload.clientId === 'object') {
                payload.clientId = payload.clientId._id;
            }

            if (payload.team) {
                const newTeam = { ...payload.team };
                if (!newTeam.chefChantier || newTeam.chefChantier === "") {
                    delete newTeam.chefChantier;
                } else if (typeof newTeam.chefChantier === 'object') {
                    newTeam.chefChantier = newTeam.chefChantier._id;
                }
                payload.team = newTeam;
            }

            if (payload.dates) {
                if (!payload.dates.start || payload.dates.start === "") delete payload.dates.start;
                if (!payload.dates.end || payload.dates.end === "") delete payload.dates.end;
            }

            if (payload.assignedUsers) {
                payload.assignedUsers = payload.assignedUsers
                    .map(u => typeof u === 'object' ? u._id?.toString() : u?.toString())
                    .filter(uid => uid && uid !== "");
            }

            if (payload.items) {
                payload.items = payload.items.map(item => {
                    const newItem = { ...item };
                    const invId = typeof newItem.inventoryItem === 'object' ? newItem.inventoryItem?._id : newItem.inventoryItem;
                    const subId = typeof newItem.subcontractedItem === 'object' ? newItem.subcontractedItem?._id : newItem.subcontractedItem;

                    if (!invId || invId === "") delete newItem.inventoryItem;
                    else newItem.inventoryItem = invId;

                    if (!subId || subId === "") delete newItem.subcontractedItem;
                    else newItem.subcontractedItem = subId;

                    return newItem;
                });
            }

            if (project && project._id) {
                await projectService.update(project._id, payload);
            } else {
                await projectService.create(payload);
            }

            if (!silent) {
                if (onSave) onSave();
                if (onClose) onClose();
            }
            setLastSaved(new Date());
        } catch (err) {
            if (!silent) {
                const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
                showAlert({
                    title: "Erreur d'enregistrement",
                    message: `Erreur lors de l'enregistrement du projet : ${errMsg}`,
                    type: "danger"
                });
            }
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveProject(false);
    };

    const WORKFLOW_STEPS = ['Draft', 'Pickup', 'Return', 'Done'];
    let effectiveStatus = formData.status || 'Draft';
    if (effectiveStatus === 'Quote') effectiveStatus = 'Draft';
    if (effectiveStatus === 'Confirmed') effectiveStatus = 'Pickup';
    const currentStepIndex = WORKFLOW_STEPS.indexOf(effectiveStatus);

    const advanceStatus = (newStatus) => {
        setFormData(prev => ({ ...prev, status: newStatus }));
    };

    const calculateDays = () => {
        if (!formData.dates?.start || !formData.dates?.end) return null;
        const start = new Date(formData.dates.start);
        const end = new Date(formData.dates.end);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : null;
    };
    const daysCount = calculateDays();

    // Tab items definition
    const tabs = [
        { id: 'general', label: 'General & Client', icon: FileText, count: (formData.eventName && formData.client?.name) ? <Check size={11} strokeWidth={3} /> : null },
        { id: 'logistics', label: 'Dates & Venue', icon: Calendar, count: formData.dates?.start ? <Check size={11} strokeWidth={3} /> : null },
        { id: 'team', label: 'Crew & Transport', icon: Users, count: (formData.assignedUsers?.length || 0) + (formData.team?.chefChantier ? 1 : 0) },
        { id: 'equipment', label: 'Equipment Store', icon: Box, count: formData.items?.length || 0 },
        { id: 'all', label: 'Full Overview', icon: Layers, count: null }
    ];

    const tabOrder = ['general', 'logistics', 'team', 'equipment', 'all'];
    const currentTabIndex = tabOrder.indexOf(activeTab);

    return (
        <div className="pe-overlay">
            <div className="pe-modal">

                {/* Header with Pipeline Stepper & Quick Status */}
                <div className="pe-header">
                    <div className="pe-header-left">
                        <div className="pe-title-badge">
                            <FolderPlus size={22} />
                        </div>
                        <div>
                            <div className="pe-title-row">
                                <h2 className="pe-title">
                                    {project ? (formData.eventName || 'Edit Project') : (formData.eventName || 'Create New Project')}
                                </h2>
                                <span className={`pe-status-pill ${effectiveStatus.toLowerCase()}`}>
                                    {formData.status}
                                </span>
                                {saving ? (
                                    <span className="pe-sync-indicator syncing">
                                        <span className="pe-pulse-dot" />
                                        Syncing cloud...
                                    </span>
                                ) : lastSaved ? (
                                    <span className="pe-sync-indicator saved">
                                        <CheckCircle2 size={13} />
                                        Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                ) : null}
                            </div>
                            <p className="pe-subtitle">
                                {project ? `ID: ${project.customId || project._id.slice(-6).toUpperCase()} • Comprehensive Project Workspace` : 'Configure event requirements, team staffing, and inventory reservations'}
                            </p>
                        </div>
                    </div>

                    {/* Interactive Pipeline Stepper */}
                    <div className="pe-stepper">
                        {WORKFLOW_STEPS.map((step, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isActive = idx === currentStepIndex;
                            return (
                                <React.Fragment key={step}>
                                    <div
                                        className={`pe-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={() => canAdvanceStatus && advanceStatus(step)}
                                        title={canAdvanceStatus ? `Switch status to ${step}` : undefined}
                                    >
                                        <div className="pe-step-circle">
                                            {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                                        </div>
                                        <span className="pe-step-label">{step}</span>
                                    </div>
                                    {idx < WORKFLOW_STEPS.length - 1 && (
                                        <div className={`pe-step-line ${idx < currentStepIndex ? 'completed' : ''}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Close Button */}
                    <button onClick={onClose} className="pe-close-btn" title="Close editor">
                        <X size={20} />
                    </button>
                </div>

                {/* Systematic Navigation Tabs */}
                <div className="pe-tabs-bar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={`pe-tab-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={16} className="pe-tab-icon" />
                                <span>{tab.label}</span>
                                {tab.count !== null && tab.count !== undefined && (
                                    <span className="pe-tab-badge">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Main Split Body */}
                <div className="pe-body">

                    {/* Left Panel: Form Sections */}
                    <div className="pe-main-content">
                        <form id="projectForm" onSubmit={handleSubmit} className="pe-form-container">

                            {/* TAB 1: GENERAL & CLIENT */}
                            {(activeTab === 'general' || activeTab === 'all') && (
                                <>
                                    {/* General Information Card */}
                                    <div className="pe-card">
                                        <div className="pe-card-header">
                                            <div className="pe-card-title-group">
                                                <div className="pe-card-icon-wrap indigo">
                                                    <Sparkles size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="pe-card-title">General Information</h3>
                                                    <p className="pe-card-desc">Define project identity and overarching notes</p>
                                                </div>
                                            </div>
                                            <span className="pe-duration-chip">Step 1 of 4</span>
                                        </div>

                                        <div className="pe-form-grid">
                                            <div className="pe-field-group pe-col-span-2">
                                                <label className="pe-label">
                                                    Event Project Name <span className="pe-label-required">*</span>
                                                </label>
                                                <input
                                                    required
                                                    name="eventName"
                                                    className="pe-input"
                                                    placeholder="e.g. Festival Carthage VIP Setup / Corporate Gala 2024"
                                                    value={formData.eventName || ''}
                                                    onChange={handleChange}
                                                    disabled={isLocked || formData.status === 'Done'}
                                                    autoFocus={!project}
                                                />
                                            </div>

                                            <div className="pe-field-group pe-col-span-2">
                                                <label className="pe-label">
                                                    Project Notes & Scope of Work
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    className="pe-input"
                                                    rows={3}
                                                    placeholder="Add special instructions, client requests, or technical considerations..."
                                                    value={formData.notes || ''}
                                                    onChange={handleChange}
                                                    style={{ resize: 'vertical' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Client Information Card */}
                                    <div className="pe-card">
                                        <div className="pe-card-header">
                                            <div className="pe-card-title-group">
                                                <div className="pe-card-icon-wrap blue">
                                                    <Building size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="pe-card-title">Client Details</h3>
                                                    <p className="pe-card-desc">Link existing client profile or enter custom billing details</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pe-form-grid">
                                            <div className="pe-field-group pe-col-span-2">
                                                <label className="pe-label">
                                                    Search Existing Client Database
                                                </label>
                                                <select
                                                    className="pe-input"
                                                    value={formData.clientId || ''}
                                                    onChange={handleClientSelect}
                                                    disabled={formData.status !== 'Draft' && formData.status !== 'Quote' && !['Founder', 'Manager'].includes(user?.role)}
                                                >
                                                    <option value="">-- Choose registered client or type below --</option>
                                                    {clients.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.customId ? `[${c.customId}] ` : ''}{c.name} {c.phone ? `(${c.phone})` : ''}
                                                        </option>
                                                    ))}
                                                    {formData.clientId && !clients.some(c => c._id === formData.clientId) && formData.client?.name && (
                                                        <option value={formData.clientId}>
                                                            {formData.client.name} (Assigned)
                                                        </option>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="pe-field-group pe-col-span-2">
                                                <label className="pe-label">
                                                    Legal Client / Entity Name <span className="pe-label-required">*</span>
                                                </label>
                                                <input
                                                    name="client.name"
                                                    className="pe-input"
                                                    placeholder="Client company or organizer name"
                                                    value={formData.client?.name || ''}
                                                    onChange={handleChange}
                                                    disabled={formData.status !== 'Draft' && formData.status !== 'Quote' && !['Founder', 'Manager'].includes(user?.role)}
                                                />
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    <User size={13} /> Contact Person
                                                </label>
                                                <input
                                                    placeholder="Full name of representative"
                                                    name="client.contactPerson"
                                                    className="pe-input"
                                                    value={formData.client?.contactPerson || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    <Phone size={13} /> Direct Phone Number
                                                </label>
                                                <input
                                                    placeholder="+216 -- --- ---"
                                                    name="client.phone"
                                                    className="pe-input"
                                                    value={formData.client?.phone || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    <FileText size={13} /> Matricule Fiscal / Tax ID
                                                </label>
                                                <input
                                                    placeholder="e.g. 1234567/A/M/000"
                                                    name="client.taxId"
                                                    className="pe-input"
                                                    value={formData.client?.taxId || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="pe-field-group pe-col-span-2">
                                                <label className="pe-label">
                                                    <MapPin size={13} /> Headquarters / Billing Address
                                                </label>
                                                <input
                                                    placeholder="Full corporate billing address"
                                                    name="client.address"
                                                    className="pe-input"
                                                    value={formData.client?.address || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 2: SCHEDULE & LOGISTICS */}
                            {(activeTab === 'logistics' || activeTab === 'all') && (
                                <div className="pe-card">
                                    <div className="pe-card-header">
                                        <div className="pe-card-title-group">
                                            <div className="pe-card-icon-wrap emerald">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <h3 className="pe-card-title">Schedule & Venue Logistics</h3>
                                                <p className="pe-card-desc">Specify setup periods, return targets, and physical event venue</p>
                                            </div>
                                        </div>
                                        {daysCount && (
                                            <span className="pe-duration-chip">
                                                <Clock size={12} /> {daysCount} Day{daysCount > 1 ? 's' : ''} Duration
                                            </span>
                                        )}
                                    </div>

                                    <div className="pe-form-grid">
                                        <div className="pe-field-group">
                                            <label className="pe-label">
                                                Event Start / Setup Date
                                            </label>
                                            <input
                                                type="date"
                                                name="dates.start"
                                                className="pe-input"
                                                value={formData.dates?.start || ''}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="pe-field-group">
                                            <label className="pe-label">
                                                Event End / Return Date
                                            </label>
                                            <input
                                                type="date"
                                                name="dates.end"
                                                className="pe-input"
                                                value={formData.dates?.end || ''}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="pe-field-group pe-col-span-2">
                                            <label className="pe-label">
                                                <MapPin size={13} /> Setup Location / Venue Name
                                            </label>
                                            <input
                                                placeholder="e.g. Carthage Amphitheatre, Laico Hotel Grand Ballroom"
                                                name="siteName"
                                                className="pe-input"
                                                value={formData.siteName || ''}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="pe-field-group pe-col-span-2">
                                            <label className="pe-label">
                                                Logistics Access Address & Instructions
                                            </label>
                                            <input
                                                placeholder="Full street address, delivery bay entrance or GPS coordinates"
                                                name="siteAddress"
                                                className="pe-input"
                                                value={formData.siteAddress || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: TEAM & TRANSPORT */}
                            {(activeTab === 'team' || activeTab === 'all') && (
                                <>
                                    {/* Supervisor & Transport */}
                                    <div className="pe-card">
                                        <div className="pe-card-header">
                                            <div className="pe-card-title-group">
                                                <div className="pe-card-icon-wrap amber">
                                                    <Truck size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="pe-card-title">Leadership & Fleet Logistics</h3>
                                                    <p className="pe-card-desc">Assign site supervisor, dispatch driver and transport vehicle</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pe-form-grid">
                                            <div className="pe-field-group pe-col-span-2">
                                                <label className="pe-label" style={{ color: '#818cf8', fontWeight: '700' }}>
                                                    <Shield size={14} /> Chef Chantier (Site Operations Supervisor)
                                                </label>
                                                <select
                                                    className="pe-input"
                                                    name="team.chefChantier"
                                                    value={formData.team?.chefChantier || ''}
                                                    onChange={handleChange}
                                                    style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
                                                >
                                                    <option value="">-- Select Chef Chantier --</option>
                                                    {users.map(u => (
                                                        <option key={u._id} value={u._id}>
                                                            {u.name} ({u.role || 'Staff'})
                                                        </option>
                                                    ))}
                                                    {formData.team?.chefChantier && !users.some(u => u._id === formData.team.chefChantier) && (
                                                        <option value={formData.team.chefChantier}>
                                                            Assigned Supervisor
                                                        </option>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    <UserCheck size={13} /> Designated Driver
                                                </label>
                                                <select
                                                    className="pe-input"
                                                    value={formData.transport?.driverName || ''}
                                                    onChange={e => {
                                                        const d = drivers.find(drv => drv.name === e.target.value);
                                                        setFormData(p => ({
                                                            ...p,
                                                            transport: {
                                                                ...(p.transport || {}),
                                                                driverName: e.target.value,
                                                                driverLicense: d ? (d.cin || d.licenseNumber || '') : (p.transport?.driverLicense || '')
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">-- Choose Fleet Driver --</option>
                                                    {drivers.map(d => (
                                                        <option key={d._id} value={d.name}>
                                                            {d.name} {d.phone ? `(${d.phone})` : ''}
                                                        </option>
                                                    ))}
                                                    {formData.transport?.driverName && !drivers.some(d => d.name === formData.transport.driverName) && (
                                                        <option value={formData.transport.driverName}>
                                                            {formData.transport.driverName} (Assigned)
                                                        </option>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    Driver License / CIN
                                                </label>
                                                <input
                                                    placeholder="CIN or License Number"
                                                    name="transport.driverLicense"
                                                    className="pe-input"
                                                    value={formData.transport?.driverLicense || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    <Truck size={13} /> Transport Vehicle
                                                </label>
                                                <select
                                                    className="pe-input"
                                                    value={formData.transport?.vehicleModel || ''}
                                                    onChange={e => {
                                                        const v = vehicles.find(veh => veh.model === e.target.value);
                                                        setFormData(p => ({
                                                            ...p,
                                                            transport: {
                                                                ...(p.transport || {}),
                                                                vehicleModel: e.target.value,
                                                                vehiclePlate: v ? (v.plateNumber || '') : (p.transport?.vehiclePlate || '')
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">-- Choose Vehicle --</option>
                                                    {vehicles.map(v => (
                                                        <option key={v._id} value={v.model}>
                                                            {v.model} ({v.plateNumber})
                                                        </option>
                                                    ))}
                                                    {formData.transport?.vehicleModel && !vehicles.some(v => v.model === formData.transport.vehicleModel) && (
                                                        <option value={formData.transport.vehicleModel}>
                                                            {formData.transport.vehicleModel} (Assigned)
                                                        </option>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="pe-field-group">
                                                <label className="pe-label">
                                                    Vehicle Registration Plate
                                                </label>
                                                <input
                                                    placeholder="Registration Plate Number"
                                                    name="transport.vehiclePlate"
                                                    className="pe-input"
                                                    value={formData.transport?.vehiclePlate || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Technician Crew Assignment */}
                                    <div className="pe-card">
                                        <div className="pe-card-header">
                                            <div className="pe-card-title-group">
                                                <div className="pe-card-icon-wrap violet">
                                                    <Users size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="pe-card-title">Technicians & Crew Manifest</h3>
                                                    <p className="pe-card-desc">Select qualified staff members for deployment</p>
                                                </div>
                                            </div>
                                            <span className="pe-tab-badge">
                                                {formData.assignedUsers?.length || 0} Assigned
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                            <select
                                                className="pe-input"
                                                style={{ maxWidth: '240px' }}
                                                value={filterSkill}
                                                onChange={e => setFilterSkill(e.target.value)}
                                            >
                                                <option value="">-- Filter by Technical Skill --</option>
                                                {[...new Set(users.flatMap(u => u.technicalSkills || []))].filter(Boolean).sort().map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={showOnlyAvailable}
                                                    onChange={e => setShowOnlyAvailable(e.target.checked)}
                                                />
                                                Show Available Only
                                            </label>
                                        </div>

                                        <div className="pe-users-grid">
                                            {users.filter(u => {
                                                const isBusy = availability.unavailableUsers?.includes(u._id) || availability.restWarnings?.find(w => w.userId === u._id);
                                                if (showOnlyAvailable && isBusy) return false;
                                                if (filterSkill && (!u.technicalSkills || !u.technicalSkills.includes(filterSkill))) return false;
                                                return true;
                                            }).map(u => {
                                                const uId = u._id.toString();
                                                const isSelected = (formData.assignedUsers || []).some(id =>
                                                    (typeof id === 'object' ? id._id?.toString() : id?.toString()) === uId
                                                );
                                                const isBusy = availability.unavailableUsers?.includes(u._id);
                                                const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

                                                return (
                                                    <div
                                                        key={u._id}
                                                        className={`pe-user-card ${isSelected ? 'selected' : ''} ${isBusy ? 'busy' : ''}`}
                                                        onClick={async () => {
                                                            if (isBusy && !isSelected) {
                                                                const ok = await confirm({
                                                                    title: "Technicien indisponible",
                                                                    message: `${u.name} est noté comme occupé dans ce créneau horaire. Voulez-vous l'assigner malgré tout ?`,
                                                                    type: "warning",
                                                                    confirmText: "Assigner",
                                                                    cancelText: "Annuler"
                                                                });
                                                                if (!ok) return;
                                                            }
                                                            setFormData(p => {
                                                                const currentList = (p.assignedUsers || []).map(id => typeof id === 'object' ? id._id?.toString() : id?.toString());
                                                                const already = currentList.includes(uId);
                                                                return {
                                                                    ...p,
                                                                    assignedUsers: already
                                                                        ? currentList.filter(id => id !== uId)
                                                                        : [...currentList, uId]
                                                                };
                                                            });
                                                        }}
                                                    >
                                                        <div className="pe-user-avatar">
                                                            {isSelected ? <Check size={14} strokeWidth={3} /> : initials}
                                                        </div>
                                                        <div className="pe-user-info">
                                                            <div className="pe-user-name" title={u.name}>{u.name}</div>
                                                            <div className="pe-user-role">{u.role || 'Technician'}</div>
                                                        </div>
                                                        <span
                                                            className={`pe-user-status-dot ${isBusy ? 'busy' : 'available'}`}
                                                            title={isBusy ? 'Busy during event dates' : 'Available'}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 4: EQUIPMENT STORE */}
                            {(activeTab === 'equipment' || activeTab === 'all') && (
                                <div className="pe-card">
                                    <div className="pe-card-header">
                                        <div className="pe-card-title-group">
                                            <div className="pe-card-icon-wrap indigo">
                                                <Box size={18} />
                                            </div>
                                            <div>
                                                <h3 className="pe-card-title">Inventory Catalog</h3>
                                                <p className="pe-card-desc">Browse warehouse stock or subcontracted gear</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search & Source Switcher */}
                                    <div className="pe-equip-controls">
                                        <div className="pe-search-wrap">
                                            <Search size={16} className="pe-search-icon" />
                                            <input
                                                type="text"
                                                className="pe-search-input"
                                                placeholder="Search equipment by name, category, or model..."
                                                value={itemSearch}
                                                onChange={e => setItemSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="pe-source-toggle">
                                            <button
                                                type="button"
                                                className={`pe-source-btn internal ${itemSource === 'internal' ? 'active' : ''}`}
                                                onClick={() => setItemSource('internal')}
                                            >
                                                Bright Warehouse ({availableItems.length})
                                            </button>
                                            <button
                                                type="button"
                                                className={`pe-source-btn subcontracted ${itemSource === 'subcontracted' ? 'active' : ''}`}
                                                onClick={() => setItemSource('subcontracted')}
                                            >
                                                Extra / External ({subcontractedItems.length})
                                            </button>
                                        </div>
                                    </div>

                                    {/* Catalog Grid */}
                                    <div className="pe-equip-list">
                                        {(() => {
                                            const list = itemSource === 'internal' ? availableItems : subcontractedItems;
                                            const filtered = list.filter(i => (i.name || '').toLowerCase().includes(itemSearch.toLowerCase()));

                                            if (filtered.length === 0) {
                                                return (
                                                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                                        No matching equipment found.
                                                    </div>
                                                );
                                            }

                                            return filtered.map(item => {
                                                const availData = availability.itemAvailability[item._id] || {};
                                                const stockLeft = availData.available !== undefined ? availData.available : item.quantity;
                                                const isLow = stockLeft <= 2;
                                                const isAdded = formData.items?.some(i => (typeof i.inventoryItem === 'object' ? i.inventoryItem?._id : i.inventoryItem) === item._id);

                                                return (
                                                    <div key={item._id} className="pe-equip-card">
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div className="pe-equip-title" title={item.name}>
                                                                {item.name}
                                                            </div>
                                                            <div className={`pe-equip-stock ${isLow ? 'low' : ''}`}>
                                                                <span>Available:</span>
                                                                <strong style={{ color: stockLeft > 0 ? '#34d399' : '#ef4444' }}>
                                                                    {stockLeft} {item.unit || 'units'}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="pe-add-btn"
                                                            onClick={() => handleAddItem(item)}
                                                            disabled={stockLeft <= 0 && itemSource === 'internal'}
                                                            style={{
                                                                background: isAdded ? 'linear-gradient(135deg, #10b981, #059669)' : undefined
                                                            }}
                                                        >
                                                            {isAdded ? <Check size={13} /> : <Plus size={13} />}
                                                            <span>{isAdded ? 'Add More' : 'Add'}</span>
                                                        </button>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Guided Navigation Footer in Tabs */}
                            {activeTab !== 'all' && (
                                <div className="pe-tab-footer">
                                    {currentTabIndex > 0 ? (
                                        <button
                                            type="button"
                                            className="pe-btn-nav"
                                            onClick={() => setActiveTab(tabOrder[currentTabIndex - 1])}
                                        >
                                            <ArrowLeft size={15} /> Back
                                        </button>
                                    ) : <div />}

                                    {currentTabIndex < tabOrder.length - 2 ? (
                                        <button
                                            type="button"
                                            className="pe-btn-nav primary"
                                            onClick={() => setActiveTab(tabOrder[currentTabIndex + 1])}
                                        >
                                            Next Step <ArrowRight size={15} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="pe-btn-nav primary"
                                            onClick={() => setActiveTab('equipment')}
                                        >
                                            Review Equipment <Box size={15} />
                                        </button>
                                    )}
                                </div>
                            )}

                        </form>
                    </div>

                    {/* Right Panel: Project Snapshot & Equipment Manifest */}
                    <div className="pe-sidebar">
                        <div className="pe-sidebar-content">

                            {/* Live Project Snapshot */}
                            <div className="pe-snapshot-card">
                                <div className="pe-snapshot-title">
                                    <Sparkles size={16} color="#818cf8" />
                                    <span>Project Snapshot</span>
                                </div>
                                <div className="pe-snapshot-row">
                                    <span>Event:</span>
                                    <strong>{formData.eventName || 'Untitled Event'}</strong>
                                </div>
                                <div className="pe-snapshot-row">
                                    <span>Client:</span>
                                    <strong>{formData.client?.name || 'Not assigned'}</strong>
                                </div>
                                <div className="pe-snapshot-row">
                                    <span>Dates:</span>
                                    <strong>
                                        {formData.dates?.start ? `${formData.dates.start} → ${formData.dates?.end || '...'}` : 'Dates pending'}
                                    </strong>
                                </div>
                                <div className="pe-snapshot-row">
                                    <span>Venue:</span>
                                    <strong>{formData.siteName || 'TBD'}</strong>
                                </div>
                                <div className="pe-snapshot-row">
                                    <span>Supervisor:</span>
                                    <strong>
                                        {users.find(u => u._id === formData.team?.chefChantier)?.name || 'None'}
                                    </strong>
                                </div>
                                <div className="pe-snapshot-row">
                                    <span>Crew Assigned:</span>
                                    <strong>{(formData.assignedUsers?.length || 0) + (formData.team?.chefChantier ? 1 : 0)} members</strong>
                                </div>
                            </div>

                            {/* Selected Equipment Cart */}
                            <div className="pe-cart-header">
                                <h4 className="pe-cart-title">
                                    Reserved Equipment ({formData.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0})
                                </h4>
                                {formData.items?.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, items: [] }))}
                                        style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {(!formData.items || formData.items.length === 0) ? (
                                <div className="pe-cart-empty">
                                    <Box size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                                    <div>No equipment reserved yet</div>
                                    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                                        Browse the Equipment tab to add items to this manifest
                                    </div>
                                </div>
                            ) : (
                                <div className="pe-cart-list">
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="pe-cart-item">
                                            <div className="pe-cart-item-top">
                                                <span className="pe-cart-item-name">{item.name}</span>
                                                <button
                                                    type="button"
                                                    className="pe-cart-del-btn"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="pe-cart-item-bottom">
                                                <div className="pe-qty-control">
                                                    <button
                                                        type="button"
                                                        className="pe-qty-btn"
                                                        onClick={() => handleQuantityChange(idx, -1)}
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="pe-qty-val">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="pe-qty-btn"
                                                        onClick={() => handleQuantityChange(idx, 1)}
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                {item.source === 'subcontracted' && (
                                                    <span className="pe-tab-badge amber">
                                                        Subcontracted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* Bottom Actions Panel */}
                        <div className="pe-sidebar-actions">
                            {canAdvanceStatus && (
                                <>
                                    {formData.status === 'Draft' && (
                                        <button
                                            type="button"
                                            className="pe-btn-advance pickup"
                                            onClick={() => advanceStatus('Pickup')}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <CheckCircle2 size={15} /> Confirm & Release →
                                        </button>
                                    )}
                                    {formData.status === 'Pickup' && (
                                        <button
                                            type="button"
                                            className="pe-btn-advance return"
                                            onClick={() => advanceStatus('Return')}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <RotateCcw size={15} /> Mark Returned
                                        </button>
                                    )}
                                    {formData.status === 'Return' && (
                                        <button
                                            type="button"
                                            className="pe-btn-advance done"
                                            onClick={() => advanceStatus('Done')}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Flag size={15} /> Complete Project
                                        </button>
                                    )}
                                </>
                            )}

                            <button
                                type="submit"
                                form="projectForm"
                                className="pe-btn-save"
                                disabled={saving}
                            >
                                <Sparkles size={16} />
                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default ProjectEditor;
