import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { UserCheck, Search, Plus, Truck, CheckCircle2, PauseCircle, Edit3, Trash2 } from 'lucide-react';
import './Logistics.css'; 
import DriverModal from './DriverModal';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DriverView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', licenseNumber: '', cin: '', phone: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(`${API_URL}/drivers`);
            setDrivers(res.data);
        } catch (err) {
            console.error("Error fetching drivers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await axios.put(`${API_URL}/drivers/${editingId}`, formData);
                showSuccess("Driver record updated successfully", "Fleet Operations");
            } else {
                await axios.post(`${API_URL}/drivers`, formData);
                showSuccess("New driver assigned to fleet roster", "Success");
            }
            setShowModal(false);
            setFormData({ name: '', licenseNumber: '', cin: '', phone: '', status: 'Active' });
            setEditingId(null);
            fetchDrivers();
        } catch (err) {
            showError("System error saving driver", "Error");
        }
    };

    const handleEdit = (driver) => {
        setFormData({
            ...driver,
            name: driver.name || '',
            licenseNumber: driver.licenseNumber || '',
            cin: driver.cin || '',
            phone: driver.phone || '',
            status: driver.status || 'Active'
        });
        setEditingId(driver._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const ok = await confirm("Remove this driver from the fleet registry?");
        if (!ok) return;
        try {
            await axios.delete(`${API_URL}/drivers/${id}`);
            showSuccess("Driver removed", "Logistics");
            fetchDrivers();
        } catch (err) {
            showError("Could not delete driver", "Error");
        }
    };

    const filteredDrivers = drivers.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = drivers.filter(d => d.status === 'Active').length;
    const inactiveCount = drivers.filter(d => d.status !== 'Active').length;

    return (
        <div style={{ padding: '35px 50px', maxWidth: '1600px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#34d399', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)'
                    }}>
                        <UserCheck size={26} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                            Fleet Drivers & Operators
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '4px', margin: 0 }}>
                            Authorized vehicle personnel, transport licenses, and contact routing
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: '#94a3b8', display: 'flex' }}>
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search driver or license..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '260px',
                                padding: '12px 16px 12px 42px',
                                background: 'rgba(18, 19, 28, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '13px'
                            }}
                        />
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', licenseNumber: '', cin: '', phone: '', status: 'Active' });
                                setShowModal(true);
                            }}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '700',
                                fontSize: '13.5px',
                                cursor: 'pointer',
                                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'transform 0.2s ease'
                            }}
                        >
                            <Plus size={16} /> Register New Driver
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '32px' }}>
                <div style={{
                    background: 'linear-gradient(180deg, rgba(26, 27, 40, 0.7) 0%, rgba(18, 19, 28, 0.85) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>{drivers.length}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>Total Roster</div>
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(180deg, rgba(26, 27, 40, 0.7) 0%, rgba(18, 19, 28, 0.85) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#34d399' }}>{activeCount}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>Active On Road</div>
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(180deg, rgba(26, 27, 40, 0.7) 0%, rgba(18, 19, 28, 0.85) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PauseCircle size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#f87171' }}>{inactiveCount}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>Off Duty / Rest</div>
                    </div>
                </div>
            </div>

            {/* Drivers Cards Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', color: '#10b981', padding: '80px', fontSize: '15px' }}>
                    Accessing Fleet Data...
                </div>
            ) : filteredDrivers.length === 0 ? (
                <div style={{
                    background: 'rgba(26, 27, 40, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px', padding: '60px', textAlign: 'center', color: '#64748b'
                }}>
                    No drivers found matching your search.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px' }}>
                    {filteredDrivers.map(driver => (
                        <div
                            key={driver._id}
                            style={{
                                background: 'linear-gradient(180deg, rgba(26, 27, 40, 0.75) 0%, rgba(18, 19, 28, 0.9) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '22px',
                                padding: '22px',
                                backdropFilter: 'blur(16px)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div style={{
                                        width: '44px', height: '44px',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: '800', color: '#34d399',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}>
                                        {driver.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{
                                        fontSize: '10.5px', fontWeight: '800', padding: '3px 10px', borderRadius: '100px',
                                        background: driver.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: driver.status === 'Active' ? '#4ade80' : '#f87171',
                                        border: `1px solid ${driver.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        letterSpacing: '0.5px'
                                    }}>
                                        {driver.status.toUpperCase()}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 3px 0', fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                                    {driver.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Fleet Specialist & Logistics Operator</p>

                                <div style={{
                                    marginTop: '16px',
                                    background: 'rgba(10, 11, 18, 0.4)',
                                    borderRadius: '14px',
                                    padding: '12px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    fontSize: '12.5px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>License Permit</span>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontWeight: '800',
                                            color: '#34d399',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            fontSize: '11.5px'
                                        }}>
                                            {driver.licenseNumber}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Direct Phone</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{driver.phone || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {canEdit && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <button
                                        onClick={() => handleEdit(driver)}
                                        style={{
                                            flex: 1, padding: '8px 12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '10px',
                                            color: '#fff', fontSize: '12px', fontWeight: '700',
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(driver._id)}
                                        style={{
                                            padding: '8px 12px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '10px',
                                            color: '#f87171', fontSize: '13px',
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Ultra-Modern & Creative Driver Modal */}
            <DriverModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                editingId={editingId}
            />
        </div>
    );
};

export default DriverView;
