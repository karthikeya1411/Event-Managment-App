import React from "react";

const ElegantIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-yellow-300"
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

const LogoText = () => (
  <div className="flex items-center space-x-3 select-none mt-6 justify-center">
    <ElegantIcon />
    <div className="flex flex-col leading-tight">
      <span className="text-yellow-300 font-extrabold text-2xl tracking-tight">
        Elite Events
      </span>
      <span className="text-yellow-200 text-sm font-medium">
        Discover Your Next Experience
      </span>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
    <div className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
          <p className="text-sm">
            Email:{" "}
            <a
              href="mailto:22311A0563@cse.sreenidhi.edu.in"
              className="underline hover:text-yellow-300"
            >
              22311A0563@cse.sreenidhi.edu.in
            </a>
          </p>
          <p className="text-sm mt-2">Address:</p>
          <address className="not-italic text-sm">
            Sreenidhi Institute of Science and Technology, <br />
            Yamnampet, Ghatkesar, Hyderabad - 501301, Telangana, India
          </address>
        </div>

        {/* Middle column: Quick Links + LogoText */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-3 text-center">Quick Links</h3>
            <ul className="space-y-2 text-sm text-center">
              <li>
                <a href="#" className="underline hover:text-yellow-300">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="#" className="underline hover:text-yellow-300">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Logo + tagline below quick links */}
          <LogoText />
        </div>

        {/* Copyright & Credits */}
        <div className="text-sm">
          <p>&copy; 2025 Elite Events. All rights reserved.</p>
          <p className="mt-4">
            Made by <strong>Karthikeya</strong> for{" "}
            <em>Web Technologies Lab 9FC65 Project Evaluation</em>.
          </p>
          <p className="mt-1">
            This project is submitted to <strong>Dr. Dheeraj Sundaragiri</strong>,<br />
            Web Technologies Course - Faculty
          </p>
          <p className="mt-2 italic text-yellow-300">
            All rights reserved. For demonstration purposes only.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
