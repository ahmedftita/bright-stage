import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import './Logistics.css';
import FreelancerModal from './FreelancerModal';
import { CONFIG } from '../config';
import { HardHat, Search, Plus, Users, CheckCircle2, Banknote, Zap, Edit3, Trash2 } from 'lucide-react';

const API_URL = CONFIG.API_URL;

const FreelancerView = () => {
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', specialty: '', dailyRate: '', phone: '', email: '', cin: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();

    const isReadOnly = ['Site Manager'].includes(user?.role);
    const canEdit = !isReadOnly;

    useEffect(() => {
        fetchFreelancers();
    }, []);

    const fetchFreelancers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/freelancers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFreelancers(res.data);
        } catch (err) {
            console.error("Error fetching freelancers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editingId) {
                await axios.put(`${API_URL}/freelancers/${editingId}`, formData, config);
                showSuccess("Freelancer profile updated", "Talent Management");
            } else {
                await axios.post(`${API_URL}/freelancers`, formData, config);
                showSuccess("New talent added to roster", "Success");
            }
            setShowModal(false);
            resetForm();
            fetchFreelancers();
        } catch (err) {
            showError("Operation failed", "Error");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', specialty: '', dailyRate: '', phone: '', email: '', cin: '', status: 'Active' });
        setEditingId(null);
    };

    const handleEdit = (freelancer) => {
        setFormData(freelancer);
        setEditingId(freelancer._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const ok = await confirm("Remove this technician from talent roster?");
        if (!ok) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/freelancers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess("Freelancer removed", "System");
            fetchFreelancers();
        } catch (err) {
            showError("Deletion failed", "Error");
        }
    };

    const filteredFreelancers = freelancers.filter(f =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = freelancers.filter(f => f.status === 'Active').length;
    const avgRate = freelancers.length > 0
        ? Math.round(freelancers.reduce((acc, curr) => acc + (parseFloat(curr.dailyRate) || 0), 0) / freelancers.length)
        : 0;

    return (
        <div className="fv-container">
            {/* Header */}
            <div className="fv-header">
                <div className="fv-title-row">
                    <div className="fv-icon-badge">
                        <HardHat size={24} />
                    </div>
                    <div className="fv-title-text">
                        <h1 className="fv-page-title">Freelancer &amp; Technical Network</h1>
                        <p className="fv-page-sub">External audiovisual engineers, lighting technicians, stage builders, and daily contractors</p>
                    </div>
                </div>

                <div className="fv-header-right">
                    <div className="fv-search-wrap">
                        <span className="fv-search-icon"><Search size={15} /></span>
                        <input
                            type="text"
                            className="fv-search-input"
                            placeholder="Search by name or specialty..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canEdit && (
                        <button className="fv-add-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={16} /> <span className="fv-btn-label">Onboard Freelancer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Strip */}
            <div className="fv-kpi-grid">
                <div className="fv-kpi-card">
                    <div className="fv-kpi-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="fv-kpi-val" style={{ color: '#fff' }}>{freelancers.length}</div>
                        <div className="fv-kpi-label">Rostered Talents</div>
                    </div>
                </div>

                <div className="fv-kpi-card">
                    <div className="fv-kpi-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <div className="fv-kpi-val" style={{ color: '#34d399' }}>{activeCount}</div>
                        <div className="fv-kpi-label">Available for Gig</div>
                    </div>
                </div>

                <div className="fv-kpi-card">
                    <div className="fv-kpi-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                        <Banknote size={20} />
                    </div>
                    <div>
                        <div className="fv-kpi-val" style={{ color: '#fbbf24' }}>{avgRate} TND</div>
                        <div className="fv-kpi-label">Avg Daily Rate</div>
                    </div>
                </div>
            </div>

            {/* Grid of Freelancer Cards */}
            {loading ? (
                <div className="fv-loading">
                    <div className="spinner"></div>
                    <p>Syncing Technical Talent Database...</p>
                </div>
            ) : filteredFreelancers.length === 0 ? (
                <div className="fv-empty">
                    <HardHat size={38} color="#334155" />
                    <p>No technical specialists found matching your search.</p>
                </div>
            ) : (
                <div className="fv-grid">
                    {filteredFreelancers.map(f => (
                        <div key={f._id} className="fv-card">
                            <div>
                                {/* Card Header */}
                                <div className="fv-card-top">
                                    <div className="fv-card-identity">
                                        <div className="fv-card-avatar">
                                            {f.name ? f.name.charAt(0).toUpperCase() : 'T'}
                                        </div>
                                        <div className="fv-card-info-text">
                                            <h3 className="fv-card-name">{f.name}</h3>
                                            <span className="fv-specialty-badge">
                                                <Zap size={11} /> {f.specialty || 'General Technician'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="fv-status-badge" style={{
                                        background: f.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: f.status === 'Active' ? '#4ade80' : '#f87171',
                                        border: `1px solid ${f.status === 'Active' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                                    }}>
                                        {f.status.toUpperCase()}
                                    </span>
                                </div>

                                {/* Card Details */}
                                <div className="fv-card-details">
                                    <div className="fv-detail-row">
                                        <span className="fv-detail-label">Daily Rate</span>
                                        <span className="fv-detail-value" style={{ color: '#34d399' }}>
                                            {f.dailyRate ? `${f.dailyRate} TND` : 'Negotiable'}
                                            <span className="fv-rate-unit">/day</span>
                                        </span>
                                    </div>
                                    <div className="fv-detail-row">
                                        <span className="fv-detail-label">Direct Phone</span>
                                        <span className="fv-detail-value">{f.phone || '—'}</span>
                                    </div>
                                    {f.email && (
                                        <div className="fv-detail-row">
                                            <span className="fv-detail-label">Email</span>
                                            <span className="fv-detail-value fv-email">{f.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {canEdit && (
                                <div className="fv-card-actions">
                                    <button className="fv-action-edit" onClick={() => handleEdit(f)}>
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button className="fv-action-del" onClick={() => handleDelete(f._id)}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Freelancer Modal */}
            <FreelancerModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                editingId={editingId}
            />

            <style>{`
                /* ===== FREELANCER VIEW - RESPONSIVE LAYOUT ===== */
                .fv-container {
                    padding: clamp(14px, 2.5vw, 35px) clamp(12px, 3vw, 50px);
                    max-width: 1600px;
                    margin: 0 auto;
                    min-height: calc(100vh - 80px);
                    color: #fff;
                    box-sizing: border-box;
                    width: 100%;
                    overflow-x: clip;
                }

                /* Header */
                .fv-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: clamp(18px, 2.5vw, 28px);
                    flex-wrap: wrap;
                    gap: 14px;
                }
                .fv-title-row {
                    display: flex;
                    align-items: center;
                    gap: clamp(12px, 1.5vw, 16px);
                    min-width: 0;
                    flex: 1;
                }
                .fv-icon-badge {
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
                .fv-title-text { min-width: 0; }
                .fv-page-title {
                    font-size: clamp(18px, 2.3vw, 30px);
                    font-weight: 800;
                    margin: 0;
                    color: #fff;
                    letter-spacing: -0.5px;
                    line-height: 1.2;
                    word-break: break-word;
                }
                .fv-page-sub {
                    color: #64748b;
                    font-size: clamp(11px, 0.95vw, 13.5px);
                    margin: 4px 0 0 0;
                    font-weight: 500;
                    line-height: 1.4;
                }
                .fv-header-right {
                    display: flex;
                    gap: clamp(8px, 1.2vw, 14px);
                    align-items: center;
                    flex-wrap: wrap;
                    flex-shrink: 0;
                }
                .fv-search-wrap { position: relative; }
                .fv-search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.5;
                    display: flex;
                    align-items: center;
                    pointer-events: none;
                    color: #94a3b8;
                }
                .fv-search-input {
                    width: clamp(180px, 20vw, 270px);
                    padding: 11px 14px 11px 40px;
                    background: rgba(18,19,28,0.8);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    color: #fff;
                    outline: none;
                    font-size: 13px;
                    box-sizing: border-box;
                    transition: all 0.25s ease;
                }
                .fv-search-input:focus {
                    border-color: #6366f1;
                    background: rgba(99,102,241,0.06);
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
                }
                .fv-add-btn {
                    padding: clamp(10px, 1.2vw, 12px) clamp(14px, 1.8vw, 24px);
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border: none;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: clamp(12px, 0.95vw, 13.5px);
                    cursor: pointer;
                    box-shadow: 0 8px 25px rgba(99,102,241,0.3);
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    transition: all 0.25s ease;
                    white-space: nowrap;
                }
                .fv-add-btn:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                    box-shadow: 0 12px 30px rgba(99,102,241,0.4);
                }

                /* KPI Grid */
                .fv-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: clamp(10px, 1.5vw, 18px);
                    margin-bottom: clamp(20px, 2.5vw, 32px);
                }
                .fv-kpi-card {
                    background: linear-gradient(180deg, rgba(26,27,40,0.7) 0%, rgba(18,19,28,0.85) 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: clamp(14px, 1.5vw, 18px);
                    padding: clamp(12px, 1.8vw, 22px) clamp(14px, 2vw, 22px);
                    display: flex;
                    align-items: center;
                    gap: clamp(10px, 1.5vw, 16px);
                    min-width: 0;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                }
                .fv-kpi-card:hover {
                    border-color: rgba(99,102,241,0.2);
                    transform: translateY(-2px);
                }
                .fv-kpi-icon {
                    width: clamp(36px, 4vw, 44px);
                    height: clamp(36px, 4vw, 44px);
                    border-radius: clamp(10px, 1.2vw, 12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .fv-kpi-val {
                    font-size: clamp(16px, 1.8vw, 22px);
                    font-weight: 800;
                    line-height: 1.15;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .fv-kpi-label {
                    font-size: clamp(9px, 0.75vw, 11px);
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                    font-weight: 700;
                    margin-top: 3px;
                }

                /* States */
                .fv-loading {
                    text-align: center;
                    color: #6366f1;
                    padding: clamp(50px, 8vw, 80px) 20px;
                    font-size: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 14px;
                }
                .fv-empty {
                    background: rgba(26,27,40,0.5);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                    padding: clamp(40px, 6vw, 60px) 20px;
                    text-align: center;
                    color: #64748b;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    font-size: 15px;
                }
                .fv-empty p { margin: 0; }

                /* Cards Grid */
                .fv-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 28vw, 340px), 1fr));
                    gap: clamp(14px, 2vw, 22px);
                }

                /* Freelancer Card */
                .fv-card {
                    background: linear-gradient(180deg, rgba(26,27,40,0.75) 0%, rgba(18,19,28,0.9) 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 22px;
                    padding: clamp(16px, 2vw, 24px);
                    backdrop-filter: blur(16px);
                    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                .fv-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    opacity: 0;
                    transition: 0.3s;
                }
                .fv-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(99,102,241,0.4);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                }
                .fv-card:hover::before { opacity: 0.8; }

                /* Card top */
                .fv-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 14px;
                    gap: 10px;
                }
                .fv-card-identity {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    min-width: 0;
                    flex: 1;
                }
                .fv-card-avatar {
                    width: clamp(40px, 4.5vw, 48px);
                    height: clamp(40px, 4.5vw, 48px);
                    background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.25));
                    border-radius: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: clamp(15px, 1.6vw, 18px);
                    font-weight: 800;
                    color: #818cf8;
                    border: 1px solid rgba(99,102,241,0.3);
                    flex-shrink: 0;
                }
                .fv-card-info-text { min-width: 0; }
                .fv-card-name {
                    margin: 0;
                    font-size: clamp(14px, 1.4vw, 18px);
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.3;
                    word-break: break-word;
                }
                .fv-specialty-badge {
                    font-size: 11px;
                    color: #818cf8;
                    font-weight: 700;
                    background: rgba(99,102,241,0.1);
                    padding: 3px 8px;
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                .fv-status-badge {
                    font-size: 10.5px;
                    font-weight: 800;
                    padding: 3px 10px;
                    border-radius: 100px;
                    letter-spacing: 0.5px;
                    flex-shrink: 0;
                    white-space: nowrap;
                }

                /* Card details */
                .fv-card-details {
                    margin-top: 14px;
                    background: rgba(10,11,18,0.4);
                    border-radius: 14px;
                    padding: clamp(10px, 1.5vw, 14px);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 13px;
                }
                .fv-detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                .fv-detail-label {
                    color: #64748b;
                    font-size: 11px;
                    text-transform: uppercase;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .fv-detail-value {
                    color: #fff;
                    font-weight: 600;
                    font-size: 12.5px;
                    text-align: right;
                    max-width: 65%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .fv-email {
                    color: #94a3b8;
                    font-size: 11.5px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .fv-rate-unit { font-size: 10px; color: #64748b; margin-left: 2px; }

                /* Card actions */
                .fv-card-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: clamp(14px, 1.8vw, 20px);
                    padding-top: 14px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .fv-action-edit {
                    flex: 1;
                    padding: 9px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 11px;
                    color: #fff;
                    font-size: 12.5px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }
                .fv-action-edit:hover {
                    background: rgba(99,102,241,0.15);
                    border-color: rgba(99,102,241,0.3);
                }
                .fv-action-del {
                    padding: 9px 13px;
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 11px;
                    color: #f87171;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .fv-action-del:hover {
                    background: rgba(239,68,68,0.2);
                    border-color: rgba(239,68,68,0.4);
                }

                /* ===== RESPONSIVE BREAKPOINTS ===== */
                @media (max-width: 768px) {
                    .fv-header { flex-direction: column; align-items: flex-start; }
                    .fv-header-right { width: 100%; }
                    .fv-search-input { width: 100%; }
                    .fv-search-wrap { flex: 1; min-width: 0; }
                }
                @media (max-width: 600px) {
                    .fv-grid { grid-template-columns: 1fr; }
                    .fv-kpi-grid { gap: 8px; }
                    .fv-kpi-card {
                        padding: 11px;
                        gap: 8px;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                }
                @media (max-width: 480px) {
                    .fv-add-btn { width: 100%; justify-content: center; }
                    .fv-header-right { flex-direction: column; }
                    .fv-kpi-val { font-size: 14px; }
                    .fv-kpi-label { font-size: 8.5px; }
                    .fv-btn-label { display: inline; }
                }
                @media (min-width: 601px) and (max-width: 900px) {
                    .fv-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
};

export default FreelancerView;
