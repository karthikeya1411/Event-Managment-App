import React from 'react';

const FormInput = ({ id, name, type, placeholder, value, onChange, label, required = true }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1">
            <input id={id} name={name || id} type={type} required={required} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={placeholder} value={value} onChange={onChange} />
        </div>
    </div>
);

export default FormInput;
