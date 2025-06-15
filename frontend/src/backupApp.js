import React, { useState, useEffect, createContext, useContext } from 'react';

// ------ Configuration ------
// Make sure your backend server is running and replace this URL if needed.
const API_BASE_URL = 'http://localhost:5000/api'; 

// ------ Asset Placeholders ------
const LOGO_URL = "https://placehold.co/150x50/1e40af/ffffff?text=EliteEvents";
const EVENT_PLACEHOLDER_URL = "https://placehold.co/600x400/e0e7ff/3730a3?text=Event";

// ------ API Service ------
// A helper for making API calls. It automatically adds the auth token.
const api = {
  get: (path) => fetch(`${API_BASE_URL}${path}`, { headers: { 'x-auth-token': localStorage.getItem('token') } }),
  post: (path, data) => fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  }),
  put: (path, data) => fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  }),
  delete: (path) => fetch(`${API_BASE_URL}${path}`, { 
    method: 'DELETE',
    headers: { 'x-auth-token': localStorage.getItem('token') }
  }),
};

// ------ Authentication Context ------
// Manages user authentication state throughout the app.
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const authContextValue = { user, login, logout, isAuthenticated: !!user };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ------ Reusable Components ------

const Navbar = ({ navigate }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <a onClick={() => navigate('home')} className="cursor-pointer">
              <img src={LOGO_URL} alt="Elite Events Logo" style={{height: '40px'}}/>
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a onClick={() => navigate('home')} className="text-gray-600 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Home</a>
              <a onClick={() => navigate('events')} className="text-gray-600 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Events</a>
              {isAuthenticated ? (
                <>
                  {user.role === 'organizer' && (
                    <a onClick={() => navigate('my-events')} className="text-gray-600 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">My Events</a>
                  )}
                  {user.role === 'attendee' && (
                    <a onClick={() => navigate('my-bookings')} className="text-gray-600 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">My Bookings</a>
                  )}
                  <a onClick={() => navigate('profile')} className="text-gray-600 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Profile</a>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>
                </>
              ) : (
                <>
                  <a onClick={() => navigate('login')} className="text-gray-600 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Login</a>
                  <a onClick={() => navigate('register')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Register</a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
    <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
            <div className="mt-8 md:mt-0 md:order-1">
                <p className="text-center text-base text-gray-400">&copy; 2024 Elite Events. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

const FormInput = ({ id, name, type, placeholder, value, onChange, label, required = true }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1">
            <input id={id} name={name || id} type={type} required={required} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={placeholder} value={value} onChange={onChange} />
        </div>
    </div>
);

const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ------ Page Components ------

const HomePage = ({ navigate }) => (
    <div className="bg-blue-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-24 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    <span className="block">Discover Your Next</span>
                    <span className="block text-blue-600">Unforgettable Event.</span>
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                    From music festivals to tech conferences, find and book tickets for the best events happening near you.
                </p>
                <div className="mt-8 flex lg:flex-shrink-0">
                    <div className="inline-flex rounded-md shadow">
                        <a onClick={() => navigate('events')} className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                            Explore Events
                        </a>
                    </div>
                     <div className="ml-3 inline-flex rounded-md shadow">
                        <a onClick={() => navigate('register')} className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 cursor-pointer">
                           Become an Organizer
                        </a>
                    </div>
                </div>
            </div>
             <div className="mt-8 lg:mt-0 lg:w-1/2">
                <img className="w-full rounded-lg shadow-xl" src={EVENT_PLACEHOLDER_URL} alt="Events"/>
            </div>
        </div>
    </div>
);

const LoginPage = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to login.');
            
            login(data.user, data.token);
            navigate('home');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <FormInput id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} label="Email address" />
                        <FormInput id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} label="Password" />
                        
                        {error && <p className="text-red-500 text-xs italic">{error}</p>}

                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Sign in
                            </button>
                        </div>
                         <div className="text-sm text-center">
                            <a onClick={() => navigate('register')} className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                                Don't have an account? Sign up
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const RegisterPage = ({ navigate }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', dob: '', role: 'attendee' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const res = await api.post('/auth/register', formData);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessage(data.message);
            // After successful registration initiation, redirect to OTP page.
            setTimeout(() => navigate('verify-otp', { email: formData.email }), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create a new account</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <FormInput id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} label="Full Name" />
                        <FormInput id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} label="Email address" />
                        <FormInput id="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} label="Password" />
                        <FormInput id="dob" type="date" value={formData.dob} onChange={handleChange} label="Date of Birth" />
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am an:</label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                <option value="attendee">Attendee</option>
                                <option value="organizer">Organizer</option>
                            </select>
                        </div>
                        
                        {error && <p className="text-red-500 text-xs italic">{error}</p>}
                        {message && <p className="text-green-500 text-xs italic">{message}</p>}

                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                Register
                            </button>
                        </div>
                         <div className="text-sm text-center">
                            <a onClick={() => navigate('login')} className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                                Already have an account? Sign in
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const OTPVerificationPage = ({ navigate, state }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { login } = useAuth();
    const email = state?.email;

    useEffect(() => {
        if (!email) {
            setError("Email not provided. Please start registration again.");
        }
    }, [email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const res = await api.post('/auth/verify-registration-otp', { email, otp });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage('Verification successful! Logging you in...');
            login(data.user, data.token);
            setTimeout(() => navigate('home'), 2000);

        } catch (err) {
            setError(err.message);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify Your Account</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    An OTP has been sent to {email || 'your email'}.
                </p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <FormInput id="otp" type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} label="One-Time Password" />
                        {error && <p className="text-red-500 text-xs italic">{error}</p>}
                        {message && <p className="text-green-500 text-xs italic">{message}</p>}
                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                Verify
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

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
        <div className="bg-white">
            <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Upcoming Events</h2>
                <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                    {events.map(event => (
                        <div key={event._id} className="group relative cursor-pointer" onClick={() => navigate('event-details', { id: event._id })}>
                            <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                                <img src={EVENT_PLACEHOLDER_URL} alt={event.eventName} className="w-full h-full object-center object-cover lg:w-full lg:h-full" />
                            </div>
                            <div className="mt-4 flex justify-between">
                                <div>
                                    <h3 className="text-sm text-gray-700">
                                        <span aria-hidden="true" className="absolute inset-0" />
                                        {event.eventName}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</p>
                                </div>
                                <p className="text-sm font-medium text-gray-900">${event.eventPrice}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

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
        } catch(err) {
            setError(err.message);
        }
    };
    
    if (loading) return <div className="p-10 text-center">Loading event details...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!event) return <div className="p-10 text-center">Event not found.</div>;

    return (
        <div className="bg-white">
            <div className="pt-6">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-3 lg:grid-rows-[auto,auto,1fr] lg:gap-x-8">
                    <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{event.eventName}</h1>
                    </div>
                    <div className="mt-4 lg:mt-0 lg:row-span-3">
                        <h2 className="sr-only">Event information</h2>
                        <p className="text-3xl text-gray-900">${event.eventPrice}</p>
                        
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900">Details</h3>
                            <div className="mt-4 space-y-4 text-sm text-gray-600">
                                <p><strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
                                <p><strong>Location:</strong> {event.location}</p>
                                <p><strong>Category:</strong> {event.category}</p>
                                <p><strong>Available Capacity:</strong> {event.availableCapacity}</p>
                            </div>
                        </div>

                        {isAuthenticated && user.role === 'attendee' && (
                           <button onClick={() => setShowBookingModal(true)} className="mt-10 w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700">Book Now</button>
                        )}
                         {isAuthenticated && user.role === 'organizer' && user.id === event.organizer && (
                             <button onClick={() => navigate('organizer-event-dashboard', { id: event._id })} className="mt-10 w-full bg-green-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-green-700">Manage Event</button>
                         )}
                    </div>
                    <div className="py-10 lg:pt-6 lg:pb-16 lg:col-start-1 lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
                        <div>
                            <h3 className="sr-only">Description</h3>
                            <div className="space-y-6">
                                <p className="text-base text-gray-900">{event.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Modal show={showBookingModal} onClose={() => setShowBookingModal(false)} title="Confirm Your Booking">
                <p className="text-sm text-gray-500 mb-4">How many tickets would you like to book for <strong>{event.eventName}</strong>?</p>
                <FormInput id="numTickets" type="number" value={numTickets} onChange={(e) => setNumTickets(e.target.value)} label="Number of Tickets"/>
                <p className="font-bold mt-4">Total Price: ${event.eventPrice * numTickets}</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-5 sm:mt-6">
                    <button onClick={handleInitiateBooking} type="button" className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700">
                        Initiate Booking
                    </button>
                </div>
            </Modal>
        </div>
    );
};


const MyBookingsPage = ({ navigate }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [actionType, setActionType] = useState(''); // 'confirm_booking' or 'confirm_cancel'
    const [showOtpModal, setShowOtpModal] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
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

    const handleOpenOtpModal = (bookingId, type) => {
        setSelectedBookingId(bookingId);
        setActionType(type);
        setOtp('');
        setError('');
        setShowOtpModal(true);
    };
    
    const handleVerifyOtp = async () => {
        setError('');
        try {
            const res = await api.post('/booking/verify-otp', { otp, actionType, bookingId: selectedBookingId });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            alert(data.message);
            setShowOtpModal(false);
            setOtp('');
            fetchBookings(); // Refresh bookings list
        } catch(err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="text-center p-10">Loading your bookings...</div>;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bookings</h1>
            {error && !showOtpModal && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {bookings.length > 0 ? bookings.map(booking => (
                        <li key={booking._id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{booking.event.eventName}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {booking.status.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500 mr-6">
                                            Tickets: {booking.numberOfTickets}
                                        </p>
                                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            Total: ${booking.totalPrice}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        {booking.status === 'pending_confirmation' && (
                                            <button onClick={() => handleOpenOtpModal(booking._id, 'confirm_booking')} className="font-medium text-blue-600 hover:text-blue-500">Confirm Booking</button>
                                        )}
                                        {booking.status === 'confirmed' && (
                                             <button onClick={() => handleOpenOtpModal(booking._id, 'confirm_cancel')} className="font-medium text-red-600 hover:text-red-500 ml-4">Cancel</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    )) : <li className="p-6 text-center">You have no bookings yet.</li>}
                </ul>
            </div>

            <Modal show={showOtpModal} onClose={() => setShowOtpModal(false)} title="Enter OTP to Proceed">
                <p className="text-sm text-gray-600 mb-4">Please enter the OTP sent to your email to {actionType.replace(/_/g, ' ')}.</p>
                <FormInput id="otp" type="text" value={otp} onChange={e => setOtp(e.target.value)} label="OTP Code" />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button onClick={handleVerifyOtp} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Verify & Proceed</button>
            </Modal>
        </div>
    );
};

const MyEventsPage = ({ navigate }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const res = await api.get('/event/my-events');
                const data = await res.json();
                if(!res.ok) throw new Error(data.message);
                setEvents(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMyEvents();
    }, []);

    if (loading) return <p className="p-10 text-center">Loading your events...</p>
    
    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">My Events</h1>
                    <p className="mt-2 text-sm text-gray-700">A list of all the events you have created.</p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button onClick={() => navigate('create-event')} type="button" className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Create Event</button>
                </div>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md my-4">{error}</p>}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Event</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Booked / Total</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Manage</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {events.map((event) => (
                                        <tr key={event._id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{event.eventName}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{event.bookedCapacity || 0} / {event.totalCapacity}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <a onClick={() => navigate('organizer-event-dashboard', { id: event._id })} className="text-blue-600 hover:text-blue-900 cursor-pointer">Manage<span className="sr-only">, {event.eventName}</span></a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateEventPage = ({ navigate, state }) => {
    const isEditMode = !!state?.id;
    const [formData, setFormData] = useState({
        eventName: '', description: '', eventDate: '', startTime: '', endTime: '',
        category: '', totalCapacity: '', location: '', eventPrice: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditMode);
    
    useEffect(() => {
        if(isEditMode) {
            api.get(`/event/${state.id}`)
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        const eventData = data.data;
                        eventData.eventDate = new Date(eventData.eventDate).toISOString().split('T')[0];
                        setFormData(eventData);
                    } else {
                        setError(data.message);
                    }
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isEditMode, state?.id]);

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const res = isEditMode
                ? await api.put(`/event/${state.id}`, formData)
                : await api.post('/event', formData);

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(`Event ${isEditMode ? 'updated' : 'created'} successfully!`);
            navigate('my-events');
        } catch (err) {
            setError(err.message);
        }
    };
    
    if (loading) return <p className="text-center p-10">Loading event data...</p>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{isEditMode ? 'Edit Event' : 'Create a New Event'}</h1>
            <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <FormInput id="eventName" label="Event Name" type="text" name="eventName" value={formData.eventName} onChange={handleChange} />
                        </div>
                         <div className="col-span-full">
                             <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Description</label>
                             <div className="mt-2">
                                 <textarea id="description" name="description" rows="3" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" value={formData.description} onChange={handleChange}></textarea>
                             </div>
                         </div>
                        <div className="sm:col-span-3">
                            <FormInput id="eventDate" label="Date" type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} />
                        </div>
                        <div className="sm:col-span-3">
                           <FormInput id="location" label="Location" type="text" name="location" value={formData.location} onChange={handleChange} />
                        </div>
                         <div className="sm:col-span-3">
                            <FormInput id="startTime" label="Start Time" type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
                        </div>
                        <div className="sm:col-span-3">
                           <FormInput id="endTime" label="End Time" type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
                        </div>
                        <div className="sm:col-span-2">
                           <FormInput id="category" label="Category" type="text" name="category" value={formData.category} onChange={handleChange} />
                        </div>
                         <div className="sm:col-span-2">
                           <FormInput id="totalCapacity" label="Capacity" type="number" name="totalCapacity" value={formData.totalCapacity} onChange={handleChange} />
                        </div>
                         <div className="sm:col-span-2">
                           <FormInput id="eventPrice" label="Price ($)" type="number" name="eventPrice" value={formData.eventPrice} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                {error && <p className="px-8 text-red-500 text-sm">{error}</p>}
                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                    <button type="button" onClick={() => navigate('my-events')} className="text-sm font-semibold leading-6 text-gray-900">Cancel</button>
                    <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500">{isEditMode ? 'Save Changes' : 'Create Event'}</button>
                </div>
            </form>
        </div>
    );
};

const ProfilePage = ({ navigate }) => {
    const { user, logout } = useAuth();

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application role.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Full name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Email address</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{user.role}</dd>
                        </div>
                    </dl>
                </div>
            </div>
             <div className="mt-6">
                <button onClick={() => { logout(); navigate('home'); }} className="w-full sm:w-auto bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">Logout</button>
            </div>
        </div>
    );
};

// ------ NEW ORGANIZER COMPONENTS ------

const OrganizerEventDashboard = ({ navigate, state }) => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const eventId = state?.id;

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

    const fetchAttendees = async () => {
         setLoading(true);
        try {
            const res = await api.get(`/event/${eventId}/attendees`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
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


// ------ Main App Component with Router ------
export default function App() {
  const [route, setRoute] = useState('home');
  const [routeState, setRouteState] = useState(null);

  const navigate = (newRoute, state = null) => {
    setRoute(newRoute);
    setRouteState(state);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const PageComponent = () => {
    switch (route) {
      case 'home': return <HomePage navigate={navigate} />;
      case 'login': return <LoginPage navigate={navigate} />;
      case 'register': return <RegisterPage navigate={navigate} />;
      case 'verify-otp': return <OTPVerificationPage navigate={navigate} state={routeState} />;
      case 'events': return <EventsPage navigate={navigate} />;
      case 'event-details': return <EventDetailsPage navigate={navigate} state={routeState} />;
      case 'my-bookings': return <MyBookingsPage navigate={navigate} />;
      case 'my-events': return <MyEventsPage navigate={navigate} />;
      case 'create-event': return <CreateEventPage navigate={navigate} />;
      case 'edit-event': return <CreateEventPage navigate={navigate} state={routeState} />;
      case 'profile': return <ProfilePage navigate={navigate} />;
      case 'organizer-event-dashboard': return <OrganizerEventDashboard navigate={navigate} state={routeState} />;
      default: return <HomePage navigate={navigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar navigate={navigate} />
        <main className="flex-grow">
          <PageComponent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
