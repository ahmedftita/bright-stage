import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/ConfirmContext';
import './HRView.css';
import {
    Clock,
    CalendarOff,
    CreditCard,
    AlertTriangle,
    FileText,
    CheckCircle2,
    Users,
    Zap,
    User,
    Calendar,
    Tag
} from 'lucide-react';

// Sub-components
import ContractManager from './HR/ContractManager';
import AttendancePanel from './HR/AttendancePanel';
import LeaveRequestsPanel from './HR/LeaveRequestsPanel';
import ExpensesPanel from './HR/ExpensesPanel';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const HRView = () => {
    const { user } = useAuth();
    const { showAlert } = useDialog();
    const [activeTab, setActiveTab] = useState('attendance');

    const isAdmin = ['Founder', 'Manager'].includes(user?.role);
    const isSiteManager = user?.role === 'Site Manager';

    // Tabs definition
    const tabs = [
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'leaves', label: 'Leaves', icon: CalendarOff },
        { id: 'expenses', label: 'Expenses', icon: CreditCard },
    ];

    if (isAdmin) {
        tabs.unshift({ id: 'overview', label: 'Loss Reports', icon: AlertTriangle });
        tabs.push({ id: 'contracts', label: 'Contracts', icon: FileText });
    }

    // Overview State (Loss Reports)
    const [reports, setReports] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [responsible, setResponsible] = useState('');
    const [lossValue, setLossValue] = useState('');
    const [reason, setReason] = useState('Lost on Site/Tour');
    const [kpiData, setKpiData] = useState({
        pendingLeaves: 0,
        activeContracts: 0,
        todayAttendance: 0
    });

    useEffect(() => {
        if (activeTab === 'overview' || isAdmin) {
            fetchOverviewData();
            fetchKPIData();
        }
    }, [activeTab]);

    const fetchOverviewData = async () => {
        try {
            const [repRes, itemRes] = await Promise.all([
                axios.get(`${API_URL}/loss-reports`),
                axios.get(`${API_URL}/inventory`)
            ]);
            setReports(repRes.data);
            setItems(itemRes.data);
        } catch (error) {
            console.error("Error fetching overview data", error);
        }
    };

    const fetchKPIData = async () => {
        try {
            if (isAdmin) {
                const [leavesRes, contractsRes] = await Promise.all([
                    axios.get(`${API_URL}/hr/leaves`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/hr/contracts`).catch(() => ({ data: [] }))
                ]);
                const pending = (leavesRes.data || []).filter(l => l.status === 'Pending').length;
                const activeC = (contractsRes.data || []).filter(c => c.status === 'Active').length;
                setKpiData(prev => ({
                    ...prev,
                    pendingLeaves: pending,
                    activeContracts: activeC
                }));
            }
        } catch (e) {
            console.error("KPI fetch error", e);
        }
    };

    const handleLossSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedItem || !responsible || !lossValue) {
            await showAlert({
                title: "Champs requis",
                message: "Veuillez remplir tous les champs du formulaire de perte.",
                type: "warning"
            });
            return;
        }
        try {
            await axios.post(`${API_URL}/loss-reports`, {
                inventoryItem: selectedItem,
                responsiblePerson: responsible,
                lossValuation: parseFloat(lossValue),
                reason
            });
            await showAlert({
                title: "Perte enregistrée",
                message: "La déclaration de perte a été enregistrée avec succès.",
                type: "success"
            });
            setSelectedItem('');
            setResponsible('');
            setLossValue('');
            fetchOverviewData();
        } catch (error) {
            await showAlert({
                title: "Erreur",
                message: "Erreur lors de la déclaration de perte : " + (error.response?.data?.message || error.message),
                type: "danger"
            });
        }
    };

    const totalLoss = reports.reduce((acc, curr) => acc + (curr.lossValuation || 0), 0);

    const renderOverview = () => (
        <div className="hr-grid">
            {/* Left: Report Form */}
            <div className="hr-card">
                <h3 className="card-title">Report New Loss</h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-12px', marginBottom: '20px' }}>
                    Document incident, assign responsibility, and adjust valuation.
                </p>
                <div>
                    <label className="label-text">Select Inventory Item</label>
                    <select className="styled-select" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                        <option value="">-- Choose Item from Store --</option>
                        {items.map(i => (
                            <option key={i._id} value={i._id}>{i.name} {i.barcode ? `(${i.barcode})` : ''}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginTop: '16px' }}>
                    <label className="label-text">Responsible Staff / Technician</label>
                    <input
                        type="text"
                        className="styled-input"
                        placeholder="e.g. Jean Dupont"
                        value={responsible}
                        onChange={e => setResponsible(e.target.value)}
                    />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <label className="label-text">Loss Valuation (TND / €)</label>
                    <input
                        type="number"
                        className="styled-input"
                        placeholder="0.00"
                        value={lossValue}
                        onChange={e => setLossValue(e.target.value)}
                    />
                </div>
                <div style={{ marginTop: '16px' }}>
                    <label className="label-text">Incident Reason</label>
                    <select className="styled-select" value={reason} onChange={e => setReason(e.target.value)}>
                        <option>Lost on Site/Tour</option>
                        <option>Stolen</option>
                        <option>Broken (Unreported)</option>
                        <option>Negligence</option>
                        <option>Transit Damage</option>
                    </select>
                </div>
                <div style={{ marginTop: '26px', textAlign: 'right' }}>
                    <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleLossSubmit}>
                        <Zap size={16} /> Register Loss Report
                    </button>
                </div>
            </div>

            {/* Right: Overview & History */}
            <div>
                <div className="stat-box">
                    <div className="stat-number">€{totalLoss.toFixed(2)}</div>
                    <div className="stat-label">Total Cumulative Loss Deductible</div>
                </div>

                <div className="hr-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="card-title" style={{ margin: 0 }}>Loss Incident History</h3>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                            {reports.length} {reports.length === 1 ? 'incident' : 'incidents'}
                        </span>
                    </div>

                    <div className="item-list" style={{ maxHeight: '420px' }}>
                        {reports.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                No losses reported. All gear accounted for.
                            </div>
                        ) : (
                            reports.map((rep, idx) => (
                                <div key={idx} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                        <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '14.5px' }}>
                                             {rep.inventoryItem?.name || 'Unknown Article'}
                                        </span>
                                        <span style={{ color: '#f87171', fontWeight: '800', fontSize: '14px', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                                            -€{(rep.lossValuation || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '6px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><User size={13} /> <strong>Resp:</strong> {rep.responsiblePerson}</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> {new Date(rep.dateReported).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Tag size={12} /> {rep.reason}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="hr-container">
            {/* Header */}
            <div className="hr-header-area">
                <div className="hr-title-wrapper">
                    <div className="hr-title-icon-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="hr-page-title">Human Resources & Staff Ops</h1>
                        <p className="hr-subtitle">Time tracking, personnel leaves, employment agreements, and equipment custody</p>
                    </div>
                </div>
            </div>

            {/* Quick KPI Bar for Admins */}
            {isAdmin && (
                <div className="hr-kpi-grid">
                    <div className="hr-kpi-card">
                        <div className="hr-kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <div className="hr-kpi-val">€{totalLoss.toFixed(0)}</div>
                            <div className="hr-kpi-label">Declared Losses</div>
                        </div>
                    </div>

                    <div className="hr-kpi-card">
                        <div className="hr-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarOff size={20} />
                        </div>
                        <div>
                            <div className="hr-kpi-val">{kpiData.pendingLeaves}</div>
                            <div className="hr-kpi-label">Pending Leave Requests</div>
                        </div>
                    </div>

                    <div className="hr-kpi-card">
                        <div className="hr-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="hr-kpi-val">{kpiData.activeContracts}</div>
                            <div className="hr-kpi-label">Active Contracts</div>
                        </div>
                    </div>

                    <div className="hr-kpi-card">
                        <div className="hr-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="hr-kpi-val">HR Active</div>
                            <div className="hr-kpi-label">System Operational</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modern Navigation Tabs */}
            <div className="hr-tabs-nav">
                {tabs.map(tab => {
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`hr-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span className="hr-tab-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <TabIcon size={16} />
                            </span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Views */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'attendance' && <AttendancePanel />}
            {activeTab === 'leaves' && <LeaveRequestsPanel />}
            {activeTab === 'contracts' && <ContractManager />}
            {activeTab === 'expenses' && <ExpensesPanel />}
        </div>
    );
};

export default HRView;
