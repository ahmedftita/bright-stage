import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/ConfirmContext';
import { CONFIG } from '../../config';
import { Send, User, Shield, CalendarOff, Check, X } from 'lucide-react';

const API_URL = CONFIG.API_URL;

const LeaveRequestsPanel = () => {
    const { user } = useAuth();
    const { showAlert } = useDialog();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Form state
    const [type, setType] = useState('Vacation');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const canManage = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        if (canManage) setIsAdminMode(true);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [isAdminMode]);

    const fetchData = async () => {
        try {
            const endpoint = (isAdminMode && canManage) ? `${API_URL}/hr/leaves` : `${API_URL}/hr/leaves/me`;
            const res = await axios.get(endpoint);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!startDate || !endDate || !reason) {
            await showAlert({
                title: "Champs requis",
                message: "Veuillez remplir tous les champs de la demande de congé.",
                type: "warning"
            });
            return;
        }
        try {
            await axios.post(`${API_URL}/hr/leaves`, { type, startDate, endDate, reason });
            await showAlert({
                title: "Demande envoyée",
                message: "Votre demande de congé a été enregistrée avec succès.",
                type: "success"
            });
            setReason('');
            setStartDate('');
            setEndDate('');
            fetchData();
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Erreur lors de l'envoi de la demande de congé : " + (err.response?.data?.message || err.message),
                type: "danger"
            });
        }
    };

    const handleAction = async (id, status) => {
        try {
            await axios.put(`${API_URL}/hr/leaves/${id}/status`, { status });
            fetchData();
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Erreur lors de la mise à jour du statut du congé.",
                type: "danger"
            });
        }
    };

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#818cf8' }}>Loading leave registry...</div>;
    }

    return (
        <div className="hr-grid">
            {/* Request Form (Visible if not in pure admin mode or for personal filing) */}
            {!isAdminMode && (
                <div className="hr-card">
                    <h3 className="card-title">Request Leave</h3>
                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-12px', marginBottom: '20px' }}>
                        Submit vacation, medical, or personal leave for manager approval.
                    </p>

                    <div>
                        <label className="label-text">Leave Type</label>
                        <select className="styled-select" value={type} onChange={e => setType(e.target.value)}>
                            <option>Vacation</option>
                            <option>Sick Leave</option>
                            <option>Personal</option>
                            <option>Special Event / Marriage</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label className="label-text">Start Date</label>
                        <input type="date" className="styled-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label className="label-text">End Date</label>
                        <input type="date" className="styled-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label className="label-text">Reason & Notes</label>
                        <textarea
                            className="styled-input"
                            rows="3"
                            placeholder="Provide brief context for this request..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>

                    <button className="btn-primary" style={{ marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSubmit}>
                        <Send size={15} /> Submit Leave Request
                    </button>
                </div>
            )}

            {/* Leave Requests Ledger */}
            <div className={`hr-card ${isAdminMode ? 'full-width' : ''}`}>
                <div className="hr-panel-header">
                    <div>
                        <h3 className="card-title" style={{ margin: 0 }}>
                            {isAdminMode ? 'Staff Leave Requests (Admin)' : 'My Leave Ledger'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                            {isAdminMode ? 'Review, authorize or reject employee absence requests' : 'Status and history of your requested days off'}
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

                <div className="item-list">
                    {requests.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No leave requests found.
                        </div>
                    ) : (
                        requests.map(r => (
                            <div key={r._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '32px', height: '32px', borderRadius: '10px',
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#818cf8', flexShrink: 0
                                        }}>
                                            <CalendarOff size={16} />
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>
                                                {isAdminMode ? (r.user?.name || 'Employee') : r.type}
                                            </div>
                                            {isAdminMode && (
                                                <div style={{ fontSize: '11.5px', color: '#818cf8', fontWeight: '600' }}>
                                                    {r.type}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                                        {r.status}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                    gap: '10px',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    fontSize: '13px'
                                }}>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Duration</span>
                                        <span style={{ color: '#fff', fontWeight: '600' }}>
                                            {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Reason</span>
                                        <span style={{ color: '#cbd5e1' }}>{r.reason || 'No description provided'}</span>
                                    </div>
                                </div>

                                {isAdminMode && r.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
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
                                            onClick={() => handleAction(r._id, 'Approved')}
                                        >
                                            <Check size={16} /> Approve Request
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
                                            onClick={() => handleAction(r._id, 'Rejected')}
                                        >
                                            <X size={16} /> Reject Request
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

export default LeaveRequestsPanel;
