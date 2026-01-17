import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlights } from '../context/FlightContext';
import toast from 'react-hot-toast';
import PassengerForm from '../components/PassengerForm';
import PassengerList from '../components/PassengerList';
import Loader from '../components/Loader';
import { generateTickets } from '../utils/docxGenerator';
import { generateManifest } from '../utils/manifestGenerator';
import {
    Plane,
    Calendar,
    MapPin,
    Users,
    ArrowLeft,
    Download,
    Plus,
    FileText,
    Shield,
    Edit,
    X
} from 'lucide-react';
import FlightSummary from '../components/FlightSummary';

const FlightDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { flights, addPassengerToFlight, removePassengerFromFlight, getAirline, hasPermission, resolveUserName } = useFlights();

    // Derive flight directly from context to avoid stale state
    const flight = flights.find(f => f.id === id || f.id === parseInt(id));

    const [showForm, setShowForm] = useState(false);
    const [editingPassenger, setEditingPassenger] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ show: false, type: '', onConfirm: null });

    // Redirect if flight doesn't exist
    useEffect(() => {
        if (!flight && flights.length > 0) {
            navigate('/');
        }
    }, [flight, flights, navigate]);


    if (!flight) return <Loader fullScreen text="Loading Flight..." />;

    const airlineConfig = getAirline(flight.airline) || {
        ticketTemplate: '/template.docx',
        manifestUs: '/manifest_us.docx',
        manifestAirport: '/manifest_airport.docx'
    };

    const handleAddOrUpdate = (passenger, andNew = false) => {
        addPassengerToFlight(id, passenger);
        if (!andNew) {
            setShowForm(false);
            setEditingPassenger(null);
        }
    };

    const handleEdit = (p) => {
        setEditingPassenger(p);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBatchDownload = async () => {
        setIsGenerating(true);
        const selected = flight.passengers.filter(p => selectedIds.includes(p.id));
        const templateUrl = airlineConfig.ticketTemplate || '/template.docx';
        const result = await generateTickets(selected, templateUrl, flight);
        setIsGenerating(false);
        if (!result.success) {
            toast.error(`Error generating tickets: ${result.error}`);
        } else {
            toast.success('Tickets generated successfully');
        }
    };

    const handleOneByOneDownload = async () => {
        setIsGenerating(true);
        let successCount = 0;
        const templateUrl = airlineConfig.ticketTemplate || '/template.docx';
        for (const sid of selectedIds) {
            const p = flight.passengers.find(px => px.id === sid);
            const res = await generateTickets([p], templateUrl, flight);
            if (res.success) successCount++;
            await new Promise(r => setTimeout(r, 500));
        }
        setIsGenerating(false);
        if (successCount < selectedIds.length) {
            toast.error(`Notice: Only ${successCount} of ${selectedIds.length} tickets were generated.`);
        } else {
            toast.success(`Generated ${successCount} tickets successfully`);
        }
    };

    const handleGenerateManifest = async (type) => {
        setIsGenerating(true);
        let manifestUrl;
        if (type === 'us') {
            manifestUrl = airlineConfig.manifestUs || '/manifest_us.docx';
        } else {
            manifestUrl = airlineConfig.manifestAirport || '/manifest_airport.docx';
        }
        const res = await generateManifest(flight.passengers.filter(px => selectedIds.includes(px.id)), manifestUrl, flight);
        setIsGenerating(false);
        if (!res.success) {
            toast.error(`Error generating manifest: ${res.error}`);
        } else {
            toast.success(`Manifest (${type.toUpperCase()}) generated successfully`);
        }
    };

    const triggerConfirm = (type, onConfirm) => {
        setConfirmAction({
            show: true,
            type,
            onConfirm: () => {
                onConfirm();
                setConfirmAction({ show: false, type: '', onConfirm: null });
            }
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-');
            return `${parseInt(d)}/${parseInt(m)}/${y}`;
        }
        return dateStr;
    };

    return (
        <div className="flight-details-page">
            {showForm ? (
                <div className="registration-fullscreen">
                    <div className="registration-header">
                        <div className="header-title-group">
                            <Plus size={28} className="mr-2" color="var(--primary)" />
                            <h2>{editingPassenger ? 'Edit Passenger' : 'New Passenger Registration'}</h2>
                        </div>
                        <button className="btn-back-to-list" onClick={() => { setShowForm(false); setEditingPassenger(null); }}>
                            <ArrowLeft size={18} /> Close & Back to List
                        </button>
                    </div>
                    <div className="form-content-overlay">
                        <PassengerForm
                            onAdd={(p) => handleAddOrUpdate(p, false)}
                            onAddAndNew={(p) => handleAddOrUpdate(p, true)}
                            initialData={editingPassenger}
                            onCancel={() => { setShowForm(false); setEditingPassenger(null); }}
                            airlineConfig={airlineConfig}
                            currentFlight={flight}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <header className="page-header">
                        <div className="header-left">
                            <button className="btn-icon-text" onClick={() => navigate(-1)}>
                                <ArrowLeft size={18} /> Back
                            </button>
                            <h1 className="page-title">{flight.airline} - {formatDate(flight.date)}</h1>
                        </div>
                        <div className="header-actions">
                            {hasPermission('passenger', 'create') && (
                                <button className="btn btn-primary" onClick={() => { setEditingPassenger(null); setShowForm(true); }}>
                                    Add Passenger <Plus size={18} />
                                </button>
                            )}
                        </div>
                    </header>

                    <FlightSummary flight={flight} resolveUserName={resolveUserName} />

                    <div className="list-section">
                        <PassengerList
                            passengers={flight.passengers}
                            selectedIds={selectedIds}
                            onToggleSelect={(pid) => setSelectedIds(prev => prev.includes(pid) ? prev.filter(i => i !== pid) : [...prev, pid])}
                            onToggleSelectAll={() => setSelectedIds(selectedIds.length === flight.passengers.length ? [] : flight.passengers.map(p => p.id))}
                            onRemove={(pid) => removePassengerFromFlight(id, pid)}
                            onEdit={handleEdit}
                            onDownloadTicket={(p) => generateTickets([p], airlineConfig.ticketTemplate || '/template.docx', flight)}
                            hasPermission={hasPermission}
                            resolveUserName={resolveUserName}
                        />

                        {flight.passengers.length > 0 && (
                            <div className="generate-actions mt-8">
                                {(hasPermission('generating', 'ticket') || hasPermission('generating', 'download')) && (
                                    <div className="batch-options">
                                        <h4><Download size={14} /> Ticket Generation</h4>
                                        <div className="button-group">
                                            {hasPermission('generating', 'batch') && (
                                                <button className="btn btn-primary" onClick={() => triggerConfirm('Batch Tickets', handleBatchDownload)} disabled={selectedIds.length === 0 || isGenerating}>
                                                    {isGenerating ? <Loader text="Generating..." /> : <><Download size={18} /> One File (Batch)</>}
                                                </button>
                                            )}
                                            <button className="btn btn-secondary" onClick={() => triggerConfirm('Individual Tickets', handleOneByOneDownload)} disabled={selectedIds.length === 0 || isGenerating}>
                                                One-by-One
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {hasPermission('generating', 'manifest') && (
                                    <div className="manifest-options mt-4">
                                        <h4><FileText size={14} /> Manifest Documents</h4>
                                        <div className="button-group">
                                            <button className="btn btn-manifest" onClick={() => triggerConfirm('Manifest (Us)', () => handleGenerateManifest('us'))} disabled={selectedIds.length === 0 || isGenerating}>
                                                <Shield size={18} /> Manifest (Us)
                                            </button>
                                            <button className="btn btn-airport" onClick={() => triggerConfirm('Manifest (Airport)', () => handleGenerateManifest('airport'))} disabled={selectedIds.length === 0 || isGenerating}>
                                                <FileText size={18} /> Manifest (Airport)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )
            }

            {
                confirmAction.show && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-icon warning doc-gen">
                                <Plane size={40} />
                            </div>
                            <h2 className="modal-title">Confirm Generation</h2>
                            <div className="modal-description mb-6">
                                <p>You are about to generate <strong>{confirmAction.type}</strong> for:</p>
                                <div className="confirm-details-box">
                                    <p><strong>Airline</strong> <span>{flight.airline}</span></p>
                                    <p><strong>Flight Date</strong> <span>{flight.date}</span></p>
                                    <p><strong>Selection</strong> <span>{selectedIds.length === flight.passengers.length ? 'All Passengers' : `${selectedIds.length} Selected Passengers`}</span></p>
                                </div>
                                <p>Do you want to proceed?</p>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setConfirmAction({ show: false, type: '', onConfirm: null })}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={confirmAction.onConfirm}>
                                    Yes, Generate
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default FlightDetails;
