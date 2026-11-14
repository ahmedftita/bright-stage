import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useDialog } from '../context/ConfirmContext';
import { Search, FileText, Plus, Banknote, Download, Receipt, Building2, Sparkles } from 'lucide-react';
import './QuotesList.css';

const QuotesList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const confirm = useConfirm();
    const { showAlert } = useDialog();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showCompanySelect, setShowCompanySelect] = useState(false);
    const [activeQuote, setActiveQuote] = useState(null);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const res = await api.get('/projects');
            const onlyQuotes = res.data.filter(p =>
                p.status === 'Draft' || p.status === 'Quote'
            );
            setQuotes(onlyQuotes);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching quotes:', err);
            setLoading(false);
        }
    };

    const handleDownload = async (id, eventName, companyId = 'bright') => {
        try {
            const response = await api.get(`/projects/${id}/pdf?type=quote&companyId=${companyId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `quote-${eventName}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            showAlert('Échec du téléchargement du document PDF.');
        }
    };

    const openCompanySelect = (q) => {
        setActiveQuote(q);
        setShowCompanySelect(true);
    };

    const handleConvertToInvoice = async (q) => {
        const ok = await confirm({
            title: 'Génération de Facture',
            message: `Convertir le devis '${q.eventName}' en facture brouillon officielle ?`,
            confirmText: 'Convertir en Facture',
            type: 'confirm',
        });
        if (ok) {
            try {
                await api.post(`/invoices/from-project/${q._id}`);
                await showAlert({ title: 'Facture Créée', message: 'La facture brouillon a été générée avec succès.', type: 'success' });
                navigate('/invoices');
            } catch (e) {
                showAlert({ title: 'Erreur', message: e.message, type: 'danger' });
            }
        }
    };

    const filteredQuotes = quotes.filter(q => {
        const clientName = q.clientId?.name || q.client?.name || '';
        const matchesSearch =
            q.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalQuoteValue = quotes.reduce((acc, curr) => acc + (curr.financials?.totalInclTax || 0), 0);
    const activeQuotesCount = quotes.filter(q => q.status === 'Quote').length;
    const draftQuotesCount = quotes.filter(q => q.status === 'Draft').length;

    const getStatusStyle = (status) => ({
        background: status === 'Quote' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
        color: status === 'Quote' ? '#60a5fa' : '#94a3b8',
        border: `1px solid ${status === 'Quote' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', color: '#6366f1', padding: '100px', fontSize: '15px' }}>
                Loading quotes & proposals...
            </div>
        );
    }

    return (
        <div className="ql-container">

            {/* ── Header ── */}
            <div className="ql-header">
                <div className="ql-header-left">
                    <div className="ql-icon-badge">
                        <FileText size={26} />
                    </div>
                    <div>
                        <h1 className="ql-title">Proposals & Quotes Registry</h1>
                        <p className="ql-subtitle">Commercial estimates, client quotes, draft budgets and invoice conversion</p>
                    </div>
                </div>

                <div className="ql-header-actions">
                    <div className="ql-search-wrapper">
                        <span className="ql-search-icon"><Search size={16} /></span>
                        <input
                            type="text"
                            placeholder="Search proposal or client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ql-search-input"
                        />
                    </div>
                    <button className="ql-create-btn" onClick={() => navigate('/quote-builder')}>
                        <Plus size={16} /> Create New Quote
                    </button>
                </div>
            </div>

            {/* ── Metric Strip ── */}
            <div className="ql-metrics">
                <div className="ql-metric-card">
                    <div className="ql-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <Banknote size={22} />
                    </div>
                    <div>
                        <div className="ql-metric-value" style={{ color: '#34d399' }}>
                            {totalQuoteValue.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                        </div>
                        <div className="ql-metric-label">Total Quoted Value</div>
                    </div>
                </div>

                <div className="ql-metric-card">
                    <div className="ql-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                        <FileText size={22} />
                    </div>
                    <div>
                        <div className="ql-metric-value" style={{ color: '#60a5fa' }}>{activeQuotesCount} Proposals</div>
                        <div className="ql-metric-label">Active in Negotiation</div>
                    </div>
                </div>

                <div className="ql-metric-card">
                    <div className="ql-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '20px' }}>
                        ⏳
                    </div>
                    <div>
                        <div className="ql-metric-value" style={{ color: '#fbbf24' }}>{draftQuotesCount} Drafts</div>
                        <div className="ql-metric-label">Internal Preparation</div>
                    </div>
                </div>
            </div>

            {/* ── Filter Pills ── */}
            <div className="ql-filter-pills">
                {['All', 'Quote', 'Draft'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className="ql-pill"
                        style={{
                            border: statusFilter === status ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                            background: statusFilter === status ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.3))' : 'rgba(18, 19, 28, 0.6)',
                            color: statusFilter === status ? '#fff' : '#94a3b8',
                        }}
                    >
                        {status === 'Quote' ? 'Active Quotes' : status === 'Draft' ? 'Draft Proposals' : 'All Proposals'}
                    </button>
                ))}
            </div>

            {/* ── Desktop Table ── */}
            <div className="ql-table-container">
                <div className="ql-table-scroll">
                    <table className="ql-table">
                        <thead>
                            <tr>
                                <th>Event / Proposal Name</th>
                                <th>Target Client</th>
                                <th>Target Dates</th>
                                <th>Total (TTC)</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="ql-empty-state">
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                                <FileText size={36} color="#475569" />
                                            </div>
                                            <p>No quotes or proposals found matching criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map(q => (
                                    <tr key={q._id}>
                                        <td>
                                            <div className="ql-event-name">{q.eventName}</div>
                                            <div className="ql-event-venue">{q.venue || q.siteName || 'Standard Location'}</div>
                                        </td>
                                        <td>
                                            <div className="ql-client-name">{q.clientId?.name || q.client?.name || '—'}</div>
                                        </td>
                                        <td className="ql-date-cell">
                                            {q.dates?.start ? new Date(q.dates.start).toLocaleDateString() : 'TBD'}
                                        </td>
                                        <td>
                                            <div className="ql-total-value">
                                                {(q.financials?.totalInclTax || 0).toFixed(3)} DT
                                            </div>
                                        </td>
                                        <td>
                                            <span className="ql-status-badge" style={getStatusStyle(q.status)}>
                                                {q.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="ql-row-actions">
                                                <button
                                                    onClick={() => openCompanySelect(q)}
                                                    className="ql-action-btn"
                                                    style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}
                                                >
                                                    <Download size={13} /> PDF
                                                </button>
                                                {['Founder', 'Manager'].includes(user?.role) && (
                                                    <button
                                                        onClick={() => handleConvertToInvoice(q)}
                                                        className="ql-action-btn"
                                                        style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}
                                                        title="Convert to Invoice"
                                                    >
                                                        <Receipt size={13} /> Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Mobile / Tablet Card Grid ── */}
            <div className="ql-cards-grid">
                {filteredQuotes.length === 0 ? (
                    <div className="ql-empty-state">
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                            <FileText size={36} color="#475569" />
                        </div>
                        <p>No quotes or proposals found matching criteria</p>
                    </div>
                ) : (
                    filteredQuotes.map(q => (
                        <div key={q._id} className="ql-quote-card">
                            <div className="ql-card-top">
                                <div className="ql-card-title-block">
                                    <h3>{q.eventName}</h3>
                                    <p>{q.venue || q.siteName || 'Standard Location'}</p>
                                </div>
                                <span className="ql-status-badge" style={getStatusStyle(q.status)}>
                                    {q.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="ql-card-meta">
                                <div className="ql-card-meta-item">
                                    <div className="ql-card-meta-label">Client</div>
                                    <div className="ql-card-meta-value">{q.clientId?.name || q.client?.name || '—'}</div>
                                </div>
                                <div className="ql-card-meta-item">
                                    <div className="ql-card-meta-label">Date</div>
                                    <div className="ql-card-meta-value">
                                        {q.dates?.start ? new Date(q.dates.start).toLocaleDateString() : 'TBD'}
                                    </div>
                                </div>
                                <div className="ql-card-meta-item" style={{ gridColumn: '1 / -1' }}>
                                    <div className="ql-card-meta-label">Total (TTC)</div>
                                    <div className="ql-card-total">
                                        {(q.financials?.totalInclTax || 0).toFixed(3)} DT
                                    </div>
                                </div>
                            </div>

                            <div className="ql-card-actions">
                                <button
                                    onClick={() => openCompanySelect(q)}
                                    className="ql-action-btn"
                                    style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}
                                >
                                    <Download size={13} /> PDF
                                </button>
                                {['Founder', 'Manager'].includes(user?.role) && (
                                    <button
                                        onClick={() => handleConvertToInvoice(q)}
                                        className="ql-action-btn"
                                        style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}
                                    >
                                        <Receipt size={13} /> Invoice
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Company Select Modal ── */}
            {showCompanySelect && (
                <div className="ql-modal-overlay" onClick={() => setShowCompanySelect(false)}>
                    <div className="ql-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="ql-modal-icon-wrap">
                            <div className="ql-modal-icon"><Building2 size={28} /></div>
                        </div>
                        <h2 className="ql-modal-title">Select Proposal Profile</h2>
                        <p className="ql-modal-subtitle">Choose the commercial entity for this estimate</p>

                        <div className="ql-modal-btn-group">
                            <button
                                className="ql-modal-btn indigo"
                                onClick={() => { handleDownload(activeQuote._id, activeQuote.eventName, 'bright'); setShowCompanySelect(false); }}
                            >
                                <Sparkles size={16} /> Bright Stage Brand Header
                            </button>
                            <button
                                className="ql-modal-btn amber"
                                onClick={() => { handleDownload(activeQuote._id, activeQuote.eventName, 'square'); setShowCompanySelect(false); }}
                            >
                                <Building2 size={16} /> Square Event Brand Header
                            </button>
                            <button className="ql-modal-cancel" onClick={() => setShowCompanySelect(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotesList;