import { useState } from 'react';
import { adminAPI } from '../services/adminApi';
import { ShieldCheck, Lock, ChevronRight, Activity, Pill, User, ArrowLeft } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const AdminLogin = ({ portal, onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminAPI.login(email, password);

      // --- FIX: Added 'lab' to this list ---
      if (['doctor', 'admin', 'pharmacist', 'lab'].includes(data.role)) {
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_role', data.role);
        localStorage.setItem('admin_name', data.user_name);
        localStorage.setItem('admin_id', data.id); // Add user ID for filtering
        onLogin();
      } else {
        alert("Access Denied: Not authorized staff.");
      }
    } catch (error) {
      console.error(error);
      alert("Login Failed: Check credentials.");
    }
    setLoading(false);
  };

  const getUIConfig = () => {
    switch (portal) {
      case 'doctor': return { title: "Doctor Portal", subtitle: "Manage your appointments & consults", icon: <User size={32} />, color: "bg-indigo-600" };
      case 'lab': return { title: "Lab Portal", subtitle: "Process laboratory reports", icon: <Activity size={32} />, color: "bg-purple-600" };
      case 'pharmacist': return { title: "Pharmacy Portal", subtitle: "Fulfill orders & manage inventory", icon: <Pill size={32} />, color: "bg-emerald-600" };
      default: return { title: "MediCare Admin", subtitle: "Authorized Personnel Only", icon: <ShieldCheck size={32} />, color: "bg-blue-600" };
    }
  };
  const ui = getUIConfig();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <Motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10">
          <ArrowLeft size={16} />
        </button>

        <div className={`${ui.color} p-8 text-center pt-12`}>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
            {ui.icon}
          </div>
          <h2 className="text-2xl font-bold text-white">{ui.title}</h2>
          <p className="text-white/80 text-sm mt-1">{ui.subtitle}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Staff Email</label>
              <input
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-slate-700 mt-1"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <input
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-slate-700 mt-1"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Lock size={18} className="absolute right-4 top-5 text-slate-400" />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              {loading ? "Authenticating..." : <>Secure Login <ChevronRight size={18} /></>}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">Protected by HIPAA Compliance Standards</p>
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default AdminLogin;