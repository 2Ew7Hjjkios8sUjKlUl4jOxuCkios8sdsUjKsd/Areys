import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlights } from '../context/FlightContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plane, Calendar, Users, ExternalLink, Trash2, MapPin, AlertTriangle, Edit } from 'lucide-react';
import Loader from '../components/Loader';

const SearchFlight = () => {
    const { flights, deleteFlight, loading, hasPermission, airlines } = useFlights();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useState({
        airline: '',
        startDate: '',
        endDate: ''
    });
    const [showDeleteModal, setShowDeleteModal] = useState({ show: false, flight: null });

    const toTimestamp = (dateStr) => {
        if (!dateStr) return null;
        try {
            if (dateStr.includes('-')) {
                return new Date(dateStr).getTime();
            }
            const [d, m, y] = dateStr.split('/').map(Number);
            return new Date(y, m - 1, d).getTime();
        } catch {
            return null;
        }
    };

    // Safely handle flights array
    const safeFlights = flights || [];

    const filteredFlights = safeFlights.filter(f => {
        if (!f) return false;
        const matchesAirline = (f.airline?.toLowerCase() || '').includes(searchParams.airline.toLowerCase()) ||
            (f.flightNumber?.toLowerCase() || '').includes(searchParams.airline.toLowerCase());

        const flightTs = toTimestamp(f.date);
        const startTs = toTimestamp(searchParams.startDate);
        const endTs = toTimestamp(searchParams.endDate);

        let matchesDate = true;
        if (startTs && endTs && flightTs) {
            matchesDate = flightTs >= startTs && flightTs <= endTs;
        } else if (startTs && flightTs) {
            matchesDate = flightTs >= startTs;
        } else if (endTs && flightTs) {
            matchesDate = flightTs <= endTs;
        }

        const flightDate = new Date(flightTs);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isPast = flightDate < today;
        const isUpcoming = flightDate >= today;

        if (isPast && !hasPermission('searching', 'past')) return false;
        if (isUpcoming && !hasPermission('searching', 'upcoming')) return false;

        return matchesAirline && matchesDate;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-');
            return `${parseInt(d)}/${parseInt(m)}/${y}`;
        }
        return dateStr;
    };

    const handleSearchChange = (e) => {
        setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    };

    const clearSearch = () => {
        setSearchParams({ airline: '', startDate: '', endDate: '' });
    };

    if (loading) {
        return <Loader fullScreen text="Loading flights..." />;
    }

    return (
        <div className="search-page">
            <header className="page-header">
                <h1 className="page-title">Search Flights</h1>
                <button className="btn btn-secondary btn-sm" onClick={clearSearch}>
                    Clear Filters
                </button>
            </header>

            <div className="search-controls-card">
                <div className="iron-scroll-container">
                    <div className="iron-scroll-content">
                        <div className="search-grid-3">
                            <div className="search-input-wrapper">
                                <Plane size={22} className="search-icon" />
                                <select
                                    name="airline"
                                    value={searchParams.airline}
                                    onChange={handleSearchChange}
                                    className="search-select"
                                >
                                    <option value="">All Airlines</option>
                                    {airlines.map(a => (
                                        <option key={a.id} value={a.name}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="search-input-wrapper">
                                <Calendar size={20} className="search-icon" />
                                <label className="input-floating-label">From Date</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    value={searchParams.startDate}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="search-input-wrapper">
                                <Calendar size={20} className="search-icon" />
                                <label className="input-floating-label">To Date</label>
                                <input
                                    name="endDate"
                                    type="date"
                                    value={searchParams.endDate}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flight-grid mt-8">
                {filteredFlights.length > 0 ? (
                    filteredFlights.map(flight => (
                        <div key={flight.id} className="flight-card">
                            <div className="flight-card-header">
                                <div className="airline-info">
                                    <Plane size={20} className="text-primary" />
                                    <span className="airline-name">{flight.airline}</span>
                                </div>
                                <span className="flight-num-badge">{flight.flightNumber}</span>
                            </div>

                            <div className="flight-card-body">
                                <div className="detail-item">
                                    <Calendar size={16} />
                                    <span>{formatDate(flight.date)}</span>
                                </div>
                                <div className="detail-item">
                                    <MapPin size={16} />
                                    <span>{flight.route}</span>
                                </div>
                                <div className="detail-item mt-2">
                                    <Users size={16} />
                                    <span>{flight.passengers?.length || 0} Passengers</span>
                                </div>
                            </div>

                            <div className="flight-card-actions">
                                <button className="btn btn-primary" onClick={() => navigate(`/flight/${flight.id}`)} style={{ flex: 1 }}>
                                    Open Flight <ExternalLink size={16} />
                                </button>
                                <div className="action-icons ml-2" style={{ display: 'flex', gap: '0.5rem' }}>
                                    {(hasPermission('flight', 'delete') || flight.created_by === currentUser.id) && (
                                        <>
                                            <button className="btn-icon-circle edit" onClick={() => navigate(`/edit-flight/${flight.id}`)} title="Edit Flight">
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-icon-circle delete"
                                                onClick={() => setShowDeleteModal({ show: true, flight })}
                                                title="Delete Flight"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state-card col-span-full">
                        <Search size={48} className="text-muted mb-4" />
                        <p>No flights found matching your criteria.</p>
                    </div>
                )}
            </div>

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

export default SearchFlight;
