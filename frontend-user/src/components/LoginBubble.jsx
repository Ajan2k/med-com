import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientAPI } from '../services/api';
import { Mail, Lock, User, Phone, ArrowRight, ChevronRight, AlertCircle } from 'lucide-react';

const LoginBubble = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', phone: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          if (onLoginSuccess) onLoginSuccess();
        } else {
          setError(res.message);
        }
      }
      else if (mode === 'register') {
        await patientAPI.register(formData);
        // Auto-login after register
        const res = await login(formData.email, formData.password);
        if (res.success && onLoginSuccess) onLoginSuccess();
      }
      else if (mode === 'forgot') {
        // Mock recovery
        alert("Recovery link sent to your email.");
        setMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Action failed.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mx-auto mt-4">

      {/* HEADER TABS */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${mode === 'login' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('register')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${mode === 'register' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Register
        </button>
      </div>

      <div className="p-6">
        {mode === 'forgot' ? (
          <div className="text-center">
            <h3 className="font-bold text-slate-800 mb-2">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">Enter your email to receive a recovery link.</p>
            <div className="bg-slate-50 flex items-center p-3 rounded-xl border border-slate-200 mb-4">
              <Mail size={16} className="text-slate-400 mr-3" />
              <input name="email" placeholder="name@email.com" className="bg-transparent text-sm outline-none flex-1" onChange={handleChange} />
            </div>
            <button onClick={handleSubmit} className="w-full bg-slate-800 text-white py-3 rounded-xl text-xs font-bold mb-3">Send Link</button>
            <button onClick={() => setMode('login')} className="text-xs text-slate-400 font-bold">Back to Login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div className="bg-slate-50 flex items-center p-3 rounded-xl border border-slate-200">
                  <User size={16} className="text-slate-400 mr-3" />
                  <input name="full_name" placeholder="Full Name" className="bg-transparent text-sm outline-none flex-1" onChange={handleChange} required />
                </div>
                <div className="bg-slate-50 flex items-center p-3 rounded-xl border border-slate-200">
                  <Phone size={16} className="text-slate-400 mr-3" />
                  <input name="phone" placeholder="Phone Number" className="bg-transparent text-sm outline-none flex-1" onChange={handleChange} />
                </div>
              </>
            )}

            <div className="bg-slate-50 flex items-center p-3 rounded-xl border border-slate-200">
              <Mail size={16} className="text-slate-400 mr-3" />
              <input name="email" type="email" placeholder="Email Address" className="bg-transparent text-sm outline-none flex-1" onChange={handleChange} required />
            </div>

            <div className="bg-slate-50 flex items-center p-3 rounded-xl border border-slate-200">
              <Lock size={16} className="text-slate-400 mr-3" />
              <input name="password" type="password" placeholder="Password" className="bg-transparent text-sm outline-none flex-1" onChange={handleChange} required />
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-bold text-blue-500 hover:underline">Forgot Password?</button>
              </div>
            )}

            {error && (
              <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded-lg flex items-center gap-2">
                <AlertCircle size={12} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
              {loading ? "Processing..." : (mode === 'login' ? <>Sign In <ArrowRight size={14} /></> : "Create Account")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginBubble;