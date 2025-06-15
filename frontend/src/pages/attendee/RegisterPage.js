// src/pages/attendee/RegisterPage.js
import React, { useState } from 'react';
import api from '../../services/api';
import FormInput from '../../components/FormInput'; // Assuming you create this

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
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create a New Account</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <FormInput id="name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} label="Full Name" />
                        <FormInput id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} label="Email address" />
                        <FormInput id="password" name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} label="Password" />
                        <FormInput id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} label="Date of Birth" />
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

export default RegisterPage;
