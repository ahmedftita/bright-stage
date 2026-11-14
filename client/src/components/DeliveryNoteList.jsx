import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import DeliveryNoteForm from './DeliveryNoteForm';
import './Logistics.css';
import './DeliveryNoteList.css';
import { FileText, Download, Edit3, Trash2, Plus, Search, CheckCircle2, Clock, Building2, Package, RotateCcw, Sparkles, MapPin, Calendar, Truck } from 'lucide-react';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DeliveryNoteList = () => {
    const { user, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();

    const canAccess = ['Founder', 'Manager', 'Site Manager'].includes(user?.role);
    const canCreate = ['Founder', 'Manager', 'Site Manager'].includes(user?.role);

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [showCompanySelect, setShowCompanySelect] = useState(false);
    const [activeNote, setActiveNote] = useState(null);
    const [documentType, setDocumentType] = useState('bl');

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await axios.get(`${API_URL}/delivery-notes`);
            setNotes(res.data);
        } catch (err) {
            console.error("Error fetching notes:", err);
            if (err.response?.status === 403) showError("Unauthorized access", "Auth Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm("Delete this Delivery Note permanently?");
        if (!ok) return;
        try {
            await axios.delete(`${API_URL}/delivery-notes/${id}`);
            showSuccess("Registry entry deleted", "Logistics");
            fetchNotes();
        } catch (err) {
            showError("Deletion failed", "Error");
        }
    };

    const handleDownloadPdf = async (id, number, companyId = 'bright', type = 'bl') => {
        showSuccess(`Preparing ${type === 'return' ? 'Bon de Retour' : 'BL'} PDF...`, "System");
        try {
            const authToken = token || localStorage.getItem('token');
            const prefix = type === 'return' ? 'BR' : 'BL';
            const filename = `${prefix}-${number}.pdf`;
            const downloadUrl = `${API_URL}/delivery-notes/${id}/pdf?company=${companyId}&type=${type}&token=${authToken}`;

            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                const result = await ipcRenderer.invoke('download-pdf', { url: downloadUrl, filename });
                if (result.success) {
                    showSuccess(`PDF enregistré: ${filename}`, "Done");
                    return;
                }
                const extResult = await ipcRenderer.invoke('open-pdf-external', { url: downloadUrl });
                if (extResult.success) {
                    showSuccess(`PDF ouvert dans le navigateur`, "Done");
                    return;
                }
            }

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.src = downloadUrl;
            setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 30000);

        } catch (err) {
            console.error('PDF download error:', err);
            showError("PDF generation failed: " + err.message, "Error");
        }
    };

    const openCreateModal = () => {
        setEditingNoteId(null);
        setShowModal(true);
    };

    const openEditModal = (id) => {
        setEditingNoteId(id);
        setShowModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.project?.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || n.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalValidated = notes.filter(n => n.status?.toLowerCase() === 'validated').length;
    const totalDraft = notes.filter(n => n.status?.toLowerCase() === 'draft').length;

    if (!canAccess) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Access Denied</div>;

    const getStatusClass = (status) => {
        const s = status?.toLowerCase();
        if (s === 'validated') return 'validated';
        if (s === 'cancelled') return 'cancelled';
        return 'draft';
    };

    return (
        <div className="delivery-notes-wrapper">
            {/* Action Bar Header */}
            <div className="dn-header-bar">
                <div className="dn-header-info">
                    <div className="dn-header-icon-box">
                        <FileText size={26} />
                    </div>
                    <div className="dn-header-texts">
                        <h1 className="dn-header-title">
                            Dispatch & Delivery Notes (BL / BR)
                        </h1>
                        <p className="dn-header-subtitle">
                            Equipment exit manifests, site delivery notes, and return reconciliation
                        </p>
                    </div>
                </div>

                <div className="dn-header-controls">
                    <div className="dn-search-wrapper">
                        <Search className="dn-search-icon" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search BL#, project or driver..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="dn-search-input"
                        />
                    </div>
                    {canCreate && (
                        <button
                            onClick={openCreateModal}
                            className="dn-btn-create"
                        >
                            <Plus size={18} /> Generate Delivery Note
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="dn-metrics-grid">
                <div className="dn-metric-card">
                    <div className="dn-metric-icon blue">
                        <FileText size={22} />
                    </div>
                    <div>
                        <div className="dn-metric-value">{notes.length}</div>
                        <div className="dn-metric-label">Total Manifests</div>
                    </div>
                </div>

                <div className="dn-metric-card">
                    <div className="dn-metric-icon green">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <div className="dn-metric-value green">{totalValidated}</div>
                        <div className="dn-metric-label">Dispatches Validated</div>
                    </div>
                </div>

                <div className="dn-metric-card">
                    <div className="dn-metric-icon amber">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="dn-metric-value amber">{totalDraft}</div>
                        <div className="dn-metric-label">Drafts In Preparation</div>
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="dn-filter-bar">
                {['All', 'Validated', 'Draft', 'Cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`dn-filter-pill ${statusFilter === status ? 'active' : ''}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Desktop Table View (Displays on screen widths >= 768px) */}
            <div className="dn-table-container">
                <div className="dn-table-scroll">
                    <table className="dn-table">
                        <thead>
                            <tr>
                                <th className="dn-th">Registry ID</th>
                                <th className="dn-th">Date</th>
                                <th className="dn-th">Event & Destination</th>
                                <th className="dn-th">Transport Agent</th>
                                <th className="dn-th">Status & Plate</th>
                                <th className="dn-th actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '70px 20px', textAlign: 'center', color: '#818cf8', fontWeight: '700' }}>
                                        Retrieving shipment logs...
                                    </td>
                                </tr>
                            ) : filteredNotes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '70px 20px', textAlign: 'center' }}>
                                        <FileText size={44} style={{ color: '#475569', marginBottom: '12px' }} />
                                        <p style={{ color: '#64748b', margin: 0, fontWeight: '700', fontSize: '14px' }}>No dispatch notes found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredNotes.map(note => (
                                    <tr key={note._id} className="dn-tr">
                                        <td className="dn-td">
                                            <div className="dn-id-badge">
                                                {note.number}
                                            </div>
                                        </td>
                                        <td className="dn-td">
                                            <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: '600' }}>{formatDate(note.date)}</div>
                                        </td>
                                        <td className="dn-td">
                                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{note.project?.eventName || 'General BL'}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: '600' }}>{note.project?.siteName || 'Individual Direct Shipment'}</div>
                                        </td>
                                        <td className="dn-td">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '10px',
                                                    background: 'rgba(99, 102, 241, 0.15)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#818cf8', fontWeight: '800', fontSize: '12px'
                                                }}>
                                                    {note.driverName?.charAt(0).toUpperCase() || 'D'}
                                                </div>
                                                <div style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600' }}>{note.driverName || 'External Driver'}</div>
                                            </div>
                                        </td>
                                        <td className="dn-td">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className={`dn-status-badge ${getStatusClass(note.status)}`}>
                                                    {(note.status || 'Draft').toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{note.vehiclePlate || 'No Plate'}</span>
                                            </div>
                                        </td>
                                        <td className="dn-td" style={{ textAlign: 'right' }}>
                                            <div className="dn-actions-group">
                                                <button
                                                    onClick={() => {
                                                        setActiveNote(note);
                                                        setDocumentType('bl');
                                                        setShowCompanySelect(true);
                                                    }}
                                                    title="Export PDF (BL / BR)"
                                                    className="dn-btn-pdf"
                                                >
                                                    <Download size={13} /> PDF
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(note._id)}
                                                    title="Modify Note"
                                                    className="dn-btn-icon"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(note._id)}
                                                    title="Remove"
                                                    className="dn-btn-icon delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile & Small Tablets Cards View (Displays on screen widths < 768px) */}
            <div className="dn-cards-view">
                {loading ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#818cf8', fontWeight: '700' }}>
                        Retrieving shipment logs...
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(26, 27, 40, 0.6)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <FileText size={40} style={{ color: '#475569', marginBottom: '10px' }} />
                        <p style={{ color: '#64748b', margin: 0, fontWeight: '700', fontSize: '13.5px' }}>No dispatch notes found</p>
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <div key={note._id} className="dn-card-item">
                            <div className="dn-card-top">
                                <div className="dn-card-top-left">
                                    <div className="dn-id-badge">
                                        {note.number}
                                    </div>
                                    <span className={`dn-status-badge ${getStatusClass(note.status)}`}>
                                        {(note.status || 'Draft').toUpperCase()}
                                    </span>
                                </div>
                                <div className="dn-card-date">
                                    {formatDate(note.date)}
                                </div>
                            </div>

                            <div className="dn-card-body">
                                <div className="dn-card-project-title">
                                    {note.project?.eventName || 'General BL'}
                                </div>
                                <div className="dn-card-destination">
                                    <MapPin size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                                    <span>{note.project?.siteName || 'Individual Direct Shipment'}</span>
                                </div>
                                <div className="dn-card-meta-row">
                                    <div className="dn-card-driver">
                                        <div className="dn-driver-avatar">
                                            {note.driverName?.charAt(0).toUpperCase() || 'D'}
                                        </div>
                                        <span className="dn-driver-name">{note.driverName || 'External Driver'}</span>
                                    </div>
                                    {note.vehiclePlate && (
                                        <span className="dn-plate-badge">{note.vehiclePlate}</span>
                                    )}
                                </div>
                            </div>

                            <div className="dn-card-actions">
                                <button
                                    onClick={() => {
                                        setActiveNote(note);
                                        setDocumentType('bl');
                                        setShowCompanySelect(true);
                                    }}
                                    className="dn-btn-pdf"
                                >
                                    <Download size={14} /> PDF
                                </button>
                                <button
                                    onClick={() => openEditModal(note._id)}
                                    title="Modify Note"
                                    className="dn-btn-icon"
                                >
                                    <Edit3 size={15} />
                                </button>
                                <button
                                    onClick={() => handleDelete(note._id)}
                                    title="Remove"
                                    className="dn-btn-icon delete"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Integration */}
            {showModal && (
                <DeliveryNoteForm 
                    id={editingNoteId} 
                    onClose={() => setShowModal(false)} 
                    onSuccess={() => {
                        fetchNotes();
                        setShowModal(false);
                    }} 
                />
            )}

            {/* Ultra-Premium PDF Company & Mode Selector Modal */}
            {showCompanySelect && (
                <div className="modal-overlay-blur" onClick={() => setShowCompanySelect(false)}>
                    <div className="dn-pdf-modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                            <div style={{
                                width: '54px', height: '54px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.25))',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#818cf8', margin: '0 auto 14px auto'
                            }}>
                                <Building2 size={26} />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0' }}>Select PDF Template & Profile</h2>
                            <p style={{ color: '#94a3b8', fontSize: '12.5px', marginTop: '6px' }}>Generate official logistics documentation</p>
                        </div>
                        
                        {/* BL vs BR Toggle */}
                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(10, 11, 18, 0.6)', padding: '5px', borderRadius: '14px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <button 
                                onClick={() => setDocumentType('bl')}
                                style={{
                                    flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none',
                                    fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', transition: '0.2s',
                                    background: documentType === 'bl' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                                    color: documentType === 'bl' ? '#fff' : '#94a3b8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                <Package size={15} /> Bon de Livraison (BL)
                            </button>
                            <button 
                                onClick={() => setDocumentType('return')}
                                style={{
                                    flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none',
                                    fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', transition: '0.2s',
                                    background: documentType === 'return' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'transparent',
                                    color: documentType === 'return' ? '#fff' : '#94a3b8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                <RotateCcw size={15} /> Bon de Retour (BR)
                            </button>
                        </div>

                        {/* Company Profile Triggers */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => { handleDownloadPdf(activeNote._id, activeNote.number, 'bright', documentType); setShowCompanySelect(false); }}
                                style={{
                                    padding: '14px 18px',
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: '#fff', fontSize: '14px', fontWeight: '800',
                                    borderRadius: '14px', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                <Sparkles size={17} /> Bright Stage Brand Header
                            </button>
                            <button
                                onClick={() => { handleDownloadPdf(activeNote._id, activeNote.number, 'square', documentType); setShowCompanySelect(false); }}
                                style={{
                                    padding: '14px 18px',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#fff', fontSize: '14px', fontWeight: '800',
                                    borderRadius: '14px', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                <Building2 size={17} /> Square Event Brand Header
                            </button>
                            <button
                                onClick={() => setShowCompanySelect(false)}
                                style={{
                                    background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#94a3b8', padding: '11px', borderRadius: '12px',
                                    cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginTop: '4px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryNoteList;
