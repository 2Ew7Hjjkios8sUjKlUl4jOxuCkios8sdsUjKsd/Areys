// ============================================================================
// RELATIONAL PASSENGERS - REFACTORED FLIGHT CONTEXT FUNCTIONS
// ============================================================================
// This file contains the refactored versions of FlightContext functions
// to work with relational passengers table instead of JSON arrays.
//
// INSTRUCTIONS: Replace the corresponding functions in FlightContext.jsx
// ============================================================================

// ============================================================================
// 1. LOAD INITIAL DATA - Modified to load passengers separately
// ============================================================================
const loadInitialData = React.useCallback(async () => {
    if (!currentUser) {
        console.log('FlightContext: No user, clearing state');
        setFlights([]);
        setAirlines([]);
        setAgencies([]);
        setPrices({ adult: 130, child: 90, infant: 20, tax: 10, surcharge: 10 });
        setUsers([]);
        setRoleDefinitions([]);
        setLoading(false);
        return;
    }

    console.log('FlightContext: Loading data for user', currentUser.id);
    const userId = currentUser.id;

    try {
        // Determine whose data to fetch
        let targetUserId = userId;

        // Get user role information to check if this is a managed user (Staff)
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role, created_by')
            .eq('user_id', userId)
            .maybeSingle();

        // If user is Staff/Manager and has a creator, fetch the Creator's data instead
        if (roleData && roleData.created_by && roleData.role !== 'Admin') {
            console.log('FlightContext: User is managed, fetching data for owner:', roleData.created_by);
            targetUserId = roleData.created_by;
        }

        setTargetUserId(targetUserId);

        // Use Promise.all to fetch all datasets in parallel for the TARGET user
        const results = await Promise.all([
            supabase.from('flights').select('*').eq('user_id', targetUserId),
            supabase.from('passengers').select('*').eq('user_id', targetUserId), // NEW: Load passengers separately
            supabase.from('airlines').select('*').eq('user_id', targetUserId),
            supabase.from('agencies').select('*').eq('user_id', targetUserId),
            supabase.from('settings').select('*').eq('user_id', targetUserId).maybeSingle(),
            supabase.from('managed_users').select('*').eq('user_id', targetUserId),
            supabase.from('role_permissions').select('*')
        ]);

        const [flightsRes, passengersRes, airlinesRes, agenciesRes, settingsRes, usersRes, rolesRes] = results;

        let currentRoleDefs = [];
        if (rolesRes && !rolesRes.error && rolesRes.data) {
            setRoleDefinitions(rolesRes.data);
            currentRoleDefs = rolesRes.data;
        }

        // 1. Flights (with passengers joined in memory)
        if (!flightsRes.error && flightsRes.data) {
            let flightData = flightsRes.data;

            // Join passengers to flights in memory
            const passengersData = passengersRes?.data || [];
            flightData = flightData.map(flight => ({
                ...flight,
                passengers: passengersData.filter(p => p.flight_id === flight.uuid)
            }));

            // Filter based on "See Own" vs "See Any" (existing permission logic)
            if (userRole !== 'Admin') {
                const myRoleDef = currentRoleDefs.find(r => r.role === userRole);
                if (myRoleDef) {
                    const canViewAnyFlight = myRoleDef.permissions?.flight?.view_any;
                    const canViewOwnFlight = myRoleDef.permissions?.flight?.view_own;
                    const canViewAnyPassenger = myRoleDef.permissions?.passenger?.view_any;
                    const canViewOwnPassenger = myRoleDef.permissions?.passenger?.view_own;

                    // Filter Flights
                    if (!canViewAnyFlight) {
                        if (canViewOwnFlight) {
                            flightData = flightData.filter(f => f.created_by === currentUser.id);
                        } else {
                            flightData = [];
                        }
                    }

                    // Filter Passengers within flights
                    if (!canViewAnyPassenger && canViewOwnPassenger) {
                        flightData = flightData.map(flight => ({
                            ...flight,
                            passengers: flight.passengers.filter(p => p.created_by === currentUser.id)
                        }));
                    } else if (!canViewAnyPassenger && !canViewOwnPassenger) {
                        flightData = flightData.map(flight => ({
                            ...flight,
                            passengers: []
                        }));
                    }
                }
            }

            setFlights(flightData);
        }

        // ... rest of loadInitialData remains the same (airlines, agencies, etc.)

    } catch (error) {
        console.error('Error loading initial data:', error);
        setLoading(false);
    }
}, [currentUser, userRole]);

// ============================================================================
// 2. CREATE FLIGHT - Remove passengers array from creation
// ============================================================================
const createFlight = async (flight) => {
    if (!currentUser || !targetUserId) return;

    const flightData = {
        user_id: targetUserId,
        airline: flight.airline,
        flight_number: flight.flightNumber || flight.flight_number,
        date: flight.date,
        route: flight.route,
        created_by: currentUser.id
        // NO passengers field - they're added separately
    };

    const { data, error } = await supabase
        .from('flights')
        .insert(flightData)
        .select('*')
        .single();

    if (error) {
        console.error('Error creating flight:', error);
        toast.error(`Failed to create flight: ${error.message || error.code}`);
        throw error;
    }

    if (data) {
        setFlights(prev => [...prev, { ...data, passengers: [] }]);
        toast.success('Flight created successfully');
        return data; // Return the created flight with UUID
    }
};

// ============================================================================
// 3. ADD PASSENGER - Use INSERT to passengers table
// ============================================================================
const addPassengerToFlight = async (flightId, passenger) => {
    if (!currentUser) return;

    // flightId should now be the UUID
    const flight = getFlight(flightId);
    if (!flight) {
        toast.error('Flight not found');
        return;
    }

    // Check if updating existing passenger
    if (passenger.id) {
        // UPDATE operation
        const { data, error } = await supabase
            .from('passengers')
            .update({
                name: passenger.name,
                type: passenger.type,
                gender: passenger.gender,
                phone_number: passenger.phoneNumber,
                agency: passenger.agency,
                infants: passenger.infants || [],
                updated_by: currentUser.id
            })
            .eq('id', passenger.id)
            .eq('user_id', targetUserId)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating passenger:', error);
            toast.error(`Failed to update passenger: ${error.message}`);
            throw error;
        }

        if (data) {
            // Update local state
            setFlights(prev => prev.map(f => {
                if (f.uuid === flight.uuid || f.id === flightId) {
                    return {
                        ...f,
                        passengers: f.passengers.map(p => p.id === data.id ? data : p)
                    };
                }
                return f;
            }));
            toast.success('Passenger updated successfully');
        }
    } else {
        // INSERT operation
        const passengerData = {
            flight_id: flight.uuid, // Use UUID, not numeric ID
            user_id: targetUserId,
            name: passenger.name,
            type: passenger.type || 'Adult',
            gender: passenger.gender,
            phone_number: passenger.phoneNumber,
            agency: passenger.agency,
            infants: passenger.infants || [],
            created_by: currentUser.id
        };

        const { data, error } = await supabase
            .from('passengers')
            .insert(passengerData)
            .select('*')
            .single();

        if (error) {
            console.error('Error adding passenger:', error);
            toast.error(`Failed to add passenger: ${error.message}`);
            throw error;
        }

        if (data) {
            // Update local state
            setFlights(prev => prev.map(f => {
                if (f.uuid === flight.uuid || f.id === flightId) {
                    return {
                        ...f,
                        passengers: [...(f.passengers || []), data]
                    };
                }
                return f;
            }));
            toast.success('Passenger added successfully');
        }
    }
};

// ============================================================================
// 4. REMOVE PASSENGER - Use DELETE on passengers table
// ============================================================================
const removePassengerFromFlight = async (flightId, passengerId) => {
    if (!currentUser) return;

    const flight = getFlight(flightId);
    if (!flight) return;

    const passenger = flight.passengers?.find(p => p.id === passengerId);
    const isOwner = passenger?.created_by === currentUser.id;

    if (!hasPermission('passenger', 'delete') && !isOwner) {
        toast.error('You do not have permission to remove this passenger');
        return;
    }

    const { error } = await supabase
        .from('passengers')
        .delete()
        .eq('id', passengerId)
        .eq('user_id', targetUserId);

    if (error) {
        console.error('Error removing passenger:', error);
        toast.error(`Failed to remove passenger: ${error.message}`);
        throw error;
    }

    // Update local state
    setFlights(prev => prev.map(f => {
        if (f.uuid === flight.uuid || f.id === flightId) {
            return {
                ...f,
                passengers: f.passengers.filter(p => p.id !== passengerId)
            };
        }
        return f;
    }));
    toast.success('Passenger removed successfully');
};

// ============================================================================
// 5. GET FLIGHT - Support both ID and UUID
// ============================================================================
const getFlight = (id) => {
    const flight = flights.find(f =>
        f.uuid === id ||
        f.id === id ||
        f.id === id.toString() ||
        f.id === parseInt(id)
    );
    return flight || null;
};

// ============================================================================
// 6. UPDATE FLIGHT - Keep existing logic (no changes needed)
// ============================================================================
// updateFlight function remains unchanged - it doesn't touch passengers

// ============================================================================
// 7. DELETE FLIGHT - CASCADE will handle passengers automatically
// ============================================================================
// deleteFlight remains unchanged - foreign key CASCADE will delete passengers

// ============================================================================
// NOTES FOR INTEGRATION:
// ============================================================================
// 1. Replace loadInitialData in FlightContext.jsx (lines ~30-200)
// 2. Replace createFlight (lines ~250-280)
// 3. Replace addPassengerToFlight (lines ~363-399)
// 4. Replace removePassengerFromFlight (lines ~401-430)
// 5. Replace getFlight (lines ~357-360)
// 6. Update realtime subscriptions to listen to 'passengers' table too
// 7. Update all components to use flight.uuid instead of flight.id for passenger operations
