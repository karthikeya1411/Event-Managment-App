import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../App';
import FormInput from '../../components/FormInput';
import Modal from '../../components/Modal';

const MyBookingsPage = ({ navigate }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [actionType, setActionType] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null); // Which booking's tickets shown

  // Fetch user bookings from API
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/booking/my');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBookings(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Expand/collapse tickets section
  const handleToggleTickets = (bookingId) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
    } else {
      setExpandedBookingId(bookingId);
    }
  };

  // Open modal and initiate OTP sending if needed
  const handleOpenOtpModal = async (bookingId, type) => {
    setSelectedBookingId(bookingId);
    setActionType(type);
    setOtp('');
    setError('');

    try {
      if (type === 'confirm_cancel') {

        // Initiate cancellation OTP send
        const res = await api.post('/booking/initiate-cancellation', { user, bookingId,  });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
      }
    } catch (err) {
      setError(`Failed to send OTP: ${err.message}`);
      return; // don't open modal if fail
    }

    setShowOtpModal(true);
  };

  // Verify OTP on modal submit
  const handleVerifyOtp = async () => {
    setError('');
    try {
      const res = await api.post('/booking/verify-otp', { otp, actionType, bookingId: selectedBookingId, user });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      setShowOtpModal(false);
      setOtp('');
      fetchBookings(); // refresh after action
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-600">Loading your bookings...</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-10">My Bookings</h1>

      {error && !showOtpModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error:</strong> <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6">
        {bookings.length > 0 ? (
          [...bookings]
            // Sort so cancelled are at the end
            .sort((a, b) => (a.status === 'cancelled' ? 1 : -1) - (b.status === 'cancelled' ? 1 : -1))
            .map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-xl font-semibold text-blue-700">{booking.event.eventName}</h2>
                    <div className="text-sm text-gray-500">
                      Tickets: {booking.numberOfTickets} • Total: ${booking.totalPrice}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold 
                      ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.status.replace(/_/g, ' ')}
                    </span>

                    {booking.status === 'pending_confirmation' && (
                      <button
                        onClick={() => handleOpenOtpModal(booking._id, 'confirm_booking')}
                        className="bg-blue-500 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-600"
                      >
                        Confirm
                      </button>
                    )}

                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleToggleTickets(booking._id)}
                          className="bg-green-500 text-white px-4 py-2 text-sm rounded-md hover:bg-green-600"
                        >
                          {expandedBookingId === booking._id ? 'Hide Tickets' : 'View Tickets'}
                        </button>
                        <button
                          onClick={() => handleOpenOtpModal(booking._id, 'confirm_cancel')}
                          className="bg-red-500 text-white px-4 py-2 text-sm rounded-md hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expandedBookingId === booking._id && booking.status === 'confirmed' && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Tickets</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {booking.tickets.map((ticket, index) => (
                        <div
                          key={ticket.uniqueTicketId}
                          className="bg-white border border-gray-200 p-4 rounded-xl text-center shadow-sm"
                        >
                          <p className="text-sm font-medium text-gray-800">Ticket {index + 1}</p>
                          <img
                            src={ticket.qrCodeDataUrl}
                            alt={`QR Code Ticket ${index + 1}`}
                            className="w-32 h-32 mx-auto my-3"
                          />
                          <p className="text-xs text-gray-500 break-words">ID: {ticket.uniqueTicketId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="text-center text-gray-600">You have no bookings yet.</div>
        )}
      </div>

      {/* OTP Modal */}
      <Modal show={showOtpModal} onClose={() => setShowOtpModal(false)} title="🔐 Enter OTP to Proceed">
        <div className="text-sm text-gray-700 mb-4">
          Please enter the OTP sent to your email to <strong>{actionType.replace(/_/g, ' ')}</strong>.
        </div>
        <FormInput
          id="otp"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          label="OTP Code"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={handleVerifyOtp}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Verify & Proceed
        </button>
      </Modal>
    </div>
  );
};

export default MyBookingsPage;
