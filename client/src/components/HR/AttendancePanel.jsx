import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Play, Square, LogIn, LogOut, Zap, MapPin, Monitor } from 'lucide-react';

const API_URL = CONFIG.API_URL;

const AttendancePanel = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myStatus, setMyStatus] = useState(null);

    const isAdmin = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        fetchData();
        fetchMyStatus();
    }, []);

    const fetchMyStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/hr/attendance/status`);
            setMyStatus(res.data);
        } catch (err) {
            console.error("Error fetching my status", err);
        }
    };

    const fetchData = async () => {
        if (!isAdmin) return;
        try {
            const res = await axios.get(`${API_URL}/hr/attendance`);
            setAttendances(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            await axios.post(`${API_URL}/hr/attendance/check-in`, {
                location: { address: 'PC Web App' },
                notes: 'PC Check-in'
            });
            showSuccess("Status updated: ACTIVE ON DUTY", "Clock In");
            fetchMyStatus();
            if (isAdmin) fetchData();
        } catch (err) {
            showError(err.response?.data?.error || err.message, "System Error");
        }
    };

    const handleClockOut = async () => {
        try {
            await axios.post(`${API_URL}/hr/attendance/check-out`, {
                notes: 'PC Check-out'
            });
            showSuccess("Status updated: SHIFT ENDED", "Clock Out");
            fetchMyStatus();
            if (isAdmin) fetchData();
        } catch (err) {
            showError(err.response?.data?.error || err.message, "System Error");
        }
    };

    if (loading && isAdmin) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#818cf8' }}>Synchronizing attendance ledger...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Personal Time Clock Card */}
            <div className="punch-clock-card">
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className={`punch-status-indicator ${myStatus?.isCheckedIn ? 'punch-status-active' : 'punch-status-inactive'}`}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: myStatus?.isCheckedIn ? '#4ade80' : '#94a3b8',
                            boxShadow: myStatus?.isCheckedIn ? '0 0 10px #4ade80' : 'none'
                        }}></span>
                        {myStatus?.isCheckedIn ? 'ACTIVE ON SHIFT' : 'CURRENTLY OFF DUTY'}
                    </div>

                    <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 10px 0', color: '#fff' }}>
                        {user?.name || 'Operator'}
                    </h2>
                    
                    {myStatus?.isCheckedIn ? (
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>
                            Checked in at <strong style={{ color: '#4ade80' }}>{new Date(myStatus.currentSession?.checkIn).toLocaleTimeString()}</strong>. All operational hours are logged.
                        </p>
                    ) : (
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>
                            Press Start Work when your shift begins to accurately track hours and site presence.
                        </p>
                    )}

                    <div>
                        {myStatus?.isCheckedIn ? (
                            <button onClick={handleClockOut} className="punch-btn-stop" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Square size={16} fill="currentColor" /> STOP WORK / CLOCK OUT
                            </button>
                        ) : (
                            <button onClick={handleClockIn} className="punch-btn-start" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Play size={16} fill="currentColor" /> START WORK / CLOCK IN
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Global Ledger */}
            {isAdmin && (
                <div className="hr-card full-width">
                    <div className="hr-panel-header">
                        <div>
                            <h3 className="card-title" style={{ margin: 0 }}>Company Attendance Log</h3>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Real-time audit trail of all staff clock-ins and departures</p>
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                            {attendances.length} Entries
                        </span>
                    </div>

                    <div className="hr-table-container">
                        <table className="hr-table">
                            <thead>
                                <tr>
                                    <th className="col-emp">Employee</th>
                                    <th className="col-shift">Shift Type</th>
                                    <th className="col-time">Time Interval</th>
                                    <th className="col-loc">Location / Node</th>
                                    <th className="col-notes">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                            No attendance logs for current period.
                                        </td>
                                    </tr>
                                ) : (
                                    attendances.map(a => (
                                        <tr key={a._id}>
                                            <td className="col-emp">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px',
                                                        background: 'rgba(99, 102, 241, 0.15)',
                                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                                        color: '#818cf8', fontWeight: '800',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '13px', flexShrink: 0
                                                    }}>
                                                        {a.user?.name ? a.user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '13.5px', whiteSpace: 'nowrap' }}>{a.user?.name || 'Staff Member'}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{a.user?.role || 'Technician'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-shift" style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '11.5px',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontWeight: '700',
                                                    whiteSpace: 'nowrap',
                                                    display: 'inline-block',
                                                    background: a.type === 'Overtime' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                                                    color: a.type === 'Overtime' ? '#fbbf24' : '#a5b4fc',
                                                    border: `1px solid ${a.type === 'Overtime' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`
                                                }}>
                                                    {a.type || 'Regular'}
                                                </span>
                                            </td>
                                            <td className="col-time">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ color: '#34d399', fontWeight: '700', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                                        <LogIn size={13} style={{ flexShrink: 0 }} />
                                                        <span>IN: {new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    {a.checkOut ? (
                                                        <div style={{ color: '#f87171', fontWeight: '700', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                                            <LogOut size={13} style={{ flexShrink: 0 }} />
                                                            <span>OUT: {new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                                            <Zap size={12} style={{ flexShrink: 0 }} />
                                                            <span>Active Now</span>
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                        {new Date(a.checkIn).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-loc">
                                                {a.location?.latitude ? (
                                                    <a
                                                        href={`https://maps.google.com/?q=${a.location.latitude},${a.location.longitude}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                                                    >
                                                        <MapPin size={13} style={{ flexShrink: 0 }} />
                                                        <span>GPS Coords ↗</span>
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                                        <Monitor size={13} style={{ flexShrink: 0 }} />
                                                        <span>{a.location?.address || 'Terminal App'}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="col-notes" style={{ color: '#cbd5e1', fontSize: '12.5px', lineHeight: 1.4 }}>
                                                {a.notes || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePanel;
