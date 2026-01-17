import React from 'react';
import {
    Users,
    MapPin,
    Calendar,
    Baby,
    Shield,
    User,
    ArrowRight
} from 'lucide-react';
import './FlightSummary.css';

const FlightSummary = ({ flight, resolveUserName }) => {
    if (!flight) return null;

    const passengers = flight.passengers || [];

    // Statistics Calculations
    const totalPassengers = passengers.length;
    const childrenCount = passengers.filter(p => p.type === 'Child').length;
    const infantsCount = passengers.reduce((sum, p) => sum + (p.infants?.length || 0), 0);
    const adultsCount = totalPassengers - childrenCount;
    const maleCount = passengers.filter(p => (p.gender === 'M' || !p.gender) && p.type !== 'Child').length;
    const femaleCount = passengers.filter(p => p.gender === 'F' && p.type !== 'Child').length;

    // Agency Stats (Hide 0)
    const agencyStats = passengers.reduce((acc, p) => {
        const agencyName = p.agency || 'Us';
        acc[agencyName] = (acc[agencyName] || 0) + 1;
        return acc;
    }, {});

    // User/Creator Stats (Hide 0)
    const userStats = passengers.reduce((acc, p) => {
        const userId = p.created_by;
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="flight-summary-container">
            <div className="summary-scroll-wrapper">
                <div className="summary-cards-flex">

                    {/* Main Flight Info Card */}
                    <div className="summary-card main-info">
                        <div className="card-header">
                            <MapPin size={18} className="text-primary" />
                            <span className="card-label">Flight Details</span>
                        </div>
                        <div className="route-display">
                            <span className="route-text">{flight.route}</span>
                            <ArrowRight size={14} className="route-arrow" />
                            <span className="route-airline">{flight.airline}</span>
                        </div>
                        <div className="date-display">
                            <Calendar size={14} />
                            <span>{flight.date}</span>
                        </div>
                    </div>

                    {/* Breakdown Totals Card */}
                    <div className="summary-card breakdown">
                        <div className="card-header">
                            <Users size={18} className="text-secondary" />
                            <span className="card-label">Total Occupancy</span>
                        </div>
                        <div className="stats-mini-grid">
                            <div className="stat-pill">
                                <span className="pill-val">{totalPassengers}</span>
                                <span className="pill-lbl">Passengers</span>
                            </div>
                            <div className="stat-pill">
                                <span className="pill-val">{adultsCount}</span>
                                <span className="pill-lbl">Adults</span>
                            </div>
                            <div className="stat-pill">
                                <span className="pill-val">{childrenCount}</span>
                                <span className="pill-lbl">Children</span>
                            </div>
                            <div className="stat-pill">
                                <span className="pill-val">{maleCount}</span>
                                <span className="pill-lbl">Male</span>
                            </div>
                            <div className="stat-pill">
                                <span className="pill-val">{femaleCount}</span>
                                <span className="pill-lbl">Female</span>
                            </div>
                            <div className="stat-pill accent">
                                <span className="pill-val">{infantsCount}</span>
                                <span className="pill-lbl">Infants</span>
                            </div>
                        </div>
                    </div>

                    {/* Agency Breakdown */}
                    <div className="summary-card agencies">
                        <div className="card-header">
                            <Shield size={18} className="text-accent" />
                            <span className="card-label">Agency Contribution</span>
                        </div>
                        <div className="scrollable-stats">
                            {Object.entries(agencyStats).map(([name, count]) => (
                                <div key={name} className="contribution-row">
                                    <span className={`agency-tag-sm ${name.toLowerCase()}`}>{name}</span>
                                    <span className="contribution-count"><b>{count}</b> PAX</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Creator Breakdown */}
                    <div className="summary-card creators">
                        <div className="card-header">
                            <User size={18} className="text-purple" />
                            <span className="card-label">Workload Distribution</span>
                        </div>
                        <div className="scrollable-stats">
                            {Object.entries(userStats).map(([userId, count]) => (
                                <div key={userId} className="contribution-row">
                                    <span className="creator-name-sm">{resolveUserName(userId)}</span>
                                    <span className="contribution-count"><b>{count}</b> Entries</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FlightSummary;
