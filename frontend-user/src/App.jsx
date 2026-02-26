import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import ChatPage from './pages/ChatPage';
import PharmacyApp from './pharmacy/PharmacyApp';
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

const App = () => {
  const [selectedPortal, setSelectedPortal] = useState(null);

  if (!selectedPortal) return <PortalSelector onSelect={setSelectedPortal} />;

  if (selectedPortal === 'chat') {
    return (
      <AuthProvider>
        <div className="relative">
          <button onClick={() => setSelectedPortal(null)} className="fixed top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors border border-white/10">
            ← Back to Portal
          </button>
          <ChatPage />
        </div>
      </AuthProvider>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setSelectedPortal(null)} className="fixed top-6 right-[calc(50%+380px)] z-[999] bg-slate-800/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors border border-white/10">
        ← Portal
      </button>
      <PharmacyApp />
    </div>
  );
};

export default App;