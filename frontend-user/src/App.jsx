import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatPage from './pages/ChatPage';
import PharmacyApp from './pharmacy/PharmacyApp';
import LoginBubble from './components/LoginBubble';
import { Pill, Stethoscope } from 'lucide-react';

const PortalSelector = ({ onSelect }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
    </div>
    <div className="relative z-10 text-center max-w-3xl w-full">
      <div className="mb-14">
        <h1 className="text-6xl font-black text-white tracking-tight mb-4">MediCare<span className="text-emerald-400">+</span></h1>
        <p className="text-slate-400 text-lg">Choose your portal to get started</p>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <button onClick={() => onSelect('chat')} className="group bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-400/30 rounded-[40px] p-10 text-left transition-all hover:scale-[1.02]">
          <div className="w-16 h-16 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-2xl flex items-center justify-center mb-6 transition-colors">
            <Stethoscope size={32} className="text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-2xl mb-2">Patient Portal</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Book appointments, consult doctors & AI health assistant</p>
        </button>
        <button onClick={() => onSelect('pharmacy')} className="group bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-400/30 rounded-[40px] p-10 text-left transition-all hover:scale-[1.02]">
          <div className="w-16 h-16 bg-emerald-500/20 group-hover:bg-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 transition-colors">
            <Pill size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-white font-bold text-2xl mb-2">Pharmacy Store</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Browse medicines, AI assistant & home delivery</p>
        </button>
      </div>
      <p className="text-slate-600 text-sm mt-12 font-medium">Powered by MediCare Enterprise Platform</p>
    </div>
  </div>
);

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState(null);

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">MediCare<span className="text-blue-400">+</span></h1>
            <p className="text-slate-400 text-sm">Sign in to access your portals</p>
          </div>
          <LoginBubble />
        </div>
      </div>
    );
  }

  // --- GLOBAL HEADER WITH LOGOUT STATUS ---
  const GlobalHeader = ({ className = "absolute top-4 right-4 z-[9999]" }) => (
    <div className={`${className} flex items-center gap-3`}>
      <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 shadow-xl px-4 py-2 rounded-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-tight">{user.name}</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-left">Patient</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 text-sm font-bold px-4 py-2 rounded-2xl transition-all shadow-lg"
      >
        Log Out
      </button>
    </div>
  );

  if (!selectedPortal) {
    return (
      <div className="relative">
        <GlobalHeader className="absolute top-4 right-4 z-[9999]" />
        <PortalSelector onSelect={setSelectedPortal} />
      </div>
    );
  }

  if (selectedPortal === 'chat') {
    return (
      <div className="relative">
        <GlobalHeader className="fixed top-4 right-4 sm:right-10 z-[9999]" />
        <button onClick={() => setSelectedPortal(null)} className="fixed top-4 left-4 sm:left-10 z-50 bg-slate-800/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors border border-white/10 shadow-xl">
          ← Back to Portal
        </button>
        <ChatPage onNavigatePortal={setSelectedPortal} />
      </div>
    );
  }

  return (
    <div className="relative">
      <GlobalHeader className="fixed top-4 right-4 sm:right-10 z-[9999]" />
      <button onClick={() => setSelectedPortal(null)} className="fixed top-4 left-4 sm:left-10 z-[9999] bg-slate-800/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors border border-white/10 shadow-xl">
        ← Back to Portal
      </button>
      <PharmacyApp />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;