import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { Truck, Car, Package, Search, Plus, Scale, Edit3, Trash2, PackageSearch } from 'lucide-react';
import VehicleModal from './VehicleModal';
import './VehicleView.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const VehicleView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const confirm = useConfirm();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await axios.get(`${API_URL}/vehicles`);
            setVehicles(res.data);
        } catch (err) {
            console.error("Error fetching vehicles:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await axios.put(`${API_URL}/vehicles/${editingId}`, formData);
                showSuccess("Vehicle specifications updated", "Fleet Management");
            } else {
                await axios.post(`${API_URL}/vehicles`, formData);
                showSuccess("New vehicle commissioned to fleet", "Success");
            }
            setShowModal(false);
            setFormData({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' });
            setEditingId(null);
            fetchVehicles();
        } catch (err) {
            showError("Failed to save vehicle data", "Error");
        }
    };

    const handleEdit = (vehicle) => {
        setFormData({
            ...vehicle,
            plateNumber: vehicle.plateNumber || '',
            model: vehicle.model || '',
            type: vehicle.type || 'Truck',
            capacityWeight: vehicle.capacityWeight !== undefined && vehicle.capacityWeight !== null ? vehicle.capacityWeight : '',
            status: vehicle.status || 'Active'
        });
        setEditingId(vehicle._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const ok = await confirm("Commence decommissioning of this vehicle? This action is permanent.");
        if (!ok) return;
        try {
            await axios.delete(`${API_URL}/vehicles/${id}`);
            showSuccess("Vehicle removed from fleet", "Logistics");
            fetchVehicles();
        } catch (err) {
            showError("Operation failed", "Error");
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'Truck': return <Truck size={20} color="#a78bfa" />;
            case 'Van': return <Truck size={20} color="#a78bfa" />;
            case 'Car': return <Car size={20} color="#a78bfa" />;
            default: return <Package size={20} color="#a78bfa" />;
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const truckCount = vehicles.filter(v => v.type === 'Truck').length;
    const vanCount = vehicles.filter(v => v.type === 'Van').length;
    const totalCapacity = vehicles.reduce((acc, curr) => acc + (parseFloat(curr.capacityWeight) || 0), 0);

    return (
        <div className="vehicle-view-container">
            {/* Header */}
            <div className="vehicle-view-header">
                <div className="vehicle-view-title-group">
                    <div className="vehicle-view-icon-badge">
                        <Truck size={24} color="#a78bfa" />
                    </div>
                    <div className="vehicle-view-title-text">
                        <h1 className="vehicle-view-title">
                            Asset Fleet Control
                        </h1>
                        <p className="vehicle-view-subtitle">
                            Internal rolling stock, vehicle payload capacity, and commission status
                        </p>
                    </div>
                </div>

                <div className="vehicle-view-controls">
                    <div className="vehicle-search-wrapper">
                        <span className="vehicle-search-icon">
                            <Search size={15} color="#94a3b8" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search model or plate..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="vehicle-search-input"
                        />
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' });
                                setShowModal(true);
                            }}
                            className="vehicle-add-btn"
                        >
                            <Plus size={16} />
                            <span>Commission Vehicle</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Strip (KPIs) */}
            <div className="vehicle-kpi-grid">
                <div className="vehicle-kpi-card">
                    <div className="vehicle-kpi-icon purple">
                        <Car size={22} />
                    </div>
                    <div className="vehicle-kpi-content">
                        <div className="vehicle-kpi-val">{vehicles.length}</div>
                        <div className="vehicle-kpi-label">Active Fleet</div>
                    </div>
                </div>

                <div className="vehicle-kpi-card">
                    <div className="vehicle-kpi-icon blue">
                        <Truck size={22} />
                    </div>
                    <div className="vehicle-kpi-content">
                        <div className="vehicle-kpi-val blue">{truckCount} Trucks / {vanCount} Vans</div>
                        <div className="vehicle-kpi-label">Vehicle Categories</div>
                    </div>
                </div>

                <div className="vehicle-kpi-card">
                    <div className="vehicle-kpi-icon green">
                        <Scale size={22} />
                    </div>
                    <div className="vehicle-kpi-content">
                        <div className="vehicle-kpi-val green">{totalCapacity.toLocaleString()} kg</div>
                        <div className="vehicle-kpi-label">Combined Payload</div>
                    </div>
                </div>
            </div>

            {/* Vehicles Grid */}
            {loading ? (
                <div className="vehicle-loading-state">
                    <div className="vehicle-loading-spinner" />
                    <span>Analyzing Fleet Assets...</span>
                </div>
            ) : filteredVehicles.length === 0 ? (
                <div className="vehicle-empty-state">
                    <div className="vehicle-empty-icon">
                        <PackageSearch size={26} />
                    </div>
                    <h3 className="vehicle-empty-title">No vehicles found</h3>
                    <p className="vehicle-empty-desc">
                        {searchTerm ? `No results matching "${searchTerm}". Try a different model or plate number.` : 'No vehicles registered in fleet yet. Commission your first vehicle above.'}
                    </p>
                </div>
            ) : (
                <div className="vehicle-cards-grid">
                    {filteredVehicles.map(v => {
                        const statusLower = (v.status || 'Active').toLowerCase();
                        return (
                            <div key={v._id} className="vehicle-card">
                                <div>
                                    <div className="vehicle-card-top">
                                        <div className="vehicle-card-profile">
                                            <div className="vehicle-avatar">
                                                {getTypeIcon(v.type)}
                                            </div>
                                            <div className="vehicle-profile-text">
                                                <h3 className="vehicle-name">
                                                    {v.model}
                                                </h3>
                                                <span className="vehicle-class-badge">
                                                    {v.type} Class
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`vehicle-status-badge ${statusLower}`}>
                                            {(v.status || 'Active').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="vehicle-details-box">
                                        <div className="vehicle-detail-row">
                                            <span className="vehicle-detail-label">Official Registration</span>
                                            <span className="vehicle-plate-badge">
                                                {v.plateNumber}
                                            </span>
                                        </div>
                                        <div className="vehicle-detail-row">
                                            <span className="vehicle-detail-label">Cargo Capacity</span>
                                            <span className="vehicle-capacity-val">
                                                {v.capacityWeight ? `${Number(v.capacityWeight).toLocaleString()} kg` : 'Standard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {canEdit && (
                                    <div className="vehicle-card-actions">
                                        <button
                                            onClick={() => handleEdit(v)}
                                            className="vehicle-edit-btn"
                                        >
                                            <Edit3 size={13} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(v._id)}
                                            className="vehicle-delete-btn"
                                            title="Delete vehicle"
                                            aria-label="Delete Vehicle"
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

            {/* Fleet Vehicle Modal */}
            <VehicleModal
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

export default VehicleView;
