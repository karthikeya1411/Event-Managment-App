// src/pages/attendee/OTPVerificationPage.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../App'; // Assuming App.js exports useAuth
import FormInput from '../../components/FormInput'; // Assuming you create this

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
            setError(err.message || 'Verification failed. Please try again.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            <h2 className="text-2xl font-bold mb-4">OTP Verification</h2>
            <form onSubmit={handleSubmit}>
                <FormInput
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    label="Enter OTP"
                    required
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
                <button
                    type="submit"
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                    Verify
                </button>
            </form>
        </div>
    );
};

export default OTPVerificationPage;
