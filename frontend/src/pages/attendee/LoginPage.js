// src/pages/attendee/LoginPage.js
import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../App'; // Assuming App.js exports useAuth
import FormInput from '../../components/FormInput'; // Assuming you create this

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
            
            if (data.user.role !== 'attendee') {
                throw new Error('This login is for attendees only.');
            }

            login(data.user, data.token);
            navigate('home');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Attendee Login</h2>
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

export default LoginPage;
