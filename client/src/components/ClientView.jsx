import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { Users, Building2, Scale, Search, Plus, Eye, Edit3, Trash2 } from 'lucide-react';
import './Logistics.css';
import './ClientView.css';
import ClientModal from './ClientModal';
import { CONFIG } from '../config';

const ClientView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [formData, setFormData] = useState({
        name: '', customId: '', type: 'Société', matriculeFiscal: '', email: '', phone: '', address: '', contactPerson: '', notes: '', contacts: []
    });
    const API_URL = CONFIG.API_URL;

    const canEdit = ['Founder', 'Manager'].includes(user?.role);
    const isSiteManager = user?.role?.toLowerCase() === 'site manager';

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/clients`);
            setClients(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly || !canEdit) return;
        try {
            if (formData._id) {
                await axios.put(`${API_URL}/clients/${formData._id}`, formData);
                showSuccess("Client information updated", "CRM");
            } else {
                await axios.post(`${API_URL}/clients`, formData);
                showSuccess("New client registered", "CRM");
            }
            setShowModal(false);
            fetchClients();
        } catch (err) {
            showError(err.response?.data?.error || err.message, "System Error");
        }
    };

    const handleOpenCreate = () => {
        const nextNum = clients.length + 1;
        const year = new Date().getFullYear();
        setFormData({
            name: '',
            customId: `CLI-${year}-${String(nextNum).padStart(2, '0')}`,
            type: 'Société',
            matriculeFiscal: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            paymentTerms: 30,
            contactPerson: '',
            notes: '',
            contacts: []
        });
        setIsReadOnly(false);
        setShowModal(true);
    };

    const handleView = (client) => {
        setFormData({
            ...client,
            contacts: client.contacts || [],
            paymentTerms: client.paymentTerms !== undefined ? client.paymentTerms : 30
        });
        setIsReadOnly(true);
        setShowModal(true);
    };

    const handleEdit = (client) => {
        setFormData({
            ...client,
            contacts: client.contacts || [],
            paymentTerms: client.paymentTerms !== undefined ? client.paymentTerms : 30
        });
        setIsReadOnly(!canEdit);
        setShowModal(true);
    };

    const switchToEdit = () => { if (canEdit) setIsReadOnly(false); };

    const handleDelete = async (id) => {
        const ok = await confirm("Delete this client record permanently?");
        if (!ok) return;
        try {
            await axios.delete(`${API_URL}/clients/${id}`);
            showSuccess("Client deleted", "CRM");
            fetchClients();
        } catch (err) { showError("Failed to delete", "Error"); }
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.matriculeFiscal?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || c.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalClients = clients.length;
    const companyCount = clients.filter(c => c.type === 'Société').length;
    const taxRegisteredCount = clients.filter(c => c.matriculeFiscal).length;

    const getTypeColor = (type) => {
        switch (type) {
            case 'Société': return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
            case 'Particulier': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
            case 'Association': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
            default: return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
        }
    };

    return (
        <div className="cv-container">
            {/* Header */}
            <div className="cv-header">
                <div className="cv-title-row">
                    <div className="cv-icon-badge">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="cv-page-title">Client Directory &amp; CRM</h1>
                        <p className="cv-page-sub">Corporate accounts, fiscal registries, and multi-channel points of contact</p>
                    </div>
                </div>

                <div className="cv-header-right">
                    <div className="cv-search-wrap">
                        <span className="cv-search-icon"><Search size={16} /></span>
                        <input
                            className="cv-search-input"
                            placeholder="Search by name, ID or tax..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canEdit && (
                        <button className="cv-add-btn" onClick={handleOpenCreate}>
                            <Plus size={16} /> Register New Client
                        </button>
                    )}
                </div>
            </div>

            {/* Quick KPI Metrics */}
            <div className="cv-kpi-grid">
                <div className="cv-kpi-card">
                    <div className="cv-kpi-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="cv-kpi-val" style={{ color: '#fff' }}>{totalClients}</div>
                        <div className="cv-kpi-label">Registered Accounts</div>
                    </div>
                </div>

                <div className="cv-kpi-card">
                    <div className="cv-kpi-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div className="cv-kpi-val" style={{ color: '#60a5fa' }}>{companyCount}</div>
                        <div className="cv-kpi-label">B2B Companies</div>
                    </div>
                </div>

                <div className="cv-kpi-card">
                    <div className="cv-kpi-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                        <Scale size={20} />
                    </div>
                    <div>
                        <div className="cv-kpi-val" style={{ color: '#34d399' }}>{taxRegisteredCount}</div>
                        <div className="cv-kpi-label">Fiscal Verified</div>
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="cv-filter-bar">
                {['All', 'Société', 'Particulier', 'Association', 'Public'].map(type => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`cv-filter-pill ${typeFilter === type ? 'active' : 'inactive'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Client Grid */}
            {loading ? (
                <div className="cv-loading">
                    <div className="spinner"></div>
                    <p style={{ marginTop: '16px' }}>Loading client directory...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="cv-empty">
                    <Users size={36} color="#334155" style={{ marginBottom: '12px' }} />
                    <p>No clients found matching your search.</p>
                </div>
            ) : (
                <div className="cv-grid">
                    {filteredClients.map(client => {
                        const typeBadge = getTypeColor(client.type);
                        return (
                            <div
                                key={client._id}
                                className="cv-client-card"
                                onClick={() => handleView(client)}
                            >
                                <div>
                                    {/* Card Top */}
                                    <div className="cv-card-top">
                                        <div className="cv-card-identity">
                                            <div className="cv-card-avatar">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h3 className="cv-card-name">{client.name}</h3>
                                                <span className="cv-card-id">{client.customId || 'CUS-ID'}</span>
                                            </div>
                                        </div>
                                        <span
                                            className="cv-type-badge"
                                            style={{ background: typeBadge.bg, color: typeBadge.text, border: `1px solid ${typeBadge.border}` }}
                                        >
                                            {client.type || 'Société'}
                                        </span>
                                    </div>

                                    {/* Info Block */}
                                    <div className="cv-card-info">
                                        <div className="cv-info-row">
                                            <span className="cv-info-label">Contact</span>
                                            <span className="cv-info-value">{client.contactPerson || '—'}</span>
                                        </div>
                                        <div className="cv-info-row">
                                            <span className="cv-info-label">Phone</span>
                                            <span className="cv-info-value" style={{ color: '#34d399' }}>{client.phone || '—'}</span>
                                        </div>
                                        {client.matriculeFiscal && (
                                            <div className="cv-info-row">
                                                <span className="cv-info-label">Tax ID</span>
                                                <span className="cv-info-value" style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{client.matriculeFiscal}</span>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="cv-info-row">
                                                <span className="cv-info-label">Email</span>
                                                <span className="cv-info-value" style={{ color: '#94a3b8', fontSize: '11px' }}>{client.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="cv-card-actions">
                                    {isSiteManager ? (
                                        <button
                                            className="cv-action-main"
                                            onClick={(e) => { e.stopPropagation(); handleView(client); }}
                                        >
                                            <Eye size={14} /> Show
                                        </button>
                                    ) : (
                                        <button
                                            className="cv-action-main"
                                            onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                                        >
                                            <Edit3 size={14} /> Edit
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            className="cv-action-del"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Client Modal */}
            <ClientModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isReadOnly={isReadOnly}
                canEdit={canEdit}
                switchToEdit={switchToEdit}
                clientsCount={clients.length}
            />
        </div>
    );
};

export default ClientView;
