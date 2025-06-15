// src/pages/organizer/OrganizerEventDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../App'; // Assuming App.js exports useAuth
import FormInput from '../../components/FormInput'; // Assuming you create this

const OrganizerEventDashboard = ({ navigate, state }) => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const eventId = state?.id;
    const user = useAuth();

    useEffect(() => {
        if (!eventId) {
            setError('Event ID not provided.');
            setLoading(false);
            return;
        }
        api.get(`/event/${eventId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) throw new Error(data.message);
                setEvent(data.data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [eventId]);

    const handleSendReminders = async () => {
        if (!window.confirm("Are you sure you want to send a reminder email to all attendees?")) return;
        try {
            const res = await api.post(`/event/${eventId}/send-reminder`, {});
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(data.message);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteEvent = async () => {
        if (!window.confirm("Are you sure you want to delete this event? This action is irreversible and will notify all booked attendees.")) return;
        try {
            const res = await api.delete(`/event/${eventId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(data.message);
            navigate('my-events');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    
    if (loading) return <div className="text-center p-10">Loading Event Dashboard...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!event) return <div className="text-center p-10">Could not load event data.</div>;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.eventName}</h1>
                <p className="text-gray-500">{new Date(event.eventDate).toLocaleDateString()} at {event.location}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onClick={() => navigate('edit-event', { id: eventId })} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600">Edit Event</button>
                <button onClick={handleSendReminders} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Send Reminders</button>
                <button onClick={handleDeleteEvent} className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600">Delete Event</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TicketScanner eventId={eventId} />
                <AttendeesList eventId={eventId} />
            </div>
        </div>
    );
};

const TicketScanner = ({ eventId }) => {
    const [uniqueTicketId, setUniqueTicketId] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleScan = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        try {
            const res = await api.post(`/event/${eventId}/scan-ticket`, { uniqueTicketId });
            const data = await res.json();
            if (!res.ok) {
                setIsError(true);
                throw new Error(data.message);
            }
            setMessage(`Success! Ticket for ${data.ticketDetails.attendeeName} scanned.`);
            setUniqueTicketId('');
        } catch (err) {
            setMessage(err.message);
        }
    };
    
    return (
        <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Scanner</h3>
            <form onSubmit={handleScan} className="space-y-4">
                <FormInput id="uniqueTicketId" label="Unique Ticket ID" type="text" name="uniqueTicketId" value={uniqueTicketId} onChange={e => setUniqueTicketId(e.target.value)} required={true} />
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">Scan Ticket</button>
            </form>
            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

const AttendeesList = ({ eventId }) => {
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useAuth();
    console.log(user.user.id);
    const fetchAttendees = async () => {
         setLoading(true);
        try {
            const res = await api.get(`/event/${eventId}/attendees`, user.user );
            
            const data =  await res.json();
            if (!data) throw new Error(data.message);
            setAttendees(data.attendees);
        } catch (err) {
            console.error("Failed to fetch attendees:", err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAttendees();
    }, [eventId]);

    return (
        <div className="bg-white shadow sm:rounded-lg p-6 lg:col-span-1">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Attendees ({attendees.length})</h3>
                <button onClick={fetchAttendees} className="text-sm text-blue-600 hover:text-blue-800">Refresh</button>
            </div>
            {loading ? <p>Loading attendees...</p> : (
                <div className="overflow-y-auto h-96">
                    <ul className="divide-y divide-gray-200">
                        {attendees.length > 0 ? attendees.map(attendee => (
                            <li key={attendee.uniqueTicketId} className="py-3">
                                <p className="text-sm font-medium text-gray-900">{attendee.attendeeName}</p>
                                <p className="text-sm text-gray-500">{attendee.attendeeEmail}</p>
                                <p className="text-xs text-gray-400">Ticket ID: {attendee.uniqueTicketId}</p>
                                <p className={`text-xs font-semibold ${attendee.ticketStatus === 'scanned' ? 'text-green-600' : 'text-gray-600'}`}>Status: {attendee.ticketStatus}</p>
                            </li>
                        )) : <p className="text-sm text-gray-500">No attendees found.</p>}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default OrganizerEventDashboard;
