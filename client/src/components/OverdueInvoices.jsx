import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useConfirm, useDialog } from '../context/ConfirmContext';
import { Clock, CheckCircle2, Mail, CreditCard, AlertTriangle, DollarSign, FileWarning } from 'lucide-react';
import './OverdueInvoices.css';

const OverdueInvoices = () => {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { showAlert } = useDialog();
    const [overdueInvoices, setOverdueInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOverdueInvoices();
    }, []);

    const fetchOverdueInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invoices');
            const now = new Date();

            // Filter overdue: status is not Paid and dueDate has passed
            const overdue = res.data.filter(inv => {
                if (['Paid', 'Cancelled', 'Draft'].includes(inv.status)) return false;
                if (!inv.dueDate) return false;
                return new Date(inv.dueDate) < now;
            });

            // Sort by oldest due date first
            overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            setOverdueInvoices(overdue);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (invoiceId) => {
        const ok = await confirm({
            title: "Envoi de rappel",
            message: "Voulez-vous vraiment envoyer un email de rappel de paiement au client ?",
            type: "warning",
            confirmText: "Envoyer le rappel",
            cancelText: "Annuler"
        });
        if (!ok) return;

        try {
            await api.post(`/invoices/${invoiceId}/reminders`);
            await showAlert({
                title: "Rappel envoyé",
                message: "Le rappel de paiement a été envoyé avec succès au client.",
                type: "success"
            });
            fetchOverdueInvoices();
        } catch (err) {
            await showAlert({
                title: "Échec de l'envoi",
                message: "Impossible d'envoyer le rappel : " + (err.response?.data?.error || err.message),
                type: "danger"
            });
        }
    };

    const getDaysOverdue = (dueDate) => {
        const diff = new Date() - new Date(dueDate);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getSeverity = (days) => {
        if (days > 60) return 'red';
        if (days > 30) return 'orange';
        return 'yellow';
    };

    const getSeverityClass = (days) => {
        if (days > 60) return 'severity-red';
        if (days > 30) return 'severity-orange';
        return 'severity-yellow';
    };

    const getTotalOverdue = () =>
        overdueInvoices.reduce((sum, inv) =>
            sum + (inv.financials.totalInclTax - (inv.totalPaid || 0)), 0);

    const getCriticalCount = () =>
        overdueInvoices.filter(inv => getDaysOverdue(inv.dueDate) > 60).length;

    if (loading) {
        return (
            <div className="oi-container">
                <div className="oi-loading">
                    <Clock size={36} className="oi-loading-icon" />
                    <span>Chargement des factures en retard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="oi-container">
            {/* ── Page Header ── */}
            <div className="oi-header">
                <div className="oi-header-left">
                    <div className="oi-header-icon">
                        <AlertTriangle size={26} />
                    </div>
                    <div className="oi-header-titles">
                        <h1>Overdue Invoices</h1>
                        <p className="oi-header-subtext">
                            Track and follow up on late payments · Recovery dashboard
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPI Banner ── */}
            <div className="oi-kpi-banner">
                <div className="oi-kpi-card danger">
                    <div className="oi-kpi-icon danger-icon">
                        <DollarSign size={22} />
                    </div>
                    <div className="oi-kpi-body">
                        <div className="oi-kpi-value danger-val">
                            {getTotalOverdue().toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                        </div>
                        <div className="oi-kpi-label">Total Overdue</div>
                    </div>
                </div>

                <div className="oi-kpi-card warning">
                    <div className="oi-kpi-icon warning-icon">
                        <FileWarning size={22} />
                    </div>
                    <div className="oi-kpi-body">
                        <div className="oi-kpi-value warning-val">
                            {overdueInvoices.length} Invoice{overdueInvoices.length !== 1 ? 's' : ''}
                        </div>
                        <div className="oi-kpi-label">Awaiting Recovery</div>
                    </div>
                </div>

                <div className="oi-kpi-card info">
                    <div className="oi-kpi-icon info-icon">
                        <Clock size={22} />
                    </div>
                    <div className="oi-kpi-body">
                        <div className="oi-kpi-value info-val">
                            {getCriticalCount()} Critical
                        </div>
                        <div className="oi-kpi-label">Over 60 Days</div>
                    </div>
                </div>
            </div>

            {/* ── Invoice List ── */}
            {overdueInvoices.length === 0 ? (
                <div className="oi-empty">
                    <div className="oi-empty-icon">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3>All Clear!</h3>
                    <p>No overdue invoices at the moment. All payments are on track.</p>
                </div>
            ) : (
                <div className="oi-list">
                    {overdueInvoices.map(inv => {
                        const daysOverdue = getDaysOverdue(inv.dueDate);
                        const amountDue = inv.financials.totalInclTax - (inv.totalPaid || 0);
                        const severity = getSeverity(daysOverdue);
                        const severityClass = getSeverityClass(daysOverdue);

                        return (
                            <div key={inv._id} className={`oi-card ${severityClass}`}>
                                {/* Invoice Info */}
                                <div className="oi-card-info">
                                    <span className="oi-card-number">{inv.number}</span>
                                    <div className="oi-card-client">{inv.client?.name || 'Unknown Client'}</div>
                                    <div className="oi-card-issued">
                                        Issued: {new Date(inv.date).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="oi-card-due">
                                    <div className="oi-col-label">Due Date</div>
                                    <div className="oi-card-due-date">
                                        {new Date(inv.dueDate).toLocaleDateString()}
                                    </div>
                                    <span className={`oi-days-badge ${severity}`}>
                                        <Clock size={11} />
                                        {daysOverdue}d overdue
                                    </span>
                                </div>

                                {/* Amount Due */}
                                <div className="oi-card-amount">
                                    <div className="oi-col-label">Amount Due</div>
                                    <div className="oi-amount-value">
                                        {amountDue.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                                    </div>
                                    {inv.totalPaid > 0 && (
                                        <span className="oi-paid-note">
                                            Paid: {inv.totalPaid.toFixed(3)} DT
                                        </span>
                                    )}
                                </div>

                                {/* Reminders */}
                                <div className="oi-card-reminders">
                                    <div className="oi-col-label">Reminders</div>
                                    <div className="oi-reminder-count">{inv.reminders?.length || 0}</div>
                                    {inv.reminders && inv.reminders.length > 0 && (
                                        <div className="oi-reminder-last">
                                            Last: {new Date(inv.reminders[inv.reminders.length - 1].date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="oi-card-actions">
                                    <button
                                        className="oi-btn oi-btn-reminder"
                                        onClick={() => handleSendReminder(inv._id)}
                                    >
                                        <Mail size={15} />
                                        Send Reminder
                                    </button>
                                    <button
                                        className="oi-btn oi-btn-payment"
                                        onClick={() => navigate('/invoices')}
                                    >
                                        <CreditCard size={15} />
                                        Record Payment
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OverdueInvoices;
