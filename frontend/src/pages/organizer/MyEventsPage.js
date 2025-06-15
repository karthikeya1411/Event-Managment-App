// src/pages/organizer/MyEventsPage.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MyEventsPage = ({ navigate }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await api.get('/event/my-events');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEvents(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  if (loading)
    return <p className="p-10 text-center text-lg text-gray-600">Loading your events...</p>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="mt-2 text-sm text-gray-600">A list of all the events you have created and their current booking status.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-6">
          <button
            onClick={() => navigate('create-event')}
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            + Create Event
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 bg-red-100 p-4 rounded-md text-sm mb-6">{error}</p>
      )}

      {events.length === 0 ? (
        <div className="text-center text-gray-500 mt-20 text-lg">
          You haven’t created any events yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const booked = event.totalCapacity - event.availableCapacity;
            return (
              <div
                key={event._id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{event.eventName}</h2>
                <p className="text-sm text-gray-600 mb-3">
                  📅 {new Date(event.eventDate).toLocaleDateString()}
                </p>

                <div className="flex items-center space-x-2 mb-4">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Booked: {booked}
                  </span>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Available: {event.availableCapacity}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Total: {event.totalCapacity}
                  </span>
                </div>

                <button
                  onClick={() => navigate('organizer-event-dashboard', { id: event._id })}
                  className="mt-auto inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                >
                  Manage Event →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;
