import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFlights } from '../context/FlightContext';
import {
    Plane,
    Calendar,
    MapPin,
    Hash,
    CheckCircle,
    Plus,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

const CreateFlight = () => {
    const { createFlight, getFlight, updateFlight, airlines, hasPermission, flights, loading } = useFlights();
    const navigate = useNavigate();
    const { id: editId } = useParams();
    const isEdit = !!editId;

    const [showConfirm, setShowConfirm] = useState(false);
    const [flightInfo, setFlightInfo] = useState(() => {
        if (editId) {
            const existing = getFlight(editId);
            if (existing) return { ...existing };
        }
        const defaultAirline = airlines[0];
        return {
            airline: defaultAirline?.name || '',
            flightNumber: defaultAirline?.defaultFlightNumber || 'FLY24ADDB1',
            date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
            route: 'CDD-MUQ'
        };
    });

    useEffect(() => {
        if (!loading && !isEdit && !hasPermission('flight', 'create')) {
            navigate('/');
        }
    }, [isEdit, hasPermission, navigate, loading]);

    // Handle unauthorized access gracefully
    if (loading) {
        return <Loader fullScreen text="Loading permissions..." />;
    }

    if (!isEdit && !hasPermission('flight', 'create')) {
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'airline') {
            const selectedAirline = airlines.find(a => a.name === value);
            // If airline has a default flight number, auto-update
            if (selectedAirline?.defaultFlightNumber) {
                setFlightInfo(prev => ({
                    ...prev,
                    airline: value,
                    flightNumber: selectedAirline.defaultFlightNumber
                }));
            } else {
                setFlightInfo(prev => ({ ...prev, airline: value }));
            }
        } else {
            setFlightInfo({ ...flightInfo, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirm(true);
    };

    const confirmAction = async () => {
        if (isEdit) {
            await updateFlight(editId, flightInfo);
            setShowConfirm(false);
            navigate(`/flight/${editId}`);
        } else {
            try {
                const newFlight = await createFlight({ ...flightInfo, passengers: [] });
                setShowConfirm(false);
                if (newFlight && newFlight.uuid) {
                    navigate(`/flight/${newFlight.uuid}`); // Use UUID for navigation
                } else {
                    console.warn('Flight created but no UUID returned from createFlight:', newFlight);
                    navigate('/');
                }
            } catch (err) {
                console.error('Failed to create flight:', err);
                setShowConfirm(false);
                // Context handles the toast notification
            }
        }
    };

    return (
        <div className="create-flight-page">
            <header className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Flight' : 'Create New Flight'}</h1>
            </header>

            <div className="form-card max-w-2xl mx-auto">
                <div className="form-header">
                    <Plane size={24} className="text-primary" />
                    <p className="text-muted">Enter flight scheduling details below to begin registration.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="form-group">
                        <label><Plane size={14} className="mr-2" /> Airline Selection</label>
                        <select name="airline" value={flightInfo.airline} onChange={handleChange}>
                            {airlines.map(airline => (
                                <option key={airline.id} value={airline.name}>{airline.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label><Hash size={14} className="mr-2" /> Flight Number</label>
                            <input
                                name="flightNumber"
                                value={flightInfo.flightNumber}
                                onChange={handleChange}
                                placeholder="e.g. EK502"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><Calendar size={14} className="mr-2" /> Travel Date</label>
                            <input
                                name="date"
                                type="date"
                                value={flightInfo.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><MapPin size={14} className="mr-2" /> Flight Route</label>
                        <input
                            name="route"
                            value={flightInfo.route}
                            onChange={handleChange}
                            placeholder="e.g. DXB - LHR"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-6 py-4">
                        {isEdit ? 'Update Flight Details' : 'Create Flight & Continue'} <ArrowRight size={18} />
                    </button>
                </form>
            </div>

            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon warning">
                            <AlertCircle size={48} />
                        </div>
                        <h2>{isEdit ? 'Confirm Update' : 'Confirm Flight Creation'}</h2>
                        <p>
                            You are about to {isEdit ? 'update' : 'create'} a <strong>{flightInfo.airline}</strong> flight
                            to <strong>{flightInfo.route}</strong> for <strong>{flightInfo.date}</strong>.
                        </p>
                        <div className="modal-actions mt-8">
                            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmAction}>
                                {isEdit ? 'Yes, Update Flight' : 'Yes, Create Flight'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Shield icon placeholder for airline
const Shield = ({ size, className }) => (
    <div className={className} style={{ width: size, height: size, background: 'currentColor', borderRadius: '4px' }}></div>
);

export default CreateFlight;
