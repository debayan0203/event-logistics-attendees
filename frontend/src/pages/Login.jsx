import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Added Link here
import { z } from 'zod';
import useAuthStore from '../store/authStore';
import API from '../api/axios';

// 1. Define the Zod Validation Rules
const authSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .endsWith("@gmail.com", "Only @gmail.com addresses are allowed."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g., @, !, #, $).")
});

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Attendee');
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 2. Run Zod Validation before hitting the API
    try {
      if (!isLogin) {
        authSchema.parse({ email, password });
      }
    } catch (err) {
      // If Zod fails, grab the first error message and stop the submission
      setError(err.errors[0].message);
      return; 
    }

    // 3. If validation passes, proceed with Auth
    try {
      if (isLogin) {
        const res = await login(email, password);
        if (!res.success) throw new Error(res.message);
      } else {
        await API.post('/auth/register', { name, email, password, role });
        const res = await login(email, password); 
        if (!res.success) throw new Error('Registration successful, but login failed.');
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser.role === 'Organizer') navigate('/organizer');
      else if (currentUser.role === 'Volunteer') navigate('/scanner');
      else navigate('/attendee');

    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCD34D] flex flex-col justify-between relative overflow-hidden">
      <div className="px-8 pt-16 pb-12 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome!</h1>
            <p className="text-gray-800 font-medium mt-1">
              {isLogin ? 'Sign in to Continue' : 'Create your account'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white text-sm font-semibold p-3 rounded-xl mb-6 shadow-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full">
          {!isLogin && (
            <div>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-white rounded-full text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium placeholder-gray-400"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white rounded-full text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium placeholder-gray-400"
            />
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white rounded-full text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium placeholder-gray-400"
            />
            
            {/* <-- Added Forgot Password Link Here --> */}
            {isLogin && (
              <div className="flex justify-end mt-2 px-2">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </div>

          {!isLogin && (
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-6 py-4 bg-white rounded-full text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium appearance-none cursor-pointer"
              >
                <option value="Attendee">Attendee</option>
                <option value="Organizer">Organizer</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl shadow-xl hover:bg-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              &rarr;
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-t-[40px] px-8 py-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] text-center z-10">
        <button
          type="button"
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
        <p className="text-[11px] text-gray-400 mt-3 font-medium">
          {/* <-- Updated Branding Here --> */}
          VenueSync Secure Authentication &bull; Terms & Conditions Apply
        </p>
      </div>
    </div>
  );
};

export default Login;