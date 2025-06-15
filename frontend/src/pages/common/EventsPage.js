import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const COLORS = [
    'bg-indigo-100 text-indigo-900',
    'bg-teal-100 text-teal-900',
    'bg-violet-100 text-violet-900',
    'bg-amber-100 text-amber-900',
    'bg-emerald-100 text-emerald-900',
    'bg-rose-100 text-rose-900',
];

const EventsPage = ({ navigate }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/event');
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to fetch events');
                setEvents(data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) return <div className="text-center p-10">Loading events...</div>;

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-10 text-center">Upcoming Events</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event, index) => {
                        const colorClass = COLORS[index % COLORS.length];
                        return (
                            <div
                                key={event._id}
                                className={`rounded-xl p-6 shadow-md hover:shadow-lg transition duration-300 ease-in-out flex flex-col justify-between ${colorClass}`}
                            >
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">{event.eventName}</h3>
                                    <p className="text-sm mb-4">{event.description}</p>
                                    <div className="text-sm space-y-1">
                                        <p><strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}</p>
                                        <p><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
                                        <p><strong>Location:</strong> {event.location}</p>
                                        <p><strong>Category:</strong> {event.category}</p>
                                        <p><strong>Available Capacity:</strong> {event.availableCapacity}</p>
                                        <p><strong>Price:</strong> ${event.eventPrice}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('event-details', { id: event._id })}
                                    className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Book Now
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EventsPage;
