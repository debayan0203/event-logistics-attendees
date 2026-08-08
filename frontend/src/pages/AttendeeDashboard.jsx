import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import API from '../api/axios';
import useAuthStore from '../store/authStore';

const AttendeeDashboard = () => {
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        API.get('/events'),
        API.get('/registrations/my-tickets')
      ]);
      setEvents(eventsRes.data);
      setMyTickets(ticketsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookTicket = async (eventId) => {
    setMessage({ type: '', text: '' });
    try {
      await API.post(`/registrations/${eventId}`);
      setMessage({ type: 'success', text: 'Ticket booked successfully!' });
      fetchData(); // Refresh tickets to show the new QR code
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to book ticket' });
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Extract event IDs the user is already registered for
  const registeredEventIds = myTickets.map(ticket => ticket.event._id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">EventPulse</h1>
        <div className="flex items-center gap-6">
          <p className="text-sm text-gray-500 font-medium">Attendee: {user?.name}</p>
          <button onClick={handleLogout} className="text-sm font-semibold text-gray-600 hover:text-[#F84464] transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {message.text && (
          <div className={`p-4 rounded-lg text-sm mb-8 font-bold text-center shadow-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* My Tickets Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6">My Digital Tickets</h2>
          {myTickets.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
              You haven't booked any tickets yet. Browse events below!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myTickets.map((ticket) => (
                <div key={ticket._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* Updated QR Code Wrapper with ID */}
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <QRCodeCanvas value={ticket.qrId} size={120} level={"H"} />
                    <p className="text-[10px] text-gray-400 mt-2 text-center break-all w-28 leading-tight">
                      {ticket.qrId}
                    </p>
                  </div>
                  <div className="text-center sm:text-left flex-grow">
                    <h3 className="text-xl font-bold text-gray-900">{ticket.event.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-3">📍 {ticket.event.venue}</p>
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                      ticket.status === 'Checked-In' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.status === 'Checked-In' ? '✅ Used (Checked-In)' : '🎫 Valid Ticket'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Browse Events Section */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {events.map((event) => {
              const isRegistered = registeredEventIds.includes(event._id);
              return (
                <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                  <div className="h-48 w-full bg-gray-100 relative">
                    <img 
                      src={event.imageUrl || 'https://images.unsplash.com/photo-1540039155732-6762b5134f1a?q=80&w=800&auto=format&fit=crop'} 
                      alt={event.name} 
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1540039155732-6762b5134f1a?q=80&w=800&auto=format&fit=crop'}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{event.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 truncate">📍 {event.venue}</p>
                    
                    <button 
                      onClick={() => handleBookTicket(event._id)}
                      disabled={isRegistered}
                      className={`mt-auto w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${
                        isRegistered 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      {isRegistered ? 'Already Booked' : 'Book Ticket'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AttendeeDashboard;