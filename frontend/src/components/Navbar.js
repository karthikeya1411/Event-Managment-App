import React from "react";
import { useAuth, LOGO_URL } from "../App";

// Elegant calendar/event icon from Heroicons (outline)
const ElegantIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-indigo-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z"
    />
  </svg>
);

const Navbar = ({ navigate }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("home");
  };

  return (
    <nav className="bg-white bg-opacity-80 backdrop-blur-sm border-b border-indigo-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center h-20">
        {/* Left side: Icon + Logo + Text */}
        <div
          onClick={() => navigate("home")}
          className="flex items-center space-x-3 cursor-pointer flex-shrink-0"
          aria-label="Navigate to Home"
        >
          <ElegantIcon />
          <div className="flex flex-col leading-tight">
            <span className="text-indigo-800 font-extrabold text-2xl tracking-tight select-none">
              Elite Events
            </span>
            <span className="text-indigo-600 text-xs font-medium select-none">
              Discover Your Next Experience
            </span>
          </div>
        </div>

        {/* Center: Buttons */}
        <div className="flex flex-grow justify-center space-x-12">
          <button
            onClick={() => navigate("home")}
            className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
          >
            Home
          </button>
          <button
            onClick={() => navigate("events")}
            className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
          >
            Events
          </button>

          {isAuthenticated ? (
            <>
              {user.role === "organizer" && (
                <button
                  onClick={() => navigate("my-events")}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
                >
                  My Events
                </button>
              )}
              {user.role === "attendee" && (
                <button
                  onClick={() => navigate("my-bookings")}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
                >
                  My Bookings
                </button>
              )}
              <button
                onClick={() => navigate("profile")}
                className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
              >
                Profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("login")}
                className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
              >
                Attendee Login
              </button>
              <button
                onClick={() => navigate("organizer-login")}
                className="text-indigo-700 hover:text-indigo-900 font-semibold text-md transition"
              >
                Organizer Login
              </button>
              <button
                onClick={() => navigate("register")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md font-semibold text-md transition"
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Right side: Logout button */}
        {isAuthenticated && (
          <div className="flex-shrink-0 ml-auto">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
