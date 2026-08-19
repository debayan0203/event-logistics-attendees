import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import useAuthStore from '../store/authStore';
import { io } from 'socket.io-client';

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalCheckedIn: 0 });
  const [formData, setFormData] = useState({ name: '', date: '', venue: '', capacity: '', imageUrl: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [liveAlert, setLiveAlert] = useState('');
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        API.get('/events'),
        API.get('/events/stats')
      ]);
      setEvents(eventsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  // 1. Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // 2. Initialize WebSocket ONLY after events are loaded
  useEffect(() => {
    if (events.length === 0) return;

    const socket = io('http://localhost:5000');
    
    // Loop through every event and knock on the specific room doors
    events.forEach(event => {
      socket.emit('join-event', event._id);
    });
    
    // Listen for targeted updates
    socket.on('newCheckIn', (data) => {
      setStats(prev => ({ ...prev, totalCheckedIn: prev.totalCheckedIn + 1 }));
      setLiveAlert(`${data.attendeeName} just checked in!`);
      setTimeout(() => setLiveAlert(''), 4000);
    });

    return () => socket.disconnect();
  }, [events]); // If the organizer creates a new event, this re-runs so they join the new room!

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const payload = { ...formData };
      if (!payload.imageUrl) delete payload.imageUrl;

      await API.post('/events', payload);
      setMessage({ type: 'success', text: 'Event published successfully!' });
      setFormData({ name: '', date: '', venue: '', capacity: '', imageUrl: '' });
      fetchData(); // This will update the events array, triggering the WebSocket to rejoin rooms
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create event' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">VenueSync Hub</h1>
          {liveAlert && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              🟢 {liveAlert}
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <p className="text-sm text-gray-500 font-medium">Organizer: {user?.name}</p>
          <button onClick={handleLogout} className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-gray-500 font-medium text-sm">Total Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-gray-500 font-medium text-sm">Total Registrations</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalRegistrations}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">✅</div>
            <p className="text-gray-500 font-medium text-sm">Checked-In Attendees</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalCheckedIn}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Create Event Form (Unchanged from before) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Create New Event</h2>
            {message.text && (
              <div className={`p-4 rounded-lg text-sm mb-6 font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F84464] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Poster Image URL</label>
                <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F84464] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time</label>
                  <input type="datetime-local" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F84464] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacity</label>
                  <input type="number" min="1" required value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F84464] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venue</label>
                <input type="text" required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F84464] focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#F84464] text-white py-3 rounded-lg font-bold hover:bg-[#E03C5A] mt-4">Publish Event</button>
            </form>
          </div>

          {/* Event List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Your Active Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                  <div className="h-48 w-full bg-gray-100 relative">
                    <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-2">{event.name}</h3>
                    <div className="space-y-1 mt-auto">
                      <p className="text-sm text-gray-600 flex items-center gap-2"><span>📍</span> {event.venue}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2"><span>👥</span> {event.capacity} Attendees max</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;