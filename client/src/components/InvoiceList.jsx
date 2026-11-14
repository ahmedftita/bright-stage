import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Search, Plus, CreditCard, Download, Check, FileText, CheckCircle2, Clock, Building2, Sparkles, X, Banknote, Calendar } from 'lucide-react';
import { useDialog } from '../context/ConfirmContext';
import InvoiceBuilder from './InvoiceBuilder';
import './InvoiceList.css';

const InvoiceList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert } = useDialog();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState(location.state?.filter || null);
    const [showCompanySelect, setShowCompanySelect] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [activeInvoice, setActiveInvoice] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        if (location.state?.filter) {
            setActiveFilter(location.state.filter);
        }
    }, [location.state]);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
            setLoading(false);
        } catch (err) {
            console.log("Invoice API error", err);
            setLoading(false);
        }
    };

    const handleDownload = async (id, number, companyId = 'bright') => {
        try {
            const resPdf = await api.get(`/invoices/${id}/pdf?company=${companyId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resPdf.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${number}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            await showAlert({
                title: "Échec du téléchargement",
                message: "Impossible de télécharger la facture PDF.",
                type: "danger"
            });
        }
    };

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        const clientName = inv.client?.name || '';
        const matchesSearch = inv.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesFilter = true;
        if (activeFilter === 'Overdue') {
            matchesFilter = (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < new Date();
        } else if (activeFilter === 'Sent') {
            matchesFilter = inv.status === 'Sent';
        } else if (activeFilter === 'Paid') {
            matchesFilter = inv.status === 'Paid';
        } else if (activeFilter === 'Draft') {
            matchesFilter = inv.status === 'Draft';
        }
        return matchesSearch && matchesFilter;
    });

    const totalBilled = invoices.reduce((acc, curr) => acc + (curr.financials?.totalInclTax || 0), 0);
    const totalCollected = invoices.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
    const totalPending = Math.max(0, totalBilled - totalCollected);
    const overdueCount = invoices.filter(inv => (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < new Date()).length;

    const PaymentModal = ({ invoice, onClose, onSuccess }) => {
        const remaining = Math.max(0, (invoice.financials?.totalInclTax || 0) - (invoice.totalPaid || 0));
        const [amount, setAmount] = useState(remaining.toFixed(3));
        const [method, setMethod] = useState('Bank Transfer');
        const [note, setNote] = useState('');
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
                await api.post(`/invoices/${invoice._id}/payments`, { amount, method, note });
                onSuccess();
                onClose();
            } catch (err) {
                await showAlert({
                    title: "Erreur de paiement",
                    message: "Erreur lors de l'enregistrement du paiement : " + (err.response?.data?.error || err.message),
                    type: "danger"
                });
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="il-modal-overlay" onClick={onClose}>
                <div className="il-modal-card" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="il-modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <CreditCard size={22} color="#10b981" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#fff' }}>Record Client Payment</h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Invoice #{invoice.number}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose} 
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Summary Balance Card */}
                    <div className="il-modal-body">
                        <div style={{
                            background: 'rgba(10, 11, 18, 0.6)', padding: '16px 18px', borderRadius: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: '700' }}>Invoice Total</span>
                                <span style={{ color: '#fff', fontWeight: '800', fontFamily: 'monospace' }}>{invoice.financials?.totalInclTax?.toFixed(3)} DT</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: '700' }}>Collected</span>
                                <span style={{ color: '#34d399', fontWeight: '800', fontFamily: 'monospace' }}>{(invoice.totalPaid || 0).toFixed(3)} DT</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ color: '#f87171', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: '800' }}>Remaining Balance</span>
                                <span style={{ color: '#f87171', fontWeight: '900', fontSize: '15px', fontFamily: 'monospace' }}>{remaining.toFixed(3)} DT</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Amount to Pay (DT)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10, 11, 18, 0.8)', color: '#fff', outline: 'none', fontSize: '15px', fontWeight: '700', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Payment Method</label>
                                <select
                                    value={method}
                                    onChange={e => setMethod(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#161824', color: '#fff', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                                >
                                    <option>Bank Transfer (Virement)</option>
                                    <option>Check (Chèque)</option>
                                    <option>Cash (Espèces)</option>
                                    <option>Traite</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Reference / Receipt Notes</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="e.g. Chèque N° 0847291 BNA"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10, 11, 18, 0.8)', color: '#fff', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    style={{ padding: '10px 22px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '13px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {submitting ? 'Recording...' : (<><Check size={16} /> Confirm Payment</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="il-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', color: '#fbbf24', padding: '60px', fontSize: '15px' }}>
                    Accessing client billing archives...
                </div>
            </div>
        );
    }

    return (
        <div className="il-container">
            {/* Header */}
            <div className="il-header">
                <div className="il-header-left">
                    <div className="il-header-icon">
                        <FileText size={26} />
                    </div>
                    <div className="il-header-titles">
                        <h1>Invoice & Settlement Ledger</h1>
                        <p className="il-header-subtext">
                            Billing tracking, VAT reconciliation, payment installments, and overdue recoveries
                        </p>
                    </div>
                </div>

                <div className="il-header-actions">
                    <div className="il-search-wrapper">
                        <span className="il-search-icon"><Search size={16} /></span>
                        <input
                            type="text"
                            placeholder="Search invoice# or client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="il-search-input"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowInvoiceModal(true)}
                        className="il-create-btn"
                    >
                        <Plus size={18} />
                        <span>Create New Invoice</span>
                    </button>
                </div>
            </div>

            {/* Metric Strip (KPIs) */}
            <div className="il-metrics-grid">
                <div className="il-metric-card">
                    <div className="il-metric-icon-wrap gold">
                        <Banknote size={22} />
                    </div>
                    <div className="il-metric-content">
                        <div className="il-metric-val">{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</div>
                        <div className="il-metric-label">Total Invoiced Turnover</div>
                    </div>
                </div>

                <div className="il-metric-card">
                    <div className="il-metric-icon-wrap green">
                        <CheckCircle2 size={22} />
                    </div>
                    <div className="il-metric-content">
                        <div className="il-metric-val green">{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</div>
                        <div className="il-metric-label">Collected Payments</div>
                    </div>
                </div>

                <div className="il-metric-card">
                    <div className="il-metric-icon-wrap red">
                        <Clock size={22} />
                    </div>
                    <div className="il-metric-content">
                        <div className={`il-metric-val ${overdueCount > 0 ? 'red' : ''}`}>{overdueCount} Overdue</div>
                        <div className="il-metric-label">Pending Recovery: {totalPending.toFixed(3)} DT</div>
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="il-filter-bar">
                {[
                    { id: null, label: 'All Invoices' },
                    { id: 'Draft', label: 'Drafts' },
                    { id: 'Sent', label: 'Sent & Pending' },
                    { id: 'Overdue', label: 'Overdue Warnings' },
                    { id: 'Paid', label: 'Fully Settled' },
                ].map(tab => (
                    <button
                        key={tab.id || 'all'}
                        onClick={() => {
                            setActiveFilter(tab.id);
                            if (!tab.id) navigate('/invoices', { replace: true, state: {} });
                        }}
                        className={`il-filter-pill ${activeFilter === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Invoices List / Table Container */}
            <div className="il-table-container">
                {filteredInvoices.length === 0 ? (
                    <div className="il-empty-state">
                        <FileText size={38} style={{ color: '#475569' }} />
                        <strong>No invoices found matching criteria</strong>
                        <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your search or status filter.</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop Data Table (Shown > 768px) ── */}
                        <div className="il-table-scroll il-desktop-only">
                            <table className="il-table">
                                <thead>
                                    <tr>
                                        <th>Invoice Ref</th>
                                        <th>Billed Client</th>
                                        <th>Invoice Date</th>
                                        <th>Total (TTC) & Settlement</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((inv) => {
                                        const isOverdue = (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < new Date();
                                        const statusClass = inv.status === 'Paid' ? 'paid' : isOverdue ? 'overdue' : inv.status === 'Sent' ? 'sent' : 'draft';
                                        return (
                                            <tr key={inv._id}>
                                                <td>
                                                    <div className="il-ref-badge">
                                                        {inv.number}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="il-client-name">
                                                        {inv.client?.name || 'Unknown Client'}
                                                    </div>
                                                    <div className="il-client-fiscal">
                                                        {inv.client?.matriculeFiscal || 'Standard Client'}
                                                    </div>
                                                </td>
                                                <td style={{ color: '#94a3b8', fontSize: '13px' }}>
                                                    {new Date(inv.date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div style={{ fontFamily: 'monospace', color: '#fff', fontWeight: '800', fontSize: '14px' }}>
                                                        {inv.financials?.totalInclTax?.toFixed(3)} DT
                                                    </div>
                                                    {inv.totalPaid > 0 && inv.status !== 'Paid' && (
                                                        <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                                                            Paid: {inv.totalPaid.toFixed(3)} DT
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`il-status-badge ${statusClass}`}>
                                                        {isOverdue ? 'OVERDUE' : (inv.status?.toUpperCase() || 'DRAFT')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        {inv.status !== 'Paid' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedInvoice(inv)}
                                                                title="Record Payment"
                                                                className="il-action-btn pay"
                                                            >
                                                                <CreditCard size={14} /> Pay
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveInvoice(inv);
                                                                setShowCompanySelect(true);
                                                            }}
                                                            title="Download Invoice PDF"
                                                            className="il-action-btn pdf"
                                                        >
                                                            <Download size={14} /> PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Mobile Cards View (Shown <= 768px) ── */}
                        <div className="il-mobile-cards il-mobile-only" style={{ padding: '12px' }}>
                            {filteredInvoices.map((inv) => {
                                const isOverdue = (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < new Date();
                                const statusClass = inv.status === 'Paid' ? 'paid' : isOverdue ? 'overdue' : inv.status === 'Sent' ? 'sent' : 'draft';
                                const total = inv.financials?.totalInclTax || 0;
                                const paid = inv.totalPaid || 0;
                                const remaining = Math.max(0, total - paid);

                                return (
                                    <div className="il-card" key={inv._id}>
                                        {/* Card Top: Ref, Status, Date */}
                                        <div className="il-card-top">
                                            <div className="il-card-top-left">
                                                <div className="il-ref-badge">{inv.number}</div>
                                                <span className={`il-status-badge ${statusClass}`}>
                                                    {isOverdue ? 'OVERDUE' : (inv.status?.toUpperCase() || 'DRAFT')}
                                                </span>
                                            </div>
                                            <div className="il-card-date">
                                                <Calendar size={13} style={{ color: '#94a3b8' }} />
                                                <span>{new Date(inv.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Client Info */}
                                        <div className="il-card-client-box">
                                            <div className="il-card-client-name">
                                                {inv.client?.name || 'Unknown Client'}
                                            </div>
                                            <div className="il-card-client-sub">
                                                {inv.client?.matriculeFiscal || 'Standard Client'}
                                            </div>
                                        </div>

                                        {/* Financial Breakdown */}
                                        <div className="il-card-fin-strip">
                                            <div className="il-card-fin-col">
                                                <span>Total TTC</span>
                                                <strong>{total.toFixed(3)} DT</strong>
                                            </div>
                                            <div className="il-card-fin-col">
                                                <span>Encaissé</span>
                                                <strong className="positive">{paid.toFixed(3)} DT</strong>
                                            </div>
                                            {inv.status !== 'Paid' && (
                                                <div className="il-card-fin-col">
                                                    <span>Reste Dû</span>
                                                    <strong className="danger">{remaining.toFixed(3)} DT</strong>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Action Buttons */}
                                        <div className="il-card-actions">
                                            {inv.status !== 'Paid' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    className="il-action-btn pay"
                                                >
                                                    <CreditCard size={15} />
                                                    <span>Encaisser</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveInvoice(inv);
                                                    setShowCompanySelect(true);
                                                }}
                                                className="il-action-btn pdf"
                                            >
                                                <Download size={15} />
                                                <span>Télécharger PDF</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Payment Modal */}
            {selectedInvoice && (
                <PaymentModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onSuccess={() => {
                        fetchInvoices();
                        setSelectedInvoice(null);
                    }}
                />
            )}

            {/* Company Select Modal */}
            {showCompanySelect && (
                <div className="il-modal-overlay" onClick={() => setShowCompanySelect(false)}>
                    <div className="il-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="il-modal-body" style={{ textAlign: 'center', padding: '28px 24px' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.2), rgba(161, 98, 7, 0.25))',
                                border: '1px solid rgba(202, 138, 4, 0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 14px auto'
                            }}>
                                <Building2 size={26} color="#fbbf24" />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0' }}>Select Invoice Brand Header</h2>
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '6px 0 20px 0' }}>Choose the commercial entity profile for PDF printout</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDownload(activeInvoice._id, activeInvoice.number, 'bright');
                                        setShowCompanySelect(false);
                                    }}
                                    style={{
                                        padding: '14px 18px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                        color: '#fff',
                                        fontSize: '14.5px',
                                        fontWeight: '800',
                                        borderRadius: '14px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <Sparkles size={18} /> Bright Stage Official
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDownload(activeInvoice._id, activeInvoice.number, 'square');
                                        setShowCompanySelect(false);
                                    }}
                                    style={{
                                        padding: '14px 18px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: '#fff',
                                        fontSize: '14.5px',
                                        fontWeight: '800',
                                        borderRadius: '14px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <Building2 size={18} /> Square Event Official
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCompanySelect(false)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#94a3b8',
                                        padding: '11px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '13px'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ── CREATE INVOICE MODAL ── */}
            {showInvoiceModal && (
                <InvoiceBuilder
                    isOpen={showInvoiceModal}
                    onClose={() => setShowInvoiceModal(false)}
                    onSuccess={() => {
                        setShowInvoiceModal(false);
                        fetchInvoices();
                    }}
                />
            )}
        </div>
    );
};

export default InvoiceList;
