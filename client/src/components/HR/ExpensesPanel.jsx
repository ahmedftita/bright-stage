import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/ConfirmContext';
import { CONFIG } from '../../config';
import {
    Utensils,
    Fuel,
    Building2,
    Wrench,
    CreditCard,
    User,
    Shield,
    Calendar,
    Check,
    X
} from 'lucide-react';

const API_URL = CONFIG.API_URL;

const ExpensesPanel = () => {
    const { user } = useAuth();
    const { showAlert } = useDialog();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Form
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Food');

    const canManage = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        if (canManage) setIsAdminMode(true);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [isAdminMode]);

    const fetchData = async () => {
        try {
            const endpoint = (isAdminMode && canManage) ? `${API_URL}/hr/expenses` : `${API_URL}/hr/expenses/me`;
            const res = await axios.get(endpoint);
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!amount || !description) {
            await showAlert({
                title: "Champs requis",
                message: "Veuillez préciser le montant et une description.",
                type: "warning"
            });
            return;
        }
        try {
            await axios.post(`${API_URL}/hr/expenses`, {
                amount: parseFloat(amount),
                description,
                category
            });
            await showAlert({
                title: "Dépense enregistrée",
                message: "La note de frais a été soumise avec succès.",
                type: "success"
            });
            setAmount('');
            setDescription('');
            fetchData();
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Erreur lors de l'enregistrement de la dépense : " + (err.response?.data?.message || err.message),
                type: "danger"
            });
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/hr/expenses/${id}/status`, { status });
            fetchData();
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Erreur lors de la mise à jour du statut de la dépense.",
                type: "danger"
            });
        }
    };

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'Food': return <Utensils size={18} color="#818cf8" />;
            case 'Transport': return <Fuel size={18} color="#fbbf24" />;
            case 'Accommodation': return <Building2 size={18} color="#38bdf8" />;
            case 'Equipment': return <Wrench size={18} color="#34d399" />;
            default: return <CreditCard size={18} color="#c084fc" />;
        }
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#818cf8' }}>Loading expense accounts...</div>;

    return (
        <div className="hr-grid">
            {/* Submit Expense Form */}
            {!isAdminMode && (
                <div className="hr-card">
                    <h3 className="card-title">Claim New Expense</h3>
                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-12px', marginBottom: '20px' }}>
                        File travel, sustenance, or emergency field procurement for reimbursement.
                    </p>

                    <div>
                        <label className="label-text">Amount in TND</label>
                        <input
                            type="number"
                            className="styled-input"
                            placeholder="0.000"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label className="label-text">Expense Category</label>
                        <select className="styled-select" value={category} onChange={e => setCategory(e.target.value)}>
                            <option>Food</option>
                            <option>Transport</option>
                            <option>Accommodation</option>
                            <option>Equipment</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label className="label-text">Purpose / Description</label>
                        <textarea
                            className="styled-input"
                            rows="3"
                            placeholder="Provide details and event/tour reference..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <button className="btn-primary" style={{ marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSubmit}>
                        <CreditCard size={15} /> Submit Expense Voucher
                    </button>
                </div>
            )}

            {/* Expenses List */}
            <div className={`hr-card ${isAdminMode ? 'full-width' : ''}`}>
                <div className="hr-panel-header">
                    <div>
                        <h3 className="card-title" style={{ margin: 0 }}>
                            {isAdminMode ? 'Personnel Expense Claims (Admin)' : 'My Expense Ledger'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                            {isAdminMode ? 'Review, reimburse or reject technician expense vouchers' : 'Track the approval and disbursement status of your receipts'}
                        </p>
                    </div>

                    {canManage && (
                        <button
                            className="btn-primary"
                            style={{
                                padding: '8px 18px',
                                fontSize: '12px',
                                background: isAdminMode ? 'rgba(99, 102, 241, 0.2)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                border: isAdminMode ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexShrink: 0
                            }}
                            onClick={() => setIsAdminMode(!isAdminMode)}
                        >
                            {isAdminMode ? (
                                <>
                                    <User size={14} /> Switch to My View
                                </>
                            ) : (
                                <>
                                    <Shield size={14} /> Switch to Admin View
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="item-list" style={{ maxHeight: '520px' }}>
                    {expenses.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No expense records on ledger.
                        </div>
                    ) : (
                        expenses.map(e => (
                            <div key={e._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '12px',
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {getCategoryIcon(e.category)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>
                                                {parseFloat(e.amount || 0).toLocaleString()} TND
                                            </div>
                                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                                {e.category} {isAdminMode && e.user?.name ? `• by ${e.user.name}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`status-badge status-${e.status.toLowerCase()}`}>
                                        {e.status}
                                    </span>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                                    {e.description || 'No description provided'}
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} /> {new Date(e.date).toLocaleDateString()}
                                    </div>
                                </div>

                                {isAdminMode && e.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button
                                            className="btn-primary"
                                            style={{
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                flex: 1,
                                                minWidth: '130px',
                                                padding: '9px 16px',
                                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => handleStatusUpdate(e._id, 'Approved')}
                                        >
                                            <Check size={16} /> Approve Reimbursement
                                        </button>
                                        <button
                                            className="btn-primary"
                                            style={{
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                flex: 1,
                                                minWidth: '130px',
                                                padding: '9px 16px',
                                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => handleStatusUpdate(e._id, 'Rejected')}
                                        >
                                            <X size={16} /> Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpensesPanel;
