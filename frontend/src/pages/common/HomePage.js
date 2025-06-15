// src/pages/common/HomePage.js
import React from 'react';

const HomePage = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 lg:py-32 lg:px-8 flex flex-col-reverse lg:flex-row items-center lg:items-start gap-12">
        {/* Left content */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Discover Your Next<br />
            <span className="text-indigo-600">Unforgettable Event.</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto lg:mx-0 text-gray-700 text-lg sm:text-xl">
            From music festivals to tech conferences, find and book tickets for the best events happening near you.
          </p>
          <div className="mt-10 flex justify-center lg:justify-start gap-6">
            <button
              onClick={() => navigate('events')}
              className="inline-flex items-center px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-lg transition"
            >
              Explore Events
            </button>
            <button
              onClick={() => navigate('organizer-login')}
              className="inline-flex items-center px-7 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-md shadow hover:bg-indigo-50 transition"
            >
              Become an Organizer
            </button>
          </div>
        </div>

        {/* Right image */}
        <div className="lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden ring-1 ring-indigo-100">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
              alt="Exciting event crowd"
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white font-semibold text-center text-sm sm:text-base">
                Photo by <a href="https://unsplash.com/@alexandervlad" target="_blank" rel="noreferrer" className="underline">Alexander Vlad</a> on Unsplash
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
