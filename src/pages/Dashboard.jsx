import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlights } from '../context/FlightContext';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    User,
    Plane,
    Calendar,
    Clock,
    MapPin,
    ExternalLink,
    Edit,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import Loader from '../components/Loader';

const Dashboard = () => {
    const { flights, deleteFlight, loading, hasPermission, resolveUserName } = useFlights();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('This Week'); // Default to This Week
    const [showDeleteModal, setShowDeleteModal] = useState({ show: false, flight: null });

    // Safety check for flights array
    const safeFlights = flights || [];

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        try {
            if (dateStr.includes('-')) {
                return new Date(dateStr);
            }
            const [d, m, y] = dateStr.split('/').map(Number);
            return new Date(y, m - 1, d);
        } catch {
            return new Date();
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-');
            return `${parseInt(d)}/${parseInt(m)}/${y}`;
        }
        return dateStr;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isThisWeek = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of today

        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999); // Normalize to end of week

        return date >= today && date <= nextWeek;
    };

    const isThisMonth = (date) => {
        const today = new Date();
        return date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isThisYear = (date) => {
        const today = new Date();
        return date.getFullYear() === today.getFullYear();
    };

    const filteredFlights = safeFlights.filter(f => {
        if (!f) return false;
        const flightDate = new Date(f.date); // Changed from parseDate(f.date) to new Date(f.date) as per snippet
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isPast = flightDate < today;
        const isUpcoming = flightDate >= today;

        // Apply search permissions
        if (isPast && !hasPermission('searching', 'past')) return false;
        if (isUpcoming && !hasPermission('searching', 'upcoming')) return false;

        // Reverted 'selectedFilter' to 'filter' and 'today' to 'Today' to match existing state variable and values
        if (filter === 'Today') return isToday(flightDate);
        if (filter === 'This Week') return isThisWeek(flightDate);
        if (filter === 'This Month') return isThisMonth(flightDate);
        if (filter === 'this year') return isThisYear(flightDate);
        return true;
    });

    if (loading) {
        return <Loader fullScreen text="Loading dashboard..." />;
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <h1 className="page-title">Flight Overview</h1>
                <div className="tab-filters">
                    {['Today', 'This Week', 'This Month', 'this year'].map(t => (
                        <button
                            key={t}
                            className={`tab-btn ${filter === t ? 'active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </header>


            <section className="flights-section mt-4">
                <div className="section-header">
                    <Clock size={20} />
                    <h3>{filter} Flights ({filteredFlights.length})</h3>
                </div>

                <div className="flight-grid">
                    {filteredFlights.length > 0 ? (
                        filteredFlights.map(flight => (
                            <div key={flight.id} className="flight-card">
                                <div className="flight-card-header">
                                    <div className="airline-info">
                                        <Plane size={20} className="text-primary" />
                                        <span className="airline-name">{flight.airline}</span>
                                    </div>
                                    <div className="flight-status-badge">
                                        Active
                                    </div>
                                </div>

                                <div className="flight-card-body">
                                    <div className="flight-info-row">
                                        <div className="info-item">
                                            <Calendar size={16} />
                                            <span>{formatDate(flight.date)}</span>
                                        </div>
                                        <div className="info-item">
                                            <MapPin size={16} />
                                            <span>{flight.route}</span>
                                        </div>
                                    </div>
                                    <div className="info-item mt-2">
                                        <Users size={16} />
                                        <span>{flight.passengers?.length || 0} Passengers</span>
                                    </div>
                                    <div className="info-item mt-2">
                                        <User size={16} />
                                        <span>Created by {resolveUserName(flight.created_by)}</span>
                                    </div>
                                </div>

                                <div className="flight-card-actions">
                                    <button className="btn btn-primary" onClick={() => navigate(`/flight/${flight.id}`)}>
                                        Open Flight <ExternalLink size={16} />
                                    </button>
                                    <div className="action-icons">
                                        {(hasPermission('flight', 'delete') || flight.created_by === currentUser.id) && (
                                            <>
                                                <button className="btn-icon-circle edit" onClick={() => navigate(`/edit-flight/${flight.id}`)} title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon-circle delete"
                                                    onClick={() => setShowDeleteModal({ show: true, flight })}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-card w-full">
                            <Clock size={48} className="text-muted mb-4" />
                            <p>No flights found for {filter}.</p>
                        </div>
                    )}
                </div>
            </section>

            {showDeleteModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon warning">
                            <AlertTriangle size={40} />
                        </div>
                        <h2 className="modal-title">Delete Flight?</h2>
                        <p className="modal-description">
                            You are about to delete <strong>{showDeleteModal.flight?.airline}</strong> flight.
                            <br />
                            This will also delete <strong>({showDeleteModal.flight?.passengers?.length || 0}) passengers</strong>.
                            <br />
                            <span className="text-danger" style={{ fontWeight: 700, marginTop: '0.5rem', display: 'block' }}>
                                This action cannot be undone!
                            </span>
                        </p>
                        <div className="modal-actions mt-8">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteModal({ show: false, flight: null })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ backgroundColor: 'var(--danger)' }}
                                onClick={() => {
                                    deleteFlight(showDeleteModal.flight.id);
                                    setShowDeleteModal({ show: false, flight: null });
                                }}
                            >
                                Yes, Delete Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
