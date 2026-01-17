import React, { useState, useEffect } from 'react';
import { Shield, Plus, Save, X, AlertTriangle, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { useFlights } from '../context/FlightContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RoleEditor = () => {
    const { roleDefinitions, addRole, updateRolePermissions } = useFlights();
    const { userRole } = useAuth();

    // Only Admin can edit roles
    const isAdmin = userRole === 'Admin';

    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [editedPermissions, setEditedPermissions] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // Modals
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Load permissions when role is selected
    useEffect(() => {
        if (selectedRoleId && roleDefinitions.length > 0) {
            const role = roleDefinitions.find(r => r.id === selectedRoleId);
            if (role) {
                setEditedPermissions(JSON.parse(JSON.stringify(role.permissions)));
                setIsDirty(false);
            }
        } else if (roleDefinitions.length > 0 && !selectedRoleId) {
            // Auto select first role if none selected
            setSelectedRoleId(roleDefinitions[0].id);
        }
    }, [selectedRoleId, roleDefinitions]);

    const handlePermissionChange = (category, setting, value) => {
        setEditedPermissions(prev => {
            const updated = { ...prev };
            if (!updated[category]) updated[category] = {};
            updated[category][setting] = value;
            return updated;
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            await updateRolePermissions(selectedRoleId, editedPermissions);
            setIsDirty(false);
            setShowSaveConfirm(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            const newRole = await addRole(newRoleName);
            setNewRoleName('');
            setShowAddRoleModal(false);
            setSelectedRoleId(newRole.id); // Switch to new role
        } catch (error) {
            console.error(error);
        }
    };

    if (!isAdmin) {
        return (
            <div className="role-access-restricted">
                <Lock size={48} />
                <h3>Access Restricted</h3>
                <p>Only Administrators can customize role permissions.</p>
            </div>
        );
    }

    if (!editedPermissions) {
        return <div className="loading-container"><div className="loader"></div></div>;
    }

    return (
        <div className="role-editor-container animate-fade-in">
            {/* Header / Selector */}
            <div className="role-header-card">
                <div className="role-header-info">
                    <div className="role-icon-wrapper">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2>Role Customization</h2>
                        <p>Define what each role can and cannot do</p>
                    </div>
                </div>

                <div className="role-header-actions">
                    <select
                        className="form-select-fancy"
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                    >
                        {roleDefinitions.map(role => (
                            <option key={role.id} value={role.id}>{role.role}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="btn-icon-circle primary"
                        title="Add New Role"
                    >
                        <Plus size={20} />
                    </button>

                    <button
                        onClick={() => setShowSaveConfirm(true)}
                        disabled={!isDirty}
                        className={`btn-primary ${!isDirty ? 'disabled' : ''}`}
                    >
                        <Save size={18} style={{ marginRight: '8px' }} />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Permissions Grid */}
            <div className="role-permissions-grid">

                {/* 1. Flight Settings */}
                <PermissionSection
                    title="Flight Settings"
                    color="blue"
                    isOpen={true}
                >
                    <Toggle
                        label="See own Flights"
                        checked={editedPermissions.flight?.view_own}
                        onChange={(v) => handlePermissionChange('flight', 'view_own', v)}
                    />
                    <Toggle
                        label="See any Flights"
                        checked={editedPermissions.flight?.view_any}
                        onChange={(v) => handlePermissionChange('flight', 'view_any', v)}
                    />
                    <Toggle
                        label="Flight Creation"
                        checked={editedPermissions.flight?.create}
                        onChange={(v) => handlePermissionChange('flight', 'create', v)}
                    />
                    <Toggle
                        label="Delete ANY Flight (Manager)"
                        checked={editedPermissions.flight?.delete}
                        onChange={(v) => handlePermissionChange('flight', 'delete', v)}
                        danger
                    />
                </PermissionSection>

                {/* 2. Passengers */}
                <PermissionSection
                    title="Passengers"
                    color="green"
                    isOpen={true}
                >
                    <Toggle
                        label="See own Passenger"
                        checked={editedPermissions.passenger?.view_own}
                        onChange={(v) => handlePermissionChange('passenger', 'view_own', v)}
                    />
                    <Toggle
                        label="See any Passenger"
                        checked={editedPermissions.passenger?.view_any}
                        onChange={(v) => handlePermissionChange('passenger', 'view_any', v)}
                    />
                    <Toggle
                        label="Add Passengers"
                        checked={editedPermissions.passenger?.create}
                        onChange={(v) => handlePermissionChange('passenger', 'create', v)}
                    />
                    <Toggle
                        label="Remove ANY Passenger"
                        checked={editedPermissions.passenger?.delete}
                        onChange={(v) => handlePermissionChange('passenger', 'delete', v)}
                        danger
                    />
                </PermissionSection>

                {/* 3. Generating */}
                <PermissionSection
                    title="Document Generation"
                    color="purple"
                    isOpen={true}
                >
                    <Toggle
                        label="Ticket Generation (Single)"
                        checked={editedPermissions.generating?.ticket}
                        onChange={(v) => handlePermissionChange('generating', 'ticket', v)}
                    />
                    <Toggle
                        label="Manifest Generation"
                        checked={editedPermissions.generating?.manifest}
                        onChange={(v) => handlePermissionChange('generating', 'manifest', v)}
                    />
                    <Toggle
                        label="Batch Generation (All)"
                        checked={editedPermissions.generating?.batch}
                        onChange={(v) => handlePermissionChange('generating', 'batch', v)}
                    />
                    <Toggle
                        label="Download Documents"
                        checked={editedPermissions.generating?.download}
                        onChange={(v) => handlePermissionChange('generating', 'download', v)}
                    />
                </PermissionSection>

                {/* 4. Searching */}
                <PermissionSection
                    title="Searching"
                    color="yellow"
                    isOpen={true}
                >
                    <Toggle
                        label="Search Upcoming Flights"
                        checked={editedPermissions.searching?.upcoming}
                        onChange={(v) => handlePermissionChange('searching', 'upcoming', v)}
                    />
                    <Toggle
                        label="Search Past Flights"
                        checked={editedPermissions.searching?.past}
                        onChange={(v) => handlePermissionChange('searching', 'past', v)}
                    />
                </PermissionSection>

                {/* 5. System Settings - FULL WIDTH */}
                <div className="role-permissions-full-width">
                    <PermissionSection
                        title="System Settings (Admin Area)"
                        color="red"
                        isOpen={true}
                    >
                        <div className="settings-permission-grid">
                            <div className="permission-group">
                                <h4>Airlines</h4>
                                <Toggle label="Create Airline" checked={editedPermissions.settings?.airline_create} onChange={(v) => handlePermissionChange('settings', 'airline_create', v)} />
                                <Toggle label="Update Airline" checked={editedPermissions.settings?.airline_update} onChange={(v) => handlePermissionChange('settings', 'airline_update', v)} />
                                <Toggle label="Delete Airline" checked={editedPermissions.settings?.airline_delete} onChange={(v) => handlePermissionChange('settings', 'airline_delete', v)} danger />
                            </div>
                            <div className="permission-group">
                                <h4>Agencies</h4>
                                <Toggle label="Create Agency" checked={editedPermissions.settings?.agency_create} onChange={(v) => handlePermissionChange('settings', 'agency_create', v)} />
                                <Toggle label="Update Agency" checked={editedPermissions.settings?.agency_update} onChange={(v) => handlePermissionChange('settings', 'agency_update', v)} />
                                <Toggle label="Delete Agency" checked={editedPermissions.settings?.agency_delete} onChange={(v) => handlePermissionChange('settings', 'agency_delete', v)} danger />
                            </div>
                            <div className="permission-group">
                                <h4>Users & Pricing</h4>
                                <Toggle label="Manage Users (Create)" checked={editedPermissions.settings?.user_create} onChange={(v) => handlePermissionChange('settings', 'user_create', v)} danger />
                                <Toggle label="Edit Pricing Rules" checked={editedPermissions.settings?.pricing_edit} onChange={(v) => handlePermissionChange('settings', 'pricing_edit', v)} danger />
                            </div>
                        </div>
                    </PermissionSection>
                </div>
            </div>

            {/* CREATE ROLE MODAL */}
            {showAddRoleModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-sm">
                        <div className="modal-header">
                            <h3>Add New Role</h3>
                            <button onClick={() => setShowAddRoleModal(false)} className="btn-icon-close"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateRole} className="modal-body">
                            <div className="form-group">
                                <label>Role Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Flight Coordinator"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddRoleModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SAVE CONFIRMATION MODAL */}
            {showSaveConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content modal-md border-warning">
                        <div className="modal-body p-6">
                            <div className="confirm-layout">
                                <div className="confirm-icon-wrapper">
                                    <AlertTriangle size={32} />
                                </div>
                                <div>
                                    <h3 className="confirm-title">Update Role Permissions?</h3>
                                    <p className="confirm-text">
                                        You are about to modify the security privileges for the
                                        <strong> {roleDefinitions.find(r => r.id === selectedRoleId)?.role} </strong> role.
                                    </p>
                                    <div className="confirm-warning-box">
                                        This will immediately affect all users currently assigned to this role. Please confirm you want to apply these changes.
                                    </div>
                                    <div className="modal-actions justify-end">
                                        <button
                                            onClick={() => setShowSaveConfirm(false)}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="btn-warning"
                                        >
                                            Confirm & Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components
const PermissionSection = ({ title, color, children, isOpen: initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    return (
        <div className={`permission-section border-${color}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="permission-header"
            >
                <div className="permission-title-group">
                    <div className={`permission-dot bg-${color}`} />
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {isOpen && (
                <div className="permission-content">
                    {children}
                </div>
            )}
        </div>
    );
};

const Toggle = ({ label, checked, onChange, danger = false }) => (
    <div className={`toggle-row ${checked ? (danger ? 'active-danger' : 'active') : ''}`}>
        <span className={`toggle-label ${danger && checked ? 'text-danger' : ''}`}>{label}</span>

        <button
            onClick={() => onChange(!checked)}
            className={`toggle-switch ${checked ? (danger ? 'bg-danger' : 'bg-primary') : ''}`}
            type="button"
        >
            <span className={`toggle-handle ${checked ? 'checked' : ''}`} />
        </button>
    </div>
);

export default RoleEditor;
