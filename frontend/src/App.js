// src/App.js
import React, { useState, useEffect, createContext, useContext } from 'react';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import Pages
import HomePage from './pages/common/HomePage';
import EventsPage from './pages/common/EventsPage';
import EventDetailsPage from './pages/common/EventDetailsPage';
import ProfilePage from './pages/common/ProfilePage';
import AttendeeLoginPage from './pages/attendee/LoginPage';
import RegisterPage from './pages/attendee/RegisterPage';
import OTPVerificationPage from './pages/attendee/OTPVerificationPage';
import MyBookingsPage from './pages/attendee/MyBookingsPage';
import OrganizerLoginPage from './pages/organizer/LoginPage';
import MyEventsPage from './pages/organizer/MyEventsPage';
import CreateEventPage from './pages/organizer/CreateEventPage';
import OrganizerEventDashboard from './pages/organizer/OrganizerEventDashboard';

// ------ Asset Placeholders ------
export const LOGO_URL = "https://placehold.co/150x50/1e40af/ffffff?text=EliteEvents";

// ------ Authentication Context ------
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

export const useAuth = () => useContext(AuthContext);

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
      // Common Pages
      case 'home': return <HomePage navigate={navigate} />;
      case 'events': return <EventsPage navigate={navigate} />;
      case 'event-details': return <EventDetailsPage navigate={navigate} state={routeState} />;
      case 'profile': return <ProfilePage navigate={navigate} />;

      // Attendee Pages
      case 'login': return <AttendeeLoginPage navigate={navigate} />;
      case 'register': return <RegisterPage navigate={navigate} />;
      case 'verify-otp': return <OTPVerificationPage navigate={navigate} state={routeState} />;
      case 'my-bookings': return <MyBookingsPage navigate={navigate} />;

      // Organizer Pages
      case 'organizer-login': return <OrganizerLoginPage navigate={navigate} />;
      case 'my-events': return <MyEventsPage navigate={navigate} />;
      case 'create-event': return <CreateEventPage navigate={navigate} />;
      case 'edit-event': return <CreateEventPage navigate={navigate} state={routeState} />;
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
