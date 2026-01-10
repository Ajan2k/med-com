import { useState } from 'react';
import { adminAPI } from '../services/adminApi';
import { ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = ({ onLogin }) => {
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
        onLogin();
      } else {
        alert("Access Denied: Not authorized staff.");
      }
    } catch (e) { 
        console.error(e);
        alert("Login Failed: Check credentials."); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-blue-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">MediCare Admin</h2>
            <p className="text-blue-100 text-sm mt-1">Authorized Personnel Only</p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Staff Email</label>
                    <input 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-slate-700 mt-1" 
                        placeholder="doctor@hospital.com" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)}
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
                            onChange={e=>setPassword(e.target.value)}
                        />
                        <Lock size={18} className="absolute right-4 top-5 text-slate-400"/>
                    </div>
                </div>
                <button disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    {loading ? "Authenticating..." : <>Secure Login <ChevronRight size={18}/></>}
                </button>
            </form>
            <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">Protected by HIPAA Compliance Standards</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;