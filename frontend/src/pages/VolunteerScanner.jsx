import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import API from '../api/axios';
import useAuthStore from '../store/authStore';

const VolunteerScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [manualId, setManualId] = useState(''); // New state for manual entry
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  // Reusable function for both camera and manual input
  const processScan = async (decodedText) => {
    try {
      const { data } = await API.put(`/registrations/scan/${decodedText}`);
      setScanResult({ type: 'success', text: `✅ ${data.attendee} checked into ${data.event}!` });
      setManualId(''); // Clear input on success
    } catch (err) {
      setScanResult({ type: 'error', text: `❌ ${err.response?.data?.message || 'Scan Failed'}` });
    }
    
    setTimeout(() => setScanResult(null), 4000);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      processScan(manualId.trim());
    }
  };

  useEffect(() => {
    const scannerId = "reader";
    let isMounted = true;

    const readerElement = document.getElementById(scannerId);
    if (readerElement) readerElement.innerHTML = "";

    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        if (!isMounted) return;
        await html5QrCode.pause();
        
        await processScan(decodedText);
        
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            await html5QrCode.resume();
          } catch (e) {
            // Scanner might be stopped
          }
        }, 4000);
      },
      () => {}
    ).catch(err => console.error("Camera initialization error:", err));

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(e => console.error(e));
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
      if (readerElement) readerElement.innerHTML = "";
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
      <div className="w-full max-w-lg flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Scanner</h1>
          <p className="text-gray-400 text-sm mt-1">Volunteer: {user?.name}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-900/50 text-red-400 px-4 py-2 rounded-md font-medium hover:bg-red-900/80 transition-colors">
          Logout
        </button>
      </div>

      <div className="w-full max-w-lg bg-white p-4 rounded-xl shadow-2xl">
        <div id="reader" className="w-full rounded-lg overflow-hidden bg-gray-100 min-h-[250px] flex items-center justify-center">
           {/* If the camera fails to load because of no webcam, it just stays gray */}
        </div>
        
        {/* Manual Entry Fallback */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Manual Override</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Paste Ticket ID..." 
              className="flex-grow px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-black">
              Verify
            </button>
          </form>
        </div>
      </div>

      {scanResult && (
        <div className={`mt-8 w-full max-w-lg p-4 rounded-lg font-bold text-center text-lg ${
          scanResult.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {scanResult.text}
        </div>
      )}
    </div>
  );
};

export default VolunteerScanner;