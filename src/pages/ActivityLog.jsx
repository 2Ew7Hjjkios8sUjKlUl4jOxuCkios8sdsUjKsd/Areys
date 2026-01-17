import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useFlights } from '../context/FlightContext';
import { Calendar, Search, Activity, User, Trash2, Edit2, PlusCircle, ArrowRight, Clock } from 'lucide-react';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import './ActivityLog.css';

const ActivityLog = () => {
    const { currentUser } = useAuth();
    const { users, resolveUserName } = useFlights();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Default Today

    // Create native formatters
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    useEffect(() => {
        fetchLogs();
    }, [currentUser, dateFilter]);

    const fetchLogs = async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
            let query = supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply Date Filter (Exact Day Match)
            if (dateFilter) {
                const startDate = `${dateFilter}T00:00:00`;
                const endDate = `${dateFilter}T23:59:59`;
                query = query.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            toast.error('Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (type) => {
        switch (type) {
            case 'CREATE': return <PlusCircle size={20} />;
            case 'UPDATE': return <Edit2 size={18} />;
            case 'DELETE': return <Trash2 size={18} />;
            default: return <Activity size={18} />;
        }
    };

    const getEntityClass = (type) => {
        switch (type) {
            case 'FLIGHT': return 'entity-flight';
            case 'PASSENGER': return 'entity-passenger';
            case 'AGENCY': return 'entity-agency';
            case 'AIRLINE': return 'entity-airline';
            case 'PRICE': return 'entity-price';
            default: return '';
        }
    };

    const getIconBoxClass = (type) => {
        switch (type) {
            case 'FLIGHT': return 'icon-blue';
            case 'PASSENGER': return 'icon-purple';
            case 'AGENCY': return 'icon-emerald';
            case 'AIRLINE': return 'icon-amber';
            case 'PRICE': return 'icon-indigo';
            default: return 'icon-slate';
        }
    };

    const renderDiff = (details) => {
        if (!details || !details.before || !details.after) return null;

        const changes = Object.keys(details.after).filter(key =>
            JSON.stringify(details.before[key]) !== JSON.stringify(details.after[key])
        );

        if (changes.length === 0) return null;

        return (
            <div className="log-diff-container">
                <div className="diff-header">Modified Attributes</div>
                <div className="diff-grid">
                    {changes.map(key => (
                        <div key={key} className="diff-row">
                            <div className="diff-label">{key.replace(/_/g, ' ')}</div>
                            <div className="diff-values">
                                <span className="val-old">{String(details.before[key] || 'None')}</span>
                                <ArrowRight size={14} className="diff-arrow" />
                                <span className="val-new">{String(details.after[key] || 'None')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="activity-log-page">
            <header className="log-header">
                <div className="log-title-area">
                    <div className="log-title-row">
                        <div className="log-title-icon"><Activity size={28} strokeWidth={2.5} /></div>
                        <h1>System Activity</h1>
                    </div>
                    <p className="log-subtitle">Detailed audit trail of all system modifications</p>
                </div>

                <div className="log-filter">
                    <label><Calendar size={16} /> Date</label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="log-date-input"
                    />
                </div>
            </header>

            {loading ? (
                <div style={{ padding: '4rem 0' }}><Loader text="Retrieving Audit Logs..." /></div>
            ) : logs.length === 0 ? (
                <div className="log-empty">
                    <div className="log-empty-icon"><Activity size={40} /></div>
                    <h3>No activity detected</h3>
                    <p>System records for this period are currently empty.</p>
                </div>
            ) : (
                <div className="log-scroll-container">
                    <div className="log-timeline">
                        {logs.map((log) => (
                            <div key={log.id} className="log-item-wrapper">
                                <div className="log-dot"></div>
                                <div className="log-card">
                                    <div className="log-card-header">
                                        <div className="log-content-main">
                                            <div className={`log-action-icon-box ${getIconBoxClass(log.entity_type)}`}>
                                                {getActionIcon(log.action_type)}
                                            </div>

                                            <div className="log-details-area">
                                                <div className="log-meta-top">
                                                    <span className={`entity-badge ${getEntityClass(log.entity_type)}`}>
                                                        {log.entity_type}
                                                    </span>
                                                    <h3 className="log-description">{log.description}</h3>
                                                </div>

                                                <div className="log-footer-info">
                                                    <div className="log-user-chip">
                                                        <User size={14} />
                                                        <span>{resolveUserName(log.user_id)}</span>
                                                    </div>
                                                    <div className="log-timestamp">
                                                        <Clock size={14} />
                                                        <span>{timeFormatter.format(new Date(log.created_at))}</span>
                                                        <span style={{ opacity: 0.3 }}>|</span>
                                                        <span style={{ fontFamily: 'monospace' }}>{fullDateFormatter.format(new Date(log.created_at)).split(' ')[0]}</span>
                                                    </div>
                                                </div>

                                                {renderDiff(log.details)}
                                            </div>
                                        </div>
                                        <div className="log-id-tag lg-only">
                                            AUDIT_{log.id.slice(0, 8)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default ActivityLog;
