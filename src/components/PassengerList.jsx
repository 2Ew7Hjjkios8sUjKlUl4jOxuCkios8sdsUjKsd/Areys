import React, { useState, useEffect, useRef } from 'react';
import {
    MoreVertical,
    Users,
    Plane,
    Calendar,
    Phone,
    Baby,
    Download,
    Mail,
    MessageSquare,
    Trash2,
    Edit,
    Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
const PassengerList = ({
    passengers,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onRemove,
    onEdit,
    onDownloadTicket,
    hasPermission,
    resolveUserName
}) => {
    const { currentUser } = useAuth();
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    // Close menu on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (openMenuId) setOpenMenuId(null);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [openMenuId]);

    if (passengers.length === 0) {
        return (
            <div className="empty-state">
                <Users size={48} className="text-muted mb-4" />
                <p>No tickets added yet. Add some to get started!</p>
            </div>
        );
    }

    const allSelected = passengers.length > 0 && selectedIds.length === passengers.length;

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        if (openMenuId === id) {
            setOpenMenuId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 5,
                left: rect.left - 140 // Offset to align left (rect.left is viewport relative)
            });
            setOpenMenuId(id);
        }
    };

    return (
        <div className="passenger-list">
            <div className="list-header">
                <div className="header-left-group">
                    <Users size={18} className="text-primary" />
                    <h3>Registered Passengers ({passengers.length})</h3>
                </div>
                <label className="select-all-label">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={onToggleSelectAll}
                    />
                    <span>Select All</span>
                </label>
            </div>

            <div className="iron-scroll-container">
                <div className="iron-scroll-content">
                    <div className="table-container" style={{ border: 'none', margin: 0 }}>
                        <table className="passenger-table">
                            <thead>
                                <tr>
                                    <th className="col-check">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={onToggleSelectAll}
                                        />
                                    </th>
                                    <th className="col-no">No.</th>
                                    <th className="col-name">Name & Infants</th>
                                    <th className="col-agency">Agency</th>
                                    <th className="col-phone">Phone Number</th>
                                    <th className="col-creator">Creator</th>
                                    <th className="col-actions text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {passengers.map((p, index) => (
                                    <tr key={p.id} className={selectedIds.includes(p.id) ? 'selected' : ''}>
                                        <td className="col-check">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(p.id)}
                                                onChange={() => onToggleSelect(p.id)}
                                            />
                                        </td>
                                        <td className="col-no">{index + 1}</td>
                                        <td className="col-name">
                                            <div className="passenger-name-cell">
                                                <div className="main-passenger">
                                                    <span className="title-prefix">{p.type === 'Child' ? 'CH' : (p.gender === 'F' ? 'MRS' : 'MR')}</span>
                                                    <span className="full-name">{(p.name || "").toUpperCase()}</span>
                                                    {p.type === 'Child' && <span className="type-badge-sm child">CHILD</span>}
                                                </div>
                                                {p.infants && p.infants.length > 0 && (
                                                    <div className="infant-list-rows">
                                                        {p.infants.map((infant, idx) => (
                                                            <div key={infant.id || idx} className="infant-row-item">
                                                                <Baby size={12} className="text-accent" />
                                                                <span>IFNT {typeof infant === 'string' ? infant.toUpperCase() : infant.name?.toUpperCase()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="col-agency">
                                            <span className={`agency-badge ${p.agency?.toLowerCase() || 'us'}`}>
                                                {p.agency || 'Us'}
                                            </span>
                                        </td>
                                        <td className="col-phone">{p.phoneNumber || '—'}</td>
                                        <td className="col-creator">
                                            <span className="creator-text">{resolveUserName(p.created_by)}</span>
                                        </td>
                                        <td className="col-actions text-right">
                                            <div className="passenger-actions-dropdown" ref={openMenuId === p.id ? menuRef : null}>
                                                <button
                                                    className="btn-kebab"
                                                    onClick={(e) => toggleMenu(e, p.id)}
                                                >
                                                    <MoreVertical size={20} color="#000000" strokeWidth={2.5} fill="#000000" />
                                                </button>
                                                {openMenuId === p.id && (
                                                    <div
                                                        className="dropdown-menu fixed-menu"
                                                        style={{
                                                            position: 'fixed',
                                                            top: `${menuPosition.top}px`,
                                                            left: `${menuPosition.left}px`,
                                                            right: 'auto',
                                                            zIndex: 9999,
                                                            minWidth: '160px'
                                                        }}
                                                    >
                                                        {(hasPermission('passenger', 'delete') || p.created_by === currentUser.id) && (
                                                            <button onClick={() => { onEdit(p); setOpenMenuId(null); }}>
                                                                <Edit size={14} /> Edit
                                                            </button>
                                                        )}
                                                        {hasPermission('generating', 'download') && (
                                                            <button onClick={() => { onDownloadTicket(p); setOpenMenuId(null); }}>
                                                                <Download size={14} /> Download
                                                            </button>
                                                        )}
                                                        <button onClick={() => { toast.success('Email feature coming soon!', { icon: '🚧' }); setOpenMenuId(null); }}>
                                                            <Mail size={14} /> Email
                                                        </button>
                                                        <button onClick={() => { toast.success('WhatsApp feature coming soon!', { icon: '🚧' }); setOpenMenuId(null); }}>
                                                            <MessageSquare size={14} /> WhatsApp
                                                        </button>
                                                        {(hasPermission('passenger', 'delete') || p.created_by === currentUser.id) && (
                                                            <>
                                                                <hr />
                                                                <button onClick={() => { onRemove(p.id); setOpenMenuId(null); }} className="delete">
                                                                    <Trash2 size={14} /> Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassengerList;
