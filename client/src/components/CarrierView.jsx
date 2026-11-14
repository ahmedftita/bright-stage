import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import CarrierModal from './CarrierModal';
import { Truck, Search, Plus, Users, CheckCircle2, Edit3, Trash2, PackageSearch } from 'lucide-react';
import './CarrierView.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const CarrierView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', cin: '', phone: '',
        vehiclePlate: '', vehicleModel: '', status: 'Active'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCarriers();
    }, []);

    const fetchCarriers = async () => {
        try {
            const res = await axios.get(`${API_URL}/carriers`);
            setCarriers(res.data);
        } catch (err) {
            console.error("Error fetching carriers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await axios.put(`${API_URL}/carriers/${editingId}`, formData);
                showSuccess("Carrier profile updated", "Logistics");
            } else {
                await axios.post(`${API_URL}/carriers`, formData);
                showSuccess("External carrier registered", "Success");
            }
            setShowModal(false);
            resetForm();
            fetchCarriers();
        } catch (err) {
            showError("Failed to save carrier information", "Error");
        }
    };

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', cin: '', phone: '', vehiclePlate: '', vehicleModel: '', status: 'Active' });
        setEditingId(null);
    };

    const handleEdit = (carrier) => {
        setFormData({
            ...carrier,
            firstName: carrier.firstName || '',
            lastName: carrier.lastName || '',
            cin: carrier.cin || '',
            phone: carrier.phone || '',
            vehiclePlate: carrier.vehiclePlate || '',
            vehicleModel: carrier.vehicleModel || '',
            status: carrier.status || 'Active'
        });
        setEditingId(carrier._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const ok = await confirm("Remove this carrier partner permanently?");
        if (!ok) return;
        try {
            await axios.delete(`${API_URL}/carriers/${id}`);
            showSuccess("Carrier removed", "Logistics");
            fetchCarriers();
        } catch (err) {
            showError("Deletion failed", "Error");
        }
    };

    const filteredCarriers = carriers.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = carriers.filter(c => c.status === 'Active').length;

    return (
        <div className="carrier-view-container">
            {/* Header */}
            <div className="carrier-view-header">
                <div className="carrier-view-title-group">
                    <div className="carrier-view-icon-badge">
                        <Truck size={24} />
                    </div>
                    <div className="carrier-view-title-text">
                        <h1 className="carrier-view-title">
                            Carrier Partners &amp; Transporters
                        </h1>
                        <p className="carrier-view-subtitle">
                            External freight partners, third-party heavy vehicles, and courier dispatch
                        </p>
                    </div>
                </div>

                <div className="carrier-view-controls">
                    <div className="carrier-search-wrapper">
                        <span className="carrier-search-icon">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search partner, plate or vehicle..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="carrier-search-input"
                        />
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="carrier-add-btn"
                        >
                            <Plus size={16} />
                            <span>Register Transport Partner</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Strip (KPIs) */}
            <div className="carrier-kpi-grid">
                <div className="carrier-kpi-card">
                    <div className="carrier-kpi-icon blue">
                        <Users size={22} />
                    </div>
                    <div className="carrier-kpi-content">
                        <div className="carrier-kpi-val">{carriers.length}</div>
                        <div className="carrier-kpi-label">Active Partners</div>
                    </div>
                </div>

                <div className="carrier-kpi-card">
                    <div className="carrier-kpi-icon green">
                        <CheckCircle2 size={22} />
                    </div>
                    <div className="carrier-kpi-content">
                        <div className="carrier-kpi-val green">{activeCount}</div>
                        <div className="carrier-kpi-label">Contracted &amp; Ready</div>
                    </div>
                </div>

                <div className="carrier-kpi-card">
                    <div className="carrier-kpi-icon purple">
                        <Truck size={22} />
                    </div>
                    <div className="carrier-kpi-content">
                        <div className="carrier-kpi-val purple">External</div>
                        <div className="carrier-kpi-label">Fleet Type</div>
                    </div>
                </div>
            </div>

            {/* Carriers Grid / State */}
            {loading ? (
                <div className="carrier-loading-state">
                    <div className="carrier-loading-spinner" />
                    <span>Syncing Logistic Partners...</span>
                </div>
            ) : filteredCarriers.length === 0 ? (
                <div className="carrier-empty-state">
                    <div className="carrier-empty-icon">
                        <PackageSearch size={26} />
                    </div>
                    <h3 className="carrier-empty-title">No carrier partners found</h3>
                    <p className="carrier-empty-desc">
                        {searchTerm ? `No results matching "${searchTerm}". Try a different name, plate or model.` : 'No transport partners registered yet. Add your first carrier partner above.'}
                    </p>
                </div>
            ) : (
                <div className="carrier-cards-grid">
                    {filteredCarriers.map(c => {
                        const isActive = c.status === 'Active';
                        return (
                            <div key={c._id} className="carrier-card">
                                <div>
                                    <div className="carrier-card-top">
                                        <div className="carrier-card-profile">
                                            <div className="carrier-avatar">
                                                {c.firstName ? c.firstName.charAt(0).toUpperCase() : 'T'}
                                            </div>
                                            <div className="carrier-profile-text">
                                                <h3 className="carrier-name">
                                                    {c.firstName} {c.lastName}
                                                </h3>
                                                <span className="carrier-vehicle-badge">
                                                    <Truck size={13} /> {c.vehicleModel || 'External Freight'}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`carrier-status-badge ${isActive ? 'active' : 'inactive'}`}>
                                            {(c.status || 'Active').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="carrier-details-box">
                                        <div className="carrier-detail-item">
                                            <span className="carrier-detail-label">Direct Contact</span>
                                            <span className="carrier-detail-value">{c.phone || '—'}</span>
                                        </div>
                                        <div className="carrier-detail-item">
                                            <span className="carrier-detail-label">Plate / Immat</span>
                                            <span className="carrier-plate-badge">
                                                {c.vehiclePlate || 'N/A'}
                                            </span>
                                        </div>
                                        {c.cin && (
                                            <div className="carrier-detail-item full-width">
                                                <span className="carrier-detail-label">National CIN</span>
                                                <span className="carrier-cin-text">{c.cin}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {canEdit && (
                                    <div className="carrier-card-actions">
                                        <button
                                            onClick={() => handleEdit(c)}
                                            className="carrier-edit-btn"
                                        >
                                            <Edit3 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c._id)}
                                            className="carrier-delete-btn"
                                            title="Delete carrier"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Carrier Modal */}
            <CarrierModal
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

export default CarrierView;
