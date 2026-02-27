import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Calendar, Pill, Activity, Stethoscope,
    FileText, Send, X, LogOut, ShieldCheck, Video,
    Clock, Check, Brain, ChevronRight, MapPin,
    Home, Building2, Search, Settings, User, Bell
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { patientAPI } from '../services/api';

// Components
import LoginBubble from '../components/LoginBubble';
import LiquidButton from '../components/LiquidButton';
import BookingFlow from '../features/BookingFlow';
import MedicineFlow from '../features/MedicineFlow';

const ChatPage = () => {
    const { user, loading, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const [activeFlow, setActiveFlow] = useState(null);
    const [myAppts, setMyAppts] = useState([]);
    const messagesEndRef = useRef(null);

    const [labStep, setLabStep] = useState('list');
    const [selectedTest, setSelectedTest] = useState(null);
    const [msgStep, setMsgStep] = useState('compose');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setMessages([{ role: 'bot', content: "Welcome to MediCare. Please sign in to access your health records.", type: 'login' }]);
            } else {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setMessages([{ role: 'bot', content: `Hello ${user.name}. I am your dedicated AI Health Assistant. How can I help you today?`, type: 'menu' }]);
            }
        }
    }, [user, loading]);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, activeFlow]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const newMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        const lowerInput = input.toLowerCase();
        if (lowerInput.includes("menu") || lowerInput.includes("option") || lowerInput.includes("help")) {
            setTimeout(() => setMessages(prev => [...prev, { role: 'bot', content: "Here are your options:", type: 'menu' }]), 500);
            return;
        }

        try {
            const { data } = await patientAPI.chat(input, messages);
            setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
            if (data.recommend_action === 'book_appointment') {
                setTimeout(() => setMessages(prev => [...prev, { role: 'bot', content: "Would you like to schedule that now?", type: 'action_book' }]), 800);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'bot', content: "Connectivity Issue. Please try again." }]);
        }
    };

    const loadStatus = async () => {
        setActiveFlow('status');
        if (user) {
            try {
                const apptRes = await patientAPI.getMyAppointments(user.id);
                const rxRes = await patientAPI.getMyPrescriptions(user.id);

                const combined = [
                    ...apptRes.data.map(a => ({ ...a, category: 'appointment' })),
                    ...rxRes.data.map(r => ({ ...r, category: 'medicine', id: r.id, time: r.created_at, status: r.status }))
                ];
                combined.sort((a, b) => new Date(b.time) - new Date(a.time));
                setMyAppts(combined);
            } catch (e) { console.error(e); }
        }
    };

    const handleJoinClick = (rawLink) => {
        if (!rawLink) return;
        let url = rawLink.toString().trim().replace(/\[.*?\]\((.*?)\)/g, "$1").replace(/[[\]()]/g, "");
        if (!url.startsWith('http')) url = `https://${url}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleTestSelect = (test) => {
        setSelectedTest(test);
        setLabStep('mode');
    }

    const confirmLabBooking = async (mode) => {
        try {
            const finalName = `${selectedTest.name} (${mode})`;
            await patientAPI.bookLab({ patient_id: user.id, test_name: finalName });
            setLabStep('success');
        } catch { alert("Booking Failed"); }
    };

    const handleHealthQuery = () => {
        setActiveFlow(null);
        setMessages(prev => [...prev, { role: 'bot', content: "I am ready. Please describe your symptoms or ask a health question...", type: 'text' }]);
    };

    const renderMenuButtons = () => (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full">
            <LiquidButton icon={Calendar} label="Book Appointment" onClick={() => setActiveFlow('booking')} />
            <LiquidButton icon={Pill} label="Order Medicine" onClick={() => setActiveFlow('medicine')} />
            <LiquidButton icon={Activity} label="Lab Tests" onClick={() => { setLabStep('list'); setActiveFlow('lab'); }} />
            <LiquidButton icon={FileText} label="Health Records" onClick={loadStatus} />
            <LiquidButton icon={Stethoscope} label="Contact Doctor" onClick={() => { setMsgStep('compose'); setActiveFlow('consult'); }} />
            <LiquidButton icon={Brain} label="AI Diagnostics" onClick={handleHealthQuery} />
        </div>
    );

    return (
        <div className="h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800 overflow-hidden">

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:flex w-80 bg-white border-r border-slate-100 flex-col shrink-0">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShieldCheck size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-slate-900 tracking-tight">MediCare<span className="text-blue-600">+</span></h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Health</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button onClick={() => setActiveFlow(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!activeFlow ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <MessageSquare size={20} /> <span className="font-bold text-sm">AI Console</span>
                        </button>
                        <button onClick={() => setActiveFlow('booking')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFlow === 'booking' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Calendar size={20} /> <span className="font-bold text-sm">Appointments</span>
                        </button>
                        <button onClick={() => setActiveFlow('medicine')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFlow === 'medicine' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Pill size={20} /> <span className="font-bold text-sm">Pharmacy</span>
                        </button>
                        <button onClick={loadStatus} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFlow === 'status' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <FileText size={20} /> <span className="font-bold text-sm">My Records</span>
                        </button>
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-slate-50">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm ring-1 ring-slate-100 uppercase">
                                    {user.name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{user.name.split(' ')[0]}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Patient Account</p>
                                </div>
                            </div>
                            <button onClick={logout} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center">Signin to access profile</p>
                    )}
                </div>
            </aside>

            {/* MAIN CHAT INTERFACE */}
            <main className="flex-1 flex flex-col relative bg-[#F8FAFC]">

                {/* TOP BAR */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-900 text-lg">AI Health Assistant</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Neural Core Active</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex relative w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input type="text" placeholder="Search records, doctors..." className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
                        </div>
                        <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Bell size={20} /></button>
                            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Settings size={20} /></button>
                        </div>
                    </div>
                </header>

                {/* CHAT CONTENT */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 scroll-smooth scrollbar-hide">
                    <div className="max-w-4xl mx-auto w-full space-y-8 pb-10">
                        {messages.map((msg, i) => (
                            <Motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={i}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 mt-1 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-blue-600'
                                    }`}>
                                    {msg.role === 'user' ? <User size={20} /> : <Brain size={20} />}
                                </div>
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    {msg.content && (
                                        <div className={`px-6 py-4 text-[15px] leading-relaxed shadow-sm relative ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-[24px] rounded-tr-sm'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-[24px] rounded-tl-sm'
                                            }`}>
                                            <ReactMarkdown components={{
                                                strong: ({ ...props }) => <span className="font-bold" {...props} />,
                                                p: ({ ...props }) => <span className="block mb-1 last:mb-0" {...props} />,
                                                ul: ({ ...props }) => <ul className="list-disc ml-6 space-y-2 mt-2" {...props} />,
                                                li: ({ ...props }) => <li className="pl-1" {...props} />
                                            }}>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                    {msg.type === 'login' && <div className="mt-4 w-full max-w-sm"><LoginBubble /></div>}
                                    {msg.type === 'menu' && renderMenuButtons()}
                                    {msg.type === 'action_book' && (
                                        <button onClick={() => setActiveFlow('booking')} className="mt-4 bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-3 active:scale-95">
                                            Schedule Appointment <ChevronRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </Motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* INPUT PANEL */}
                <div className="p-10 shrink-0 z-10">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[32px] blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
                        <div className="relative bg-white border border-slate-200 rounded-[30px] shadow-lg flex items-center gap-4 px-6 py-4 transition-all focus-within:border-blue-300">
                            <div className="flex items-center gap-3 text-slate-300">
                                <Activity size={20} className="hover:text-blue-500 cursor-pointer transition-colors" />
                                <div className="w-[1px] h-6 bg-slate-100"></div>
                            </div>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1 bg-transparent text-slate-800 text-[16px] font-medium outline-none placeholder:text-slate-400"
                                placeholder="Describe your health concern or ask a medical question..."
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-600 text-white p-4 rounded-[22px] hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                            >
                                <Send size={22} />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6 opacity-60">MediCare AI is a supportive tool and does not replace professional medical advice.</p>
                </div>

                {/* FULLSCREEN OVERLAYS (Integrated as Panes) */}
                <AnimatePresence>
                    {activeFlow && (
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="absolute inset-0 z-40 bg-[#F8FAFC] flex flex-col">
                            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveFlow(null)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100">
                                        <X size={20} />
                                    </button>
                                    <h2 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">
                                        {activeFlow === 'booking' && 'Appointment Scheduler'}
                                        {activeFlow === 'medicine' && 'Pharmacy Hub'}
                                        {activeFlow === 'lab' && 'Diagnostic Lab'}
                                        {activeFlow === 'status' && 'Patient Dashboard'}
                                        {activeFlow === 'consult' && 'Physician Connect'}
                                    </h2>
                                </div>
                            </header>

                            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
                                <div className="max-w-5xl mx-auto">
                                    {activeFlow === 'booking' && <BookingFlow onBack={() => setActiveFlow(null)} />}
                                    {activeFlow === 'medicine' && <MedicineFlow onBack={() => setActiveFlow(null)} />}

                                    {/* LAB FLOW */}
                                    {activeFlow === 'lab' && labStep === 'list' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[
                                                { name: "Full Body Checkup", price: "$50", time: "24 hrs", desc: "Comprehensive screening for all major organs." },
                                                { name: "Blood Sugar (Fasting)", price: "$15", time: "6 hrs", desc: "Essential for diabetes monitoring." },
                                                { name: "Thyroid Profile", price: "$25", time: "12 hrs", desc: "T3, T4, and TSH level analysis." }
                                            ].map((test, i) => (
                                                <button key={i} onClick={() => handleTestSelect(test)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Activity size={24} /></div>
                                                    <h4 className="font-extrabold text-slate-900 text-lg">{test.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{test.desc}</p>
                                                    <div className="flex items-center justify-between mt-6">
                                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase"><Clock size={14} /> {test.time}</div>
                                                        <span className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm shadow-md shadow-blue-100">{test.price}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {activeFlow === 'lab' && labStep === 'mode' && (
                                        <div className="max-w-2xl mx-auto py-10">
                                            <h3 className="text-3xl font-black text-slate-900 mb-4 text-center">Collection Mode</h3>
                                            <p className="text-slate-500 text-center mb-10">Select how you'd like to provide your sample for **{selectedTest?.name}**.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <button onClick={() => confirmLabBooking('Home Collection')} className="bg-white p-8 rounded-[32px] border-2 border-slate-50 hover:border-blue-500 shadow-sm hover:shadow-2xl transition-all text-left group">
                                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Home size={32} /></div>
                                                    <h4 className="font-bold text-xl text-slate-900">Home Collection</h4>
                                                    <p className="text-sm text-slate-500 mt-3">Technician visits your home address at your convenience.</p>
                                                    <span className="inline-block mt-4 text-[10px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-full uppercase tracking-wider">Premium Service</span>
                                                </button>

                                                <button onClick={() => confirmLabBooking('Lab Visit')} className="bg-white p-8 rounded-[32px] border-2 border-slate-50 hover:border-blue-500 shadow-sm hover:shadow-2xl transition-all text-left group">
                                                    <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6"><Building2 size={32} /></div>
                                                    <h4 className="font-bold text-xl text-slate-900">Hospital Walk-In</h4>
                                                    <p className="text-sm text-slate-500 mt-3">Visit our nearest diagnostic center directly.</p>
                                                    <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-tighter italic">Open: 8:00 AM - 8:00 PM</p>
                                                </button>
                                            </div>
                                            <button onClick={() => setLabStep('list')} className="w-full text-slate-400 text-sm font-bold mt-10 hover:text-slate-900 transition-colors uppercase tracking-widest">← Change Test Selection</button>
                                        </div>
                                    )}

                                    {activeFlow === 'lab' && labStep === 'success' && (
                                        <div className="text-center py-20 max-w-lg mx-auto">
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-2xl shadow-green-200"><Check size={48} strokeWidth={3} /></motion.div>
                                            <h3 className="text-4xl font-black text-slate-900 mb-4">Request Received</h3>
                                            <p className="text-slate-500 mb-10">We've confirmed your booking. A detailed set of instructions has been sent to your email.</p>
                                            <button onClick={() => setActiveFlow(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-600 transition-all active:scale-95 w-full uppercase tracking-widest">Back to Health Console</button>
                                        </div>
                                    )}

                                    {activeFlow === 'status' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {myAppts.length === 0 ? <div className="col-span-full text-center py-40 text-slate-400 font-bold text-lg opacity-30">No active history found in vault.</div> : myAppts.map(item => {
                                                if (item.category === 'appointment') {
                                                    const docNameDisplay = item.doctor_name.startsWith('Dr.') ? item.doctor_name : `Dr. ${item.doctor_name}`;
                                                    return (
                                                        <div key={`appt-${item.id}`} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 transition-all">
                                                            <div className={`h-1.5 w-full ${item.type === 'lab_test' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                            <div className="p-8">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <span className="text-xs font-mono font-bold text-slate-300">REF_{item.id.toString().padStart(4, '0')}</span>
                                                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{item.status}</span>
                                                                </div>
                                                                <div className="flex gap-4 mb-6">
                                                                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-white shadow-md ${item.type === 'lab_test' ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'}`}>
                                                                        {item.type === 'lab_test' ? <Activity size={28} /> : <Stethoscope size={28} />}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-black text-slate-900 text-xl">{item.type === 'lab_test' ? 'Diagnostic Test' : docNameDisplay}</h3>
                                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type === 'lab_test' ? 'Genomic Wing' : 'Consultation'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 mb-8">
                                                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Date</p>
                                                                        <p className="text-sm font-black text-slate-800">{new Date(item.time).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Time</p>
                                                                        <p className="text-sm font-black text-slate-800">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                    </div>
                                                                </div>

                                                                {item.zoom_link ? (
                                                                    <button onClick={() => handleJoinClick(item.zoom_link)} className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                                                        <Video size={18} /> Start Cloud Consult
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-500 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest opacity-60"><MapPin size={16} /> Hospital Visit</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                if (item.category === 'medicine') {
                                                    return (
                                                        <div key={`rx-${item.id}`} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 transition-all">
                                                            <div className="h-1.5 w-full bg-emerald-500"></div>
                                                            <div className="p-8">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <span className="text-xs font-mono font-bold text-slate-300">ORD_RX_{item.id}</span>
                                                                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">{item.status}</span>
                                                                </div>
                                                                <div className="flex gap-4 mb-6">
                                                                    <div className="w-14 h-14 rounded-[20px] bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                                                                        <Pill size={28} />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-black text-slate-900 text-xl">Pharmacy Order</h3>
                                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">MediMart Express</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-8 max-h-24 overflow-hidden italic text-slate-500 text-xs text-center flex items-center justify-center">
                                                                    <p className="line-clamp-3">{item.extracted_data || "Awaiting neural analysis of prescription image..."}</p>
                                                                </div>
                                                                <div className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase text-center tracking-widest shadow-xl">
                                                                    {item.status === 'ready' ? '🚚 Out for Delivery' : '⚙️ Processing Order'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    )}

                                    {activeFlow === 'consult' && msgStep === 'compose' && (
                                        <div className="max-w-2xl mx-auto py-10">
                                            <h3 className="text-3xl font-black text-slate-900 mb-8">Physician Messaging</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Select Department</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button className="p-4 bg-white border-2 border-blue-500 rounded-2xl font-bold text-blue-600 text-left">Internal Medicine</button>
                                                        <button className="p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-400 text-left hover:border-blue-200">Cardiology</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Your Query</label>
                                                    <textarea className="w-full p-6 bg-white border border-slate-200 rounded-[28px] text-[15px] outline-none h-48 resize-none shadow-sm focus:border-blue-500 transition-all font-medium" placeholder="Explain your symptoms or request a follow-up..."></textarea>
                                                </div>
                                                <button onClick={() => setMsgStep('sent')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] uppercase tracking-widest mt-4">Send Secure Message</button>
                                            </div>
                                        </div>
                                    )}

                                    {activeFlow === 'consult' && msgStep === 'sent' && (
                                        <div className="text-center py-20 max-w-lg mx-auto">
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-2xl shadow-blue-200"><Check size={48} strokeWidth={3} /></motion.div>
                                            <h3 className="text-4xl font-black text-slate-900 mb-4">Message Dispatched</h3>
                                            <p className="text-slate-500 mb-10">Your query has been sent securely via mTLS. A physician will review and respond within 4-6 business hours.</p>
                                            <button onClick={() => setActiveFlow(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-600 transition-all active:scale-95 w-full uppercase tracking-widest">Done</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default ChatPage;