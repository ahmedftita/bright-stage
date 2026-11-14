import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDialog } from '../../context/ConfirmContext';
import { CONFIG } from '../../config';
import { FileText, Calendar } from 'lucide-react';

const API_URL = CONFIG.API_URL;

const ContractManager = () => {
    const { showAlert } = useDialog();
    const [contracts, setContracts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [userId, setUserId] = useState('');
    const [type, setType] = useState('CDI');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [salary, setSalary] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cRes, uRes] = await Promise.all([
                axios.get(`${API_URL}/hr/contracts`),
                axios.get(`${API_URL}/users`)
            ]);
            setContracts(cRes.data);
            setUsers(uRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        if (!userId || !startDate || !salary) {
            await showAlert({
                title: "Champs requis",
                message: "Veuillez préciser l'employé, la date de début et le salaire mensuel.",
                type: "warning"
            });
            return;
        }
        try {
            await axios.post(`${API_URL}/hr/contracts`, {
                user: userId,
                type,
                startDate,
                endDate: endDate || null,
                salary: parseFloat(salary),
                status: 'Active'
            });
            await showAlert({
                title: "Contrat créé",
                message: "Le contrat de travail a été enregistré avec succès.",
                type: "success"
            });
            setUserId('');
            setStartDate('');
            setEndDate('');
            setSalary('');
            fetchData();
        } catch (err) {
            await showAlert({
                title: "Erreur",
                message: "Erreur lors de la création du contrat : " + (err.response?.data?.message || err.message),
                type: "danger"
            });
        }
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#818cf8' }}>Loading contract archives...</div>;

    return (
        <div className="hr-grid">
            {/* New Contract Form */}
            <div className="hr-card">
                <h3 className="card-title">New Employment Agreement</h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-12px', marginBottom: '20px' }}>
                    Issue or update formal contracts and compensation terms.
                </p>

                <div>
                    <label className="label-text">Select Staff Member</label>
                    <select className="styled-select" value={userId} onChange={e => setUserId(e.target.value)}>
                        <option value="">-- Choose Staff Member --</option>
                        {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <label className="label-text">Contract Framework</label>
                    <select className="styled-select" value={type} onChange={e => setType(e.target.value)}>
                        <option>CDI</option>
                        <option>CDD</option>
                        <option>SIVP</option>
                        <option>Freelance</option>
                        <option>Stage</option>
                    </select>
                </div>

                <div className="contract-date-grid">
                    <div>
                        <label className="label-text">Start Date</label>
                        <input type="date" className="styled-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="label-text">End Date (Optional)</label>
                        <input type="date" className="styled-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <label className="label-text">Monthly Compensation (TND)</label>
                    <input
                        type="number"
                        className="styled-input"
                        placeholder="e.g. 1800.000"
                        value={salary}
                        onChange={e => setSalary(e.target.value)}
                    />
                </div>

                <button className="btn-primary" style={{ marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleCreate}>
                    <FileText size={16} /> Issue Official Contract
                </button>
            </div>

            {/* Active Contracts Roster */}
            <div className="hr-card">
                <div className="hr-panel-header">
                    <div>
                        <h3 className="card-title" style={{ margin: 0 }}>Registered Agreements</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Active and archival staff employment records</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: '700' }}>
                        {contracts.length} Active
                    </span>
                </div>

                <div className="item-list" style={{ maxHeight: '520px' }}>
                    {contracts.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No active contracts on file.
                        </div>
                    ) : (
                        contracts.map(c => (
                            <div key={c._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            color: '#818cf8', fontWeight: '800',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', flexShrink: 0
                                        }}>
                                            {c.user?.name ? c.user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>{c.user?.name || 'Staff Member'}</span>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{c.user?.role || 'Technician'}</div>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                                        background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)'
                                    }}>
                                        {c.type}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={13} /> {new Date(c.startDate).toLocaleDateString()}
                                        {c.endDate && ` → ${new Date(c.endDate).toLocaleDateString()}`}
                                    </div>
                                    <div style={{ fontWeight: '800', color: '#34d399', fontSize: '14px' }}>
                                        {parseFloat(c.salary || 0).toLocaleString()} TND <span style={{ fontSize: '10px', color: '#64748b' }}>/mo</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractManager;
