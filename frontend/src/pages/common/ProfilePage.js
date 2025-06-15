// src/pages/common/ProfilePage.js
import React from 'react';
import { useAuth } from '../../App'; // Assuming App.js exports useAuth

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

export default ProfilePage;
