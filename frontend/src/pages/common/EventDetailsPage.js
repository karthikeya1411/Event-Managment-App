import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../App';
import FormInput from '../../components/FormInput';
import Modal from '../../components/Modal';

const EventDetailsPage = ({ navigate, state }) => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [numTickets, setNumTickets] = useState(1);
    const { user, isAuthenticated } = useAuth();
    const eventId = state?.id;

    useEffect(() => {
        if (!eventId) {
            setError('Event ID not found.');
            setLoading(false);
            return;
        }
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/event/${eventId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to fetch event details.');
                setEvent(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleInitiateBooking = async () => {
        setError('');
        try {
            const res = await api.post('/booking/initiate-booking', { eventId, numberOfTickets: numTickets });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(`Booking initiated! Check your email for an OTP to confirm booking ID: ${data.bookingId}`);
            setShowBookingModal(false);
            navigate('my-bookings');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading event details...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!event) return <div className="p-10 text-center">Event not found.</div>;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen py-10 px-4 sm:px-8">
            <div className="max-w-5xl mx-auto shadow-xl rounded-xl bg-white p-8 sm:p-10 border border-gray-200">
                <h1 className="text-3xl font-bold text-blue-700 mb-4">{event.eventName}</h1>
                <p className="text-gray-700 text-md mb-6">{event.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-600">
                    <p><strong className="text-blue-600">📅 Date:</strong> {new Date(event.eventDate).toLocaleDateString()}</p>
                    <p><strong className="text-blue-600">🕒 Time:</strong> {event.startTime} - {event.endTime}</p>
                    <p><strong className="text-blue-600">📍 Location:</strong> {event.location}</p>
                    <p><strong className="text-blue-600">🏷️ Category:</strong> {event.category}</p>
                    <p><strong className="text-blue-600">👥 Available Capacity:</strong> {event.availableCapacity}</p>
                    <p><strong className="text-blue-600">💵 Price:</strong> ${event.eventPrice}</p>
                </div>

                <div className="mt-8">
                    {isAuthenticated && user.role === 'attendee' && (
                        <button
                            onClick={() => setShowBookingModal(true)}
                            className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 transition"
                        >
                            Book Now
                        </button>
                    )}
                    {isAuthenticated && user.role === 'organizer' && user.id === event.organizer && (
                        <button
                            onClick={() => navigate('organizer-event-dashboard', { id: event._id })}
                            className="w-full sm:w-auto bg-green-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-green-700 transition"
                        >
                            Manage Event
                        </button>
                    )}
                </div>
            </div>

            <Modal show={showBookingModal} onClose={() => setShowBookingModal(false)} title="Confirm Your Booking">
                <p className="text-sm text-gray-500 mb-4">
                    How many tickets would you like to book for <strong>{event.eventName}</strong>?
                </p>
                <FormInput
                    id="numTickets"
                    type="number"
                    value={numTickets}
                    onChange={(e) => setNumTickets(e.target.value)}
                    label="Number of Tickets"
                     min={1}
  max={event.availableCapacity}
                />
                <p className="font-bold mt-4">Total Price: ${event.eventPrice * numTickets}</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-5 sm:mt-6">
              <button
  onClick={handleInitiateBooking}
  type="button"
  disabled={numTickets < 1 || numTickets > event.availableCapacity}
  className={`w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition ${
    (numTickets < 1 || numTickets > event.availableCapacity) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
  }`}
>
  Initiate Booking
</button>

                </div>
            </Modal>
        </div>
    );
};

export default EventDetailsPage;
