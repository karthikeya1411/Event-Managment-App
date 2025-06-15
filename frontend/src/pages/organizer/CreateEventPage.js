// src/pages/organizer/CreateEventPage.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import FormInput from '../../components/FormInput';

const CreateEventPage = ({ navigate, state }) => {
  const isEditMode = !!state?.id;
  const [formData, setFormData] = useState({
    eventName: '', description: '', eventDate: '', startTime: '', endTime: '',
    category: '', totalCapacity: '', location: '', eventPrice: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      api.get(`/event/${state.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
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

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

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
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="text-center py-20 text-gray-600 text-lg animate-pulse">
      Loading event data...
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Event' : 'Create a New Event'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl ring-1 ring-gray-200">
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
            <div className="sm:col-span-4">
              <FormInput id="eventName" label="Event Name" type="text" name="eventName" value={formData.eventName} onChange={handleChange} />
            </div>

            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.description}
                onChange={handleChange}
              />
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

        {error && (
          <div className="px-6 pb-2">
            <p className="text-red-600 bg-red-100 p-2 rounded text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-x-4 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={() => navigate('my-events')}
            disabled={submitting}
            className="text-sm font-medium text-gray-700 hover:underline disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition 
              ${submitting ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {submitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
