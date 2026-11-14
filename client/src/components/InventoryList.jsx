import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm, useDialog } from '../context/ConfirmContext';
import InventoryForm from './InventoryForm';
import QRCode from 'react-qr-code';
import api from '../services/api';
import { 
    Search, Plus, Upload, QrCode, History, Edit, 
    AlertCircle, Trash2, Box, MapPin, Layers, ChevronRight,
    Printer, Download, Wrench, Truck, AlertTriangle
} from 'lucide-react';

const REPORT_STATES = [
    { value: 'Cassé', label: 'Cassé', badge: 'Critique', color: '#ef4444' },
    { value: 'à vérifier', label: 'à vérifier', badge: 'Inspection', color: '#f59e0b' },
    { value: 'à réparer', label: 'à réparer', badge: 'Atelier', color: '#f97316' }
];

const InventoryList = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showSuccess, showError } = useNotification() || {};
    const confirm = useConfirm();
    const { showAlert } = useDialog();
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [qrItem, setQrItem] = useState(null);
    const [historyItem, setHistoryItem] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Maintenance Report Modal State
    const [reportItem, setReportItem] = useState(null);
    const [reportState, setReportState] = useState('Cassé');
    const [reportQty, setReportQty] = useState(1);
    const [reportNotes, setReportNotes] = useState('');
    const [reportError, setReportError] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const fileInputRef = React.useRef(null);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await inventoryService.getAll();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const changePage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            setLoading(true);
            const res = await api.post('/inventory/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await showAlert({
                title: "Importation terminée",
                message: `Importation réussie !\nAjoutés : ${res.data.added || 0}\nMis à jour : ${res.data.updated || 0}`,
                type: "success"
            });
            loadInventory();
        } catch (err) {
            await showAlert({
                title: "Échec de l'importation",
                message: `Erreur lors de l'importation : ${err.message}`,
                type: "danger"
            });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleOpenReport = (item) => {
        setReportItem(item);
        setReportState('Cassé');
        setReportQty(1);
        setReportNotes('');
        setReportError('');
    };

    const handleSendReport = async () => {
        if (!reportNotes.trim()) {
            setReportError('Le rapport technique / diagnostic est obligatoire.');
            return;
        }
        const q = parseInt(reportQty, 10);
        if (isNaN(q) || q < 1) {
            setReportError('Veuillez entrer une quantité valide.');
            return;
        }
        if (q > (reportItem.quantity || 1)) {
            setReportError(`La quantité (${q}) dépasse le stock disponible (${reportItem.quantity || 1}).`);
            return;
        }
        setSubmittingReport(true);
        try {
            await api.put(`/maintenance/item-state/${reportItem._id}`, {
                state: reportState,
                quantity: q,
                notes: reportNotes.trim(),
                reportedBy: user?.name || "Utilisateur",
                reportedByRole: user?.role || ""
            });
            if (showSuccess) showSuccess(`Demande envoyée à la Maintenance : "${reportItem.name}" (${reportState})`);
            setReportItem(null);
            loadInventory();
        } catch (err) {
            setReportError(err.response?.data?.error || err.message);
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm({
            title: "Suppression d'un Équipement",
            message: "Êtes-vous sûr de vouloir supprimer définitivement cet équipement du magasin ?",
            confirmText: "Supprimer Définitivement",
            type: "danger"
        });
        if (!ok) return;
        try {
            setLoading(true);
            await inventoryService.delete(id);
            if (showSuccess) showSuccess("Équipement supprimé avec succès", "Magasin");
            loadInventory();
        } catch (err) {
            if (showError) showError("Échec de la suppression");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        const confirm1 = await confirm({
            title: "Action Critique : Vidage Complet du Magasin",
            message: "ATTENTION : Êtes-vous ABSOLUMENT certain de vouloir effacer TOUS les articles de l'inventaire ? Cette opération est irréversible !",
            confirmText: "Oui, Continuer",
            type: "danger"
        });
        if (!confirm1) return;
        
        const confirm2 = window.prompt("Tapez 'DELETE ALL' pour confirmer cette action critique :");
        if (confirm2 !== 'DELETE ALL') {
            if (showError) showError("Action annulée. Le texte de confirmation ne correspond pas.", "Annulé");
            return;
        }

        try {
            setLoading(true);
            await inventoryService.deleteAll();
            if (showSuccess) showSuccess("L'inventaire a été réinitialisé avec succès.", "Magasin");
            loadInventory();
        } catch (err) {
            if (showError) showError("Échec de la réinitialisation : " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (item) => {
        setHistoryItem(item);
        setHistoryLoading(true);
        try {
            const data = await inventoryService.getHistory(item._id);
            setHistoryData(data);
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Impossible de charger l'historique du matériel.",
                type: "danger"
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleDownloadQRs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory/qr-export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Global_QR_Codes.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Impossible de télécharger les QR codes.",
                type: "danger"
            });
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('son')) return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' };
        if (cat.includes('lumière')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' };
        if (cat.includes('led') || cat.includes('vidéo')) return { bg: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' };
        if (cat.includes('câblage')) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
        if (cat.includes('structure')) return { bg: 'rgba(100, 116, 139, 0.1)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)' };
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.2)' };
    };

    const uniqueCategories = [...new Set(items.map(item => item.category || 'Uncategorized'))].sort();
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filter.toLowerCase()) || 
                             item.brand?.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="inv-container">
            {/* Header Section */}
            <div className="inv-header">
                <div className="inv-title-row">
                    <div className="inv-icon-badge">
                        <Box size={24} />
                    </div>
                    <div className="inv-title-text">
                        <h1 className="inv-page-title">{t('inventory')}</h1>
                        <p className="inv-page-sub">Manage and track your audio-visual infrastructure</p>
                    </div>
                </div>
                {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                    <div className="inv-actions-row">
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls" onChange={handleFileUpload} />
                        <button className="premium-btn secondary" onClick={() => fileInputRef.current.click()}>
                            <Download size={15} /> <span className="btn-label">{t('import_excel')}</span>
                        </button>
                        <button className="premium-btn secondary" onClick={handleDownloadQRs}>
                            <Printer size={15} /> <span className="btn-label">Global QR</span>
                        </button>
                        {user?.role === 'Founder' && (
                            <button className="premium-btn danger-outline" onClick={handleDeleteAll}>
                                <Trash2 size={15} /> <span className="btn-label">Clear All</span>
                            </button>
                        )}
                        <button className="premium-btn primary" onClick={() => { setEditingItem(null); setShowForm(true); }}>
                            <Plus size={16} /> <span className="btn-label">{t('add_equip')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <div className="inv-filters-bar">
                <div className="inv-search-wrap">
                    <Search className="inv-search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('search_equip')} 
                        value={filter} 
                        onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                        className="premium-search-input"
                    />
                </div>
                <div className="inv-select-wrap">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                        className="premium-select"
                    >
                        <option value="">{t('all_cats')}</option>
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="inv-grid">
                {loading ? (
                    <div className="inv-loading-state">
                        <div className="spinner"></div>
                        <p style={{ marginTop: '20px', fontWeight: '700' }}>Syncing global inventory records...</p>
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="inv-empty-state">
                        <Box size={40} color="#334155" />
                        <p>No items found matching your criteria.</p>
                    </div>
                ) : (
                    currentItems.map(item => {
                        const colors = getCategoryColor(item.category);
                        return (
                            <div key={item._id} className="asset-premium-card">
                                <div>
                                    <div className="card-top">
                                        <span className="category-tag" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                                            <Layers size={11} /> {item.category}
                                        </span>
                                        <div className="status-indicator">
                                            <span style={{ fontSize: '10.5px', fontWeight: '800', opacity: 0.6, marginRight: '7px' }}>{item.state.toUpperCase()}</span>
                                            <span className={`state-dot ${item.state === 'Fonctionnel' ? 'active' : 'broken'}`}></span>
                                        </div>
                                    </div>

                                    <div className="card-main">
                                        <h3 className="asset-title">{item.name}</h3>
                                        <p className="asset-subtitle">{item.brand || 'Generic'} • {item.model || 'Standard'}</p>
                                        
                                        <div className="stats-container">
                                            <div className="stat-pill">
                                                <div className="stat-icon"><Box size={14} /></div>
                                                <div className="stat-content">
                                                    <span className="s-label">Qty</span>
                                                    <span className="s-value">{item.quantity}</span>
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

                                <div className="card-actions-row">
                                    <div className="left-actions">
                                        <button className="action-btn" onClick={() => setQrItem(item)} title="Generate QR"><QrCode size={16} /></button>
                                        <button className="action-btn" onClick={() => handleViewHistory(item)} title="View Logs"><History size={16} /></button>
                                    </div>
                                    <div className="right-actions">
                                        {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                            <>
                                                <button className="action-btn" onClick={() => {setEditingItem(item); setShowForm(true);}} title="Edit Entry"><Edit size={16} /></button>
                                                <button className="action-btn warning" onClick={() => handleOpenReport(item)} title="Signaler pour Maintenance"><AlertCircle size={16} /></button>
                                                {['Founder', 'Manager'].includes(user?.role) && (
                                                    <button className="action-btn danger" onClick={() => handleDelete(item._id)} title="Purge Record"><Trash2 size={16} /></button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="inv-pagination">
                    <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="page-pagination-btn">Previous</button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i+1} 
                            onClick={() => changePage(i+1)} 
                            className={`page-pagination-btn ${currentPage === i+1 ? 'current' : ''}`}
                        >
                            {i+1}
                        </button>
                    ))}
                    <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="page-pagination-btn">Next <ChevronRight size={14} /></button>
                </div>
            )}

            {/* Modals */}
            {showForm && <InventoryForm itemToEdit={editingItem} onClose={() => setShowForm(false)} onSuccess={() => {setShowForm(false); loadInventory();}} />}
            
            {qrItem && (
                <div className="premium-modal-overlay" onClick={() => setQrItem(null)}>
                    <div className="premium-modal-card qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Asset Identity QR</h2>
                            <button className="close-btn" onClick={() => setQrItem(null)}>&times;</button>
                        </div>
                        <div className="qr-container-box">
                            <QRCode value={`brightstage://inventory/${qrItem.barcode || qrItem._id}`} size={200} />
                        </div>
                        <div className="qr-meta">
                            <code>{qrItem.barcode || qrItem._id}</code>
                        </div>
                        <button className="premium-btn primary" onClick={() => window.print()} style={{ width: '100%', marginTop: '30px', justifyContent: 'center' }}>
                            <Printer size={18} /> Print Label
                        </button>
                    </div>
                </div>
            )}

            {historyItem && (
                <div className="premium-modal-overlay" onClick={() => {setHistoryItem(null); setHistoryData(null);}}>
                    <div className="premium-modal-card history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0 }}>Equipment Logs</h2>
                                <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>Lifecycle tracking for {historyItem.name}</p>
                            </div>
                            <button className="close-btn" onClick={() => setHistoryItem(null)}>&times;</button>
                        </div>
                        <div className="timeline-view">
                            {historyLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>Syncing history nodes...</div>
                            ) : (
                                <>
                                    <div className="t-section">
                                        <h4 className="t-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Wrench size={15} /> Maintenance Logs</h4>
                                        {historyData?.maintenance.length > 0 ? historyData.maintenance.map((t, i) => (
                                            <div key={i} className="t-event">
                                                <div className="t-date">{new Date(t.dateReported).toLocaleDateString()}</div>
                                                <div className="t-content">{t.issueDescription} <span className={`t-status ${t.status.toLowerCase()}`}>{t.status}</span></div>
                                            </div>
                                        )) : <p className="t-empty">No maintenance records found.</p>}
                                    </div>
                                    <div className="t-section">
                                        <h4 className="t-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={15} /> Rental Movements</h4>
                                        {historyData?.rentals.length > 0 ? historyData.rentals.map((r, i) => (
                                            <div key={i} className="t-event">
                                                <div className="t-date">{new Date(r.startDate).toLocaleDateString()}</div>
                                                <div className="t-content">{r.eventName} <span className="t-qty">{r.quantity} qty</span></div>
                                            </div>
                                        )) : <p className="t-empty">No rental history registered.</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Maintenance Report Modal */}
            {reportItem && (
                <div className="premium-modal-overlay" onClick={() => setReportItem(null)}>
                    <div className="premium-modal-card report-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={18} color="#ef4444" /> Signaler pour Maintenance
                                </h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                    {reportItem.name} {reportItem.barcode ? `• Code: ${reportItem.barcode}` : ''}
                                </p>
                            </div>
                            <button className="close-btn" onClick={() => setReportItem(null)}>&times;</button>
                        </div>

                        <div style={{ padding: '20px 0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                                Choisir la condition :
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                                {REPORT_STATES.map(s => (
                                    <div
                                        key={s.value}
                                        onClick={() => setReportState(s.value)}
                                        style={{
                                            padding: '12px 10px',
                                            borderRadius: '12px',
                                            border: `2px solid ${reportState === s.value ? s.color : 'rgba(255,255,255,0.08)'}`,
                                            background: reportState === s.value ? `${s.color}20` : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: reportState === s.value ? '#ffffff' : '#cbd5e1' }}>
                                            {s.label}
                                        </div>
                                        <span style={{ fontSize: '10px', color: s.color, fontWeight: '700', textTransform: 'uppercase' }}>
                                            {s.badge}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Quantité concernée *</label>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Stock total : <strong style={{ color: '#818cf8' }}>{reportItem.quantity || 1}</strong></span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    max={reportItem.quantity || 1}
                                    value={reportQty}
                                    onChange={e => { setReportQty(e.target.value); setReportError(''); }}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '14px', fontWeight: '700' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Notes de diagnostic / Rapport technique *</label>
                                    <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '800', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px' }}>OBLIGATOIRE</span>
                                </div>
                                <textarea
                                    rows="3"
                                    value={reportNotes}
                                    onChange={e => { setReportNotes(e.target.value); setReportError(''); }}
                                    placeholder="Ex: Câble sectionné, lentille rayée, problème d'allumage..."
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '13px', resize: 'vertical' }}
                                />
                            </div>

                            {reportError && (
                                <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertTriangle size={14} /> {reportError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="button" className="premium-btn secondary" onClick={() => setReportItem(null)}>
                                    Annuler
                                </button>
                                <button 
                                    type="button" 
                                    className="premium-btn primary" 
                                    onClick={handleSendReport}
                                    disabled={submittingReport || !reportNotes.trim()}
                                    style={{ 
                                        background: (!reportNotes.trim()) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        color: (!reportNotes.trim()) ? '#64748b' : '#ffffff',
                                        cursor: (!reportNotes.trim()) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {submittingReport ? 'Envoi...' : 'Envoyer à la Maintenance'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* ===== INVENTORY - RESPONSIVE LAYOUT ===== */
                .inv-container {
                    padding: clamp(14px, 2.5vw, 35px) clamp(12px, 3vw, 50px);
                    max-width: 1600px;
                    margin: 0 auto;
                    color: #fff;
                    min-height: calc(100vh - 80px);
                    box-sizing: border-box;
                    width: 100%;
                    overflow-x: clip;
                }

                /* Header */
                .inv-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: clamp(18px, 2.5vw, 28px);
                    flex-wrap: wrap;
                    gap: 14px;
                }
                .inv-title-row {
                    display: flex;
                    align-items: center;
                    gap: clamp(12px, 1.5vw, 16px);
                    min-width: 0;
                }
                .inv-icon-badge {
                    width: clamp(42px, 4.5vw, 52px);
                    height: clamp(42px, 4.5vw, 52px);
                    border-radius: clamp(14px, 1.5vw, 18px);
                    background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.25));
                    border: 1px solid rgba(99,102,241,0.35);
                    display: flex; align-items: center; justify-content: center;
                    color: #818cf8;
                    box-shadow: 0 8px 25px rgba(99,102,241,0.2);
                    flex-shrink: 0;
                }
                .inv-page-title {
                    font-size: clamp(20px, 2.5vw, 30px);
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    margin: 0;
                    background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    line-height: 1.2;
                }
                .inv-page-sub {
                    color: #64748b;
                    font-size: clamp(11px, 1vw, 13.5px);
                    margin: 4px 0 0 0;
                    font-weight: 500;
                }
                .inv-actions-row {
                    display: flex;
                    gap: clamp(8px, 1vw, 12px);
                    flex-wrap: wrap;
                    align-items: center;
                }

                /* Filters bar */
                .inv-filters-bar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: clamp(16px, 2vw, 25px);
                    padding: clamp(10px, 1.5vw, 14px) clamp(12px, 1.8vw, 18px);
                    background: rgba(30,32,47,0.6);
                    border-radius: 18px;
                    border: 1px solid rgba(255,255,255,0.05);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    flex-wrap: wrap;
                }
                .inv-search-wrap {
                    flex: 1;
                    min-width: 180px;
                    position: relative;
                }
                .inv-search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6366f1;
                    opacity: 0.8;
                    pointer-events: none;
                }
                .inv-select-wrap {
                    width: clamp(140px, 22vw, 260px);
                    min-width: 130px;
                }

                /* Assets Grid */
                .inv-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 28vw, 340px), 1fr));
                    gap: clamp(14px, 2vw, 22px);
                }
                .inv-loading-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: clamp(60px, 10vw, 120px) 20px;
                    color: #6366f1;
                }
                .inv-empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: clamp(50px, 8vw, 100px) 20px;
                    background: rgba(255,255,255,0.01);
                    border-radius: 30px;
                    border: 1px dashed rgba(255,255,255,0.05);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 14px;
                }
                .inv-empty-state p { color: #475569; font-size: 15px; margin: 0; }

                /* Pagination */
                .inv-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: clamp(30px, 5vw, 60px);
                    gap: 8px;
                    flex-wrap: wrap;
                }

                /* Buttons */
                .premium-btn { padding: clamp(8px, 1vw, 10px) clamp(12px, 1.5vw, 20px); border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-size: clamp(11.5px, 0.9vw, 12.5px); display: flex; align-items: center; gap: 6px; white-space: nowrap; }
                .premium-btn.primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
                .premium-btn.secondary { background: rgba(255,255,255,0.03); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px); }
                .premium-btn.danger-outline { background: rgba(244,63,94,0.05); color: #f43f5e; border: 1px solid rgba(244,63,94,0.2); }
                .premium-btn:hover { transform: translateY(-2px); filter: brightness(1.15); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
                .premium-btn:active { transform: translateY(0); }

                .premium-search-input { width: 100%; padding: 10px 16px 10px 48px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; color: white; font-weight: 500; outline: none; transition: all 0.3s; font-size: 13.5px; box-sizing: border-box; height: 44px; }
                .premium-search-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.05); box-shadow: 0 0 20px rgba(99,102,241,0.1); }
                
                .premium-select { padding: 0 16px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; color: #fff; outline: none; cursor: pointer; font-weight: 600; width: 100%; font-size: 13.5px; appearance: none; height: 44px; box-sizing: border-box; }

                /* Cards */
                .asset-premium-card { background: linear-gradient(180deg, rgba(26,27,40,0.75) 0%, rgba(18,19,28,0.9) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: clamp(16px, 2vw, 22px); backdrop-filter: blur(16px); transition: all 0.3s cubic-bezier(0.4,0,0.2,1); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
                .asset-premium-card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.4); box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
                .asset-premium-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); opacity: 0; transition: 0.3s; }
                .asset-premium-card:hover::before { opacity: 0.8; }

                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
                .category-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 5px; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .status-indicator { display: flex; align-items: center; flex-shrink: 0; }
                .state-dot { width: 8px; height: 8px; border-radius: 50%; }
                .state-dot.active { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.6); }
                .state-dot.broken { background: #f43f5e; box-shadow: 0 0 10px rgba(244,63,94,0.6); }

                .asset-title { font-size: clamp(14px, 1.3vw, 16.5px); font-weight: 800; color: white; margin: 0; letter-spacing: -0.3px; line-height: 1.35; word-break: break-word; }
                .asset-subtitle { font-size: 12px; color: #64748b; margin: 4px 0 14px 0; font-weight: 500; }

                .stats-container { display: flex; gap: 10px; margin-bottom: 16px; }
                .stat-pill { background: rgba(10,11,18,0.4); border: 1px solid rgba(255,255,255,0.04); padding: 8px 12px; border-radius: 12px; display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
                .stat-icon { color: #6366f1; opacity: 0.8; display: flex; align-items: center; flex-shrink: 0; }
                .stat-content { display: flex; flex-direction: column; min-width: 0; }
                .s-label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
                .s-value { font-weight: 800; color: #fff; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .card-actions-row { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: auto; }
                .left-actions, .right-actions { display: flex; gap: 6px; }

                .action-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; transition: 0.2s cubic-bezier(0.4,0,0.2,1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .action-btn:hover { background: rgba(99,102,241,0.2); color: #fff; border-color: #6366f1; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                .action-btn.warning:hover { background: rgba(245,158,11,0.2); color: #fbbf24; border-color: #f59e0b; }
                .action-btn.danger:hover { background: rgba(244,63,94,0.2); color: #f87171; border-color: #f43f5e; }
                .action-btn:active { transform: translateY(0); }
                .action-btn:disabled { opacity: 0.1; cursor: not-allowed; }

                /* Pagination */
                .page-pagination-btn { padding: clamp(8px, 1vw, 10px) clamp(12px, 1.5vw, 20px); background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); color: #94a3b8; border-radius: 14px; cursor: pointer; transition: 0.3s; font-weight: 700; font-size: clamp(11px, 0.9vw, 13px); display: flex; align-items: center; gap: 6px; }
                .page-pagination-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }
                .page-pagination-btn.current { background: #6366f1; color: white; border-color: #6366f1; box-shadow: 0 5px 15px rgba(99,102,241,0.2); }
                .page-pagination-btn:disabled { opacity: 0.2; cursor: not-allowed; }

                /* Modals */
                .premium-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); display: flex; justify-content: center; align-items: center; z-index: 2000; animation: fadeIn 0.3s ease; padding: 16px; box-sizing: border-box; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .premium-modal-card { background: #161722; padding: clamp(20px, 3vw, 40px); border-radius: clamp(20px, 2.5vw, 32px); border: 1px solid rgba(255,255,255,0.08); width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 50px 100px rgba(0,0,0,0.5); box-sizing: border-box; }
                .report-modal-card { max-width: 520px; background: #181926; border: 1px solid rgba(255,255,255,0.1); }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: clamp(16px, 2.5vw, 30px); gap: 12px; }
                .modal-header h2 { font-size: clamp(18px, 2vw, 24px); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
                .close-btn { background: none; border: none; color: #475569; font-size: 24px; cursor: pointer; transition: 0.2s; flex-shrink: 0; padding: 4px; }
                .close-btn:hover { color: #f43f5e; }

                .qr-container-box { background: white; padding: clamp(16px, 2.5vw, 25px); border-radius: 24px; margin: clamp(16px, 2.5vw, 30px) auto; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                .qr-meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #a78bfa; background: rgba(99,102,241,0.1); padding: 10px 15px; border-radius: 12px; word-break: break-all; }

                .timeline-view { max-height: clamp(300px, 50vh, 500px); overflow-y: auto; padding-right: 8px; }
                .t-section { margin-bottom: 25px; }
                .t-label { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #6366f1; letter-spacing: 1px; margin-bottom: 12px; display: block; }
                .t-event { background: rgba(255,255,255,0.02); padding: clamp(10px, 1.5vw, 15px); border-radius: 14px; margin-bottom: 8px; border-left: 3px solid #6366f1; transition: 0.2s; }
                .t-event:hover { background: rgba(255,255,255,0.04); transform: translateX(4px); }
                .t-date { font-size: 11px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
                .t-content { font-size: clamp(12px, 1.1vw, 14px); font-weight: 600; color: #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
                .t-status { font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 800; }
                .t-status.completed { background: rgba(16,185,129,0.1); color: #10b981; }
                .t-status.pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
                .t-empty { color: #475569; font-size: 13px; font-style: italic; }
                .t-qty { font-size: 11px; color: #818cf8; font-weight: 700; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 6px; }

                /* Responsive breakpoints */
                @media (max-width: 640px) {
                    .btn-label { display: none; }
                    .inv-filters-bar { flex-direction: column; }
                    .inv-select-wrap { width: 100%; }
                    .inv-search-wrap { min-width: 0; }
                    .inv-grid { grid-template-columns: 1fr; }
                    .inv-pagination { gap: 6px; }
                    .page-pagination-btn { padding: 8px 12px; font-size: 11px; }
                }
                @media (max-width: 480px) {
                    .status-indicator span:first-child { display: none; }
                    .modal-header h2 { font-size: 16px; }
                }
                @media (min-width: 641px) and (max-width: 900px) {
                    .inv-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
};

export default InventoryList;
