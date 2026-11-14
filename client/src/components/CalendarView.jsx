import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import './Logistics.css';
import './CalendarView.css';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const CalendarView = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects`);
            let data = res.data;

            // Filter for Workers/Drivers
            if (user?.role === 'Worker') {
                data = data.filter(p =>
                    p.transport?.driverName === user.name ||
                    p.team?.members?.includes(user.name)
                );
            }

            setProjects(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching projects:", err);
            setLoading(false);
        }
    };

    // Calendar Helper Functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];

        // Pad previous month days
        const startPad = (firstDay.getDay() + 6) % 7; // Adjust for Monday start (0=Mon, 6=Sun) or standard (0=Sun)
        // Let's assume standard Sunday=0. If Monday start needed: (day + 6) % 7
        // Standard Sunday start:
        const firstDayIndex = firstDay.getDay();

        for (let i = firstDayIndex; i > 0; i--) {
            days.push({
                date: new Date(year, month, 1 - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Pad next month
        const remainingCells = 42 - days.length; // 6 rows * 7 cols
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getEventsForDay = (date) => {
        return projects.filter(p => {
            if (!p.dates || !p.dates.start) return false;
            const start = new Date(p.dates.start);
            const end = new Date(p.dates.end || p.dates.start);

            // Normalize times to midnight for accurate comparison
            const check = new Date(date).setHours(0, 0, 0, 0);
            const s = new Date(start).setHours(0, 0, 0, 0);
            const e = new Date(end).setHours(0, 0, 0, 0);

            return check >= s && check <= e;
        });
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'event-confirmed';
            case 'quote': return 'event-quote';
            case 'draft': return 'event-draft';
            case 'onsite': return 'event-onsite';
            case 'completed': return 'event-completed';
            default: return 'event-draft';
        }
    };

    const handleDayClick = (date) => {
        setSelectedDate(date);
        setShowModal(true);
    };

    const handleCreateProjectForDate = (date) => {
        setShowModal(false);
        const formattedDate = date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '';
        navigate('/projects', {
            state: {
                openNewProject: true,
                initialDate: formattedDate
            }
        });
    };

    const days = getDaysInMonth(currentDate);
    const dayNames = [
        { short: 'Sun', letter: 'S' },
        { short: 'Mon', letter: 'M' },
        { short: 'Tue', letter: 'T' },
        { short: 'Wed', letter: 'W' },
        { short: 'Thu', letter: 'T' },
        { short: 'Fri', letter: 'F' },
        { short: 'Sat', letter: 'S' }
    ];

    return (
        <div className="calendar-page-wrap">
            <div className="calendar-controls">
                <div className="calendar-title-wrap">
                    <h2 className="calendar-title">
                        {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>
                <div className="calendar-nav-buttons">
                    <button onClick={() => changeMonth(-1)} className="btn-nav" aria-label="Previous Month">← Prev</button>
                    <button onClick={() => setCurrentDate(new Date())} className="btn-nav today">Today</button>
                    <button onClick={() => changeMonth(1)} className="btn-nav" aria-label="Next Month">Next →</button>
                </div>
            </div>

            <div className="calendar-container">
                <div className="calendar-grid">
                    {dayNames.map((day, idx) => (
                        <div key={idx} className="calendar-day-header">
                            <span className="day-name-short">{day.short}</span>
                            <span className="day-name-letter">{day.letter}</span>
                        </div>
                    ))}

                    {days.map((dayObj, idx) => {
                        const dayEvents = getEventsForDay(dayObj.date);
                        const isToday = isSameDay(dayObj.date, new Date());
                        const visibleEvents = dayEvents.slice(0, 3);
                        const hiddenCount = dayEvents.length - visibleEvents.length;

                        return (
                            <div
                                key={idx}
                                className={`calendar-day ${!dayObj.isCurrentMonth ? 'day-other-month' : ''} ${isToday ? 'day-today' : ''}`}
                                onClick={() => handleDayClick(dayObj.date)}
                                role="button"
                                tabIndex={0}
                            >
                                <span className="day-number">{dayObj.date.getDate()}</span>
                                <div className="day-events">
                                    {visibleEvents.map(event => (
                                        <div key={event._id} className={`event-bar ${getStatusClass(event.status)}`} title={`${event.eventName} (${event.status})`}>
                                            <span className="event-dot-indicator"></span>
                                            <span className="event-bar-text">{event.eventName}</span>
                                        </div>
                                    ))}
                                    {hiddenCount > 0 && (
                                        <div className="event-more-chip" title={`${hiddenCount} more events`}>
                                            +{hiddenCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* Event Details Modal */}
            {
                showModal && selectedDate && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                                <h3 className="modal-title" style={{ margin: 0, textTransform: 'capitalize' }}>
                                    {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button 
                                        className="btn-cal-new-project"
                                        onClick={() => handleCreateProjectForDate(selectedDate)}
                                        title="Create New Project"
                                    >
                                        <Plus size={15} strokeWidth={2.5} />
                                        <span>New Project</span>
                                    </button>
                                    <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                                </div>
                            </div>

                            <div className="modal-body">
                                {projects.filter(p => {
                                    if (!p.dates || !p.dates.start) return false;
                                    const start = new Date(p.dates.start);
                                    const end = new Date(p.dates.end || p.dates.start);
                                    const check = new Date(selectedDate).setHours(0, 0, 0, 0);
                                    const s = new Date(start).setHours(0, 0, 0, 0);
                                    const e = new Date(end).setHours(0, 0, 0, 0);
                                    return check >= s && check <= e;
                                }).length > 0 ? (
                                    projects.filter(p => {
                                        if (!p.dates || !p.dates.start) return false;
                                        const start = new Date(p.dates.start);
                                        const end = new Date(p.dates.end || p.dates.start);
                                        const check = new Date(selectedDate).setHours(0, 0, 0, 0);
                                        const s = new Date(start).setHours(0, 0, 0, 0);
                                        const e = new Date(end).setHours(0, 0, 0, 0);
                                        return check >= s && check <= e;
                                    }).map(event => (
                                        <div key={event._id} className={`modal-event-item ${getStatusClass(event.status).replace('event-', '')}`}>
                                            <h4>{event.eventName}</h4>
                                            <p><strong>Client:</strong> {event.client?.name || 'N/A'}</p>
                                            <p><strong>Status:</strong> {event.status}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                                        No events scheduled for this day.
                                    </p>
                                )}
                            </div>

                            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button className="btn-cancel" onClick={() => setShowModal(false)}>Close</button>
                                <button 
                                    className="btn-cal-new-project"
                                    onClick={() => handleCreateProjectForDate(selectedDate)}
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    <span>New Project</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CalendarView;
