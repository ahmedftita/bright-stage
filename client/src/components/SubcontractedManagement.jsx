import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { CONFIG } from '../config';
import SubcontractedModal from './SubcontractedModal';
import './SubcontractedManagement.css';
import { 
    Package, 
    Layers, 
    ExternalLink, 
    Hash, 
    DollarSign, 
    Save, 
    Plus, 
    ShoppingCart,
    Trash2,
    Briefcase,
    Search,
    Filter,
    Handshake,
    Building2,
    Banknote,
    Edit3
} from 'lucide-react';

const SubcontractedManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const confirm = useConfirm();
    const { showSuccess, showError } = useNotification();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', brand: '', model: '', category: '', quantity: 0, costPerDay: 0, provider: '', notes: ''
    });

    const API_URL = `${CONFIG.API_URL}/subcontracted`;

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setItems(res.data);
        } catch (err) {
            console.error(err);
            showError("Failed to synchronize subcontracting data", "Network Error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await axios.put(`${API_URL}/${editItem._id}`, formData);
                showSuccess("Subcontracted resource updated", "Success");
            } else {
                await axios.post(API_URL, formData);
                showSuccess("External resource registered", "Success");
            }
            setShowModal(false);
            setEditItem(null);
            loadItems();
        } catch (err) {
            showError("Transaction failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm('Are you sure you want to remove this subcontracted asset?');
        if (!ok) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            showSuccess("Resource removed from database", "Logistics");
            loadItems();
        } catch (err) {
            showError("Deletion failed");
        }
    };

    const handleConvertToInventory = async (id) => {
        const ok = await confirm('Transfer this item to internal warehouse inventory? It will be removed from subcontracting.');
        if (!ok) return;
        try {
            await axios.post(`${API_URL}/${id}/convert`);
            showSuccess("Resource integrated into internal inventory", "Fleet Expansion");
            loadItems();
        } catch (err) {
            showError("Transfer failed: " + (err.response?.data?.message || err.message));
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setFormData({
            ...item,
            name: item.name || '',
            brand: item.brand || '',
            model: item.model || '',
            category: item.category || 'Vidéo',
            quantity: item.quantity !== undefined ? item.quantity : 1,
            costPerDay: item.costPerDay !== undefined ? item.costPerDay : 0,
            provider: item.provider || '',
            notes: item.notes || ''
        });
        setShowModal(true);
    };

    const openCreate = () => {
        setEditItem(null);
        setFormData({ name: '', brand: '', model: '', category: 'Vidéo', quantity: 1, costPerDay: 0, provider: '', notes: '' });
        setShowModal(true);
    };

    const categories = ['All', 'Vidéo', 'Sonorisation', 'Lumière', 'Énergie', 'Structure'];

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.provider?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const totalUnits = items.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
    const totalDailyCost = items.reduce((acc, curr) => acc + ((parseFloat(curr.costPerDay) || 0) * (parseInt(curr.quantity) || 1)), 0);
    const uniqueProviders = new Set(items.map(i => i.provider).filter(Boolean)).size;

    const getCategoryBadgeStyle = (cat) => {
        switch (cat) {
            case 'Vidéo': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
            case 'Sonorisation': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
            case 'Lumière': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
            case 'Énergie': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
            case 'Structure': return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' };
            default: return { bg: 'rgba(255, 255, 255, 0.08)', text: '#cbd5e1', border: 'rgba(255, 255, 255, 0.15)' };
        }
    };

    return (
        <div className="subcontract-container">
            {/* Header */}
            <div className="sc-header-bar">
                <div className="sc-header-info">
                    <div className="sc-header-icon-box">
                        <Handshake size={26} />
                    </div>
                    <div className="sc-header-texts">
                        <h1 className="sc-header-title">
                            Subcontracting & External Resources
                        </h1>
                        <p className="sc-header-subtitle">
                            Third-party audio/light rentals, supplier agreements, and daily retention rates
                        </p>
                    </div>
                </div>

                <div className="sc-header-controls">
                    <div className="sc-search-wrapper">
                        <Search className="sc-search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search equipment or supplier..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="sc-search-input"
                        />
                    </div>

                    <button
                        onClick={openCreate}
                        className="sc-btn-create"
                    >
                        <Plus size={18} /> Add External Asset
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="sc-metrics-grid">
                <div className="sc-metric-card">
                    <div className="sc-metric-icon blue">
                        <Package size={22} />
                    </div>
                    <div>
                        <div className="sc-metric-value">{items.length} ({totalUnits} pcs)</div>
                        <div className="sc-metric-label">Subcontracted Gear</div>
                    </div>
                </div>

                <div className="sc-metric-card">
                    <div className="sc-metric-icon amber">
                        <Banknote size={22} />
                    </div>
                    <div>
                        <div className="sc-metric-value amber">{totalDailyCost.toFixed(3)} TND</div>
                        <div className="sc-metric-label">Total Daily Cost</div>
                    </div>
                </div>

                <div className="sc-metric-card">
                    <div className="sc-metric-icon green">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <div className="sc-metric-value green">{uniqueProviders} Partners</div>
                        <div className="sc-metric-label">Active Suppliers</div>
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="sc-filter-bar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`sc-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Desktop Table Container (>= 768px) */}
            <div className="sc-table-container">
                <div className="sc-table-scroll">
                    <table className="sc-table">
                        <thead>
                            <tr>
                                <th className="sc-th">Resource Matrix</th>
                                <th className="sc-th">Segment</th>
                                <th className="sc-th">Volume</th>
                                <th className="sc-th">Daily Rate</th>
                                <th className="sc-th">Supplier / Provider</th>
                                <th className="sc-th actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '70px 20px', textAlign: 'center', color: '#818cf8', fontWeight: '700' }}>
                                        Syncing external datastream...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '70px 20px', textAlign: 'center' }}>
                                        <div style={{ color: '#475569', marginBottom: '12px' }}><Package size={44} /></div>
                                        <p style={{ color: '#64748b', margin: 0, fontWeight: '700', fontSize: '14px' }}>No subcontracted resources found matching criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const catStyle = getCategoryBadgeStyle(item.category);
                                    return (
                                        <tr key={item._id} className="sc-tr">
                                            <td className="sc-td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{
                                                        width: '38px', height: '38px', borderRadius: '12px',
                                                        background: 'rgba(99, 102, 241, 0.12)',
                                                        border: '1px solid rgba(99, 102, 241, 0.25)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#818cf8', flexShrink: 0
                                                    }}>
                                                        <Layers size={16} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '14.5px' }}>{item.name}</div>
                                                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{item.brand || 'No brand'} {item.model ? `• ${item.model}` : ''}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="sc-td">
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                                                    background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`
                                                }}>
                                                    {item.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="sc-td">
                                                <span style={{ color: '#fff', fontWeight: '800', fontSize: '14px' }}>
                                                    {item.quantity} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>pcs</span>
                                                </span>
                                            </td>
                                            <td className="sc-td">
                                                <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '14px' }}>
                                                    {item.costPerDay} <span style={{ fontSize: '10px', color: '#94a3b8' }}>TND/day</span>
                                                </span>
                                            </td>
                                            <td className="sc-td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', fontWeight: '600' }}>
                                                    <Briefcase size={14} color="#818cf8" /> {item.provider || '—'}
                                                </div>
                                            </td>
                                            <td className="sc-td" style={{ textAlign: 'right' }}>
                                                <div className="sc-actions-group">
                                                    <button
                                                        onClick={() => handleConvertToInventory(item._id)}
                                                        title="Transfer to Warehouse Stock"
                                                        className="sc-btn-stock"
                                                    >
                                                        <ShoppingCart size={13} /> To Stock
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        title="Edit Metadata"
                                                        className="sc-btn-icon"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        title="Remove"
                                                        className="sc-btn-icon delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile & Small Screens Cards View (< 768px) */}
            <div className="sc-cards-view">
                {loading ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#818cf8', fontWeight: '700' }}>
                        Syncing external datastream...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(26, 27, 40, 0.6)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Package size={40} style={{ color: '#475569', marginBottom: '10px' }} />
                        <p style={{ color: '#64748b', margin: 0, fontWeight: '700', fontSize: '13.5px' }}>No subcontracted resources found</p>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        const catStyle = getCategoryBadgeStyle(item.category);
                        return (
                            <div key={item._id} className="sc-card-item">
                                <div className="sc-card-top">
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                                        background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`
                                    }}>
                                        {item.category || 'General'}
                                    </span>
                                    <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px' }}>
                                        {item.quantity} <span style={{ fontSize: '10px', color: '#94a3b8' }}>pcs</span>
                                    </span>
                                </div>

                                <div className="sc-card-body">
                                    <div className="sc-card-title">{item.name}</div>
                                    <div className="sc-card-subtitle">{item.brand || 'No brand'} {item.model ? `• ${item.model}` : ''}</div>
                                    <div className="sc-card-rates-row">
                                        <div className="sc-rate-badge">
                                            {item.costPerDay} TND / day
                                        </div>
                                        <div className="sc-provider-info">
                                            <Briefcase size={13} color="#818cf8" />
                                            <span>{item.provider || 'No provider'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="sc-card-actions">
                                    <button
                                        onClick={() => handleConvertToInventory(item._id)}
                                        title="Transfer to Warehouse Stock"
                                        className="sc-btn-stock"
                                    >
                                        <ShoppingCart size={14} /> To Stock
                                    </button>
                                    <button
                                        onClick={() => openEdit(item)}
                                        title="Edit Metadata"
                                        className="sc-btn-icon"
                                    >
                                        <Edit3 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        title="Remove"
                                        className="sc-btn-icon delete"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Ultra-Modern & Creative Subcontracted Asset Modal */}
            <SubcontractedModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSave}
                editItem={editItem}
            />
        </div>
    );
};

export default SubcontractedManagement;
