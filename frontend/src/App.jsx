import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import VolunteerScanner from './pages/VolunteerScanner';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Public Password Reset Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/resetpassword/:token" element={<ResetPassword />} />
        
        <Route 
          path="/organizer" 
          element={
            <ProtectedRoute allowedRoles={['Organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/scanner" 
          element={
            <ProtectedRoute allowedRoles={['Volunteer']}>
              <VolunteerScanner />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/attendee" 
          element={
            <ProtectedRoute allowedRoles={['Attendee']}>
              <AttendeeDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;