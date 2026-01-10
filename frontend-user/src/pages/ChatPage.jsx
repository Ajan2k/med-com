import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Calendar, Pill, Activity, Stethoscope, FileText, Send, X, LogOut, ShieldCheck, Video, Clock, Check, Brain, ChevronRight, MapPin, Home, Building2 } from 'lucide-react';
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
        setMessages([{ role: 'bot', content: "Welcome to MediCare. Please sign in to access your health records.", type: 'login' }]);
      } else {
        setMessages([{ role: 'bot', content: `Hello ${user.name}. How can we help you today?`, type: 'menu' }]);
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
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Connectivity Issue. Please try again." }]);
    }
  };

  const loadStatus = async () => {
    setActiveFlow('status');
    if(user) {
        try {
            const apptRes = await patientAPI.getMyAppointments(user.id);
            const rxRes = await patientAPI.getMyPrescriptions(user.id);
            
            const combined = [
                ...apptRes.data.map(a => ({ ...a, category: 'appointment' })),
                ...rxRes.data.map(r => ({ ...r, category: 'medicine', id: r.id, time: r.created_at, status: r.status }))
            ];
            combined.sort((a,b) => new Date(b.time) - new Date(a.time));
            setMyAppts(combined);
        } catch(e) { console.error(e); }
    }
  };

  // --- FINAL FIX: CLEANER & OPENER ---
  const handleJoinClick = (rawLink) => {
    if (!rawLink) return;

    let url = rawLink.toString().trim();

    // 1. FIX: Remove Markdown formatting if present (e.g. [url](url)ID...)
    // This turns "[https://zoom.us/j/](https://zoom.us/j/)123..." into "https://zoom.us/j/123..."
    url = url.replace(/\[.*?\]\((.*?)\)/g, "$1");

    // 2. Remove any remaining markdown characters just in case
    url = url.replace(/[\[\]\(\)]/g, "");

    // 3. Force HTTPS if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
    }

    // 4. Open silently (No Alerts)
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
      } catch (e) { alert("Booking Failed"); }
  };

  const handleHealthQuery = () => {
      setActiveFlow(null);
      setMessages(prev => [...prev, { role: 'bot', content: "I am ready. Please describe your symptoms...", type: 'text' }]);
  };

  const renderMenuButtons = () => (
    <div className="grid grid-cols-2 gap-3 mt-4 w-full px-1">
      <LiquidButton icon={Calendar} label="Book Visit" onClick={() => setActiveFlow('booking')} />
      <LiquidButton icon={Pill} label="Pharmacy" onClick={() => setActiveFlow('medicine')} />
      <LiquidButton icon={Activity} label="Lab Tests" onClick={() => { setLabStep('list'); setActiveFlow('lab'); }} />
      <LiquidButton icon={FileText} label="My Status" onClick={loadStatus} />
      <LiquidButton icon={Stethoscope} label="Message Dr." onClick={() => { setMsgStep('compose'); setActiveFlow('consult'); }} />
      <LiquidButton icon={Brain} label="Health Query" onClick={handleHealthQuery} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans antialiased text-slate-800">
      <div className="w-[380px] h-[650px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white flex flex-col relative ring-8 ring-slate-100/50">
        
        {/* HEADER */}
        <div className="bg-white/90 backdrop-blur-md px-5 py-4 flex justify-between items-center z-20 border-b border-slate-50 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="font-bold text-[15px] text-slate-900 tracking-tight">MediCare</h1>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">AI Assistant</p>
                </div>
            </div>
          </div>
          {user && (
            <button onClick={logout} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                <LogOut size={16} />
            </button>
          )}
        </div>

        {/* CHAT STREAM */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {msg.content && (
                  <div className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed shadow-sm relative ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-[20px] rounded-tr-sm shadow-blue-100' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-[20px] rounded-tl-sm'
                  }`}>
                    <ReactMarkdown components={{
                        strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                        p: ({node, ...props}) => <span className="block mb-1 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />
                    }}>{msg.content}</ReactMarkdown>
                  </div>
              )}
              {msg.type === 'login' && <div className="mt-2 w-full"><LoginBubble onLoginSuccess={() => console.log("Auth Success")} /></div>}
              {msg.type === 'menu' && renderMenuButtons()}
              {msg.type === 'action_book' && (
                  <button onClick={() => setActiveFlow('booking')} className="mt-2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">Book Appointment <ChevronRight size={14}/></button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        {user && !activeFlow && (
          <div className="p-4 bg-white border-t border-slate-50 flex gap-2 items-center">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-[13px] placeholder:text-slate-400 font-medium" placeholder="Type your message..." />
            <button onClick={handleSendMessage} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 shadow-lg active:scale-95 transition-transform"><Send size={18} /></button>
          </div>
        )}

        {/* OVERLAYS */}
        <AnimatePresence>
            {activeFlow && (
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute inset-0 z-30 bg-white flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h2 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                            {activeFlow === 'booking' && 'New Appointment'}
                            {activeFlow === 'medicine' && 'Pharmacy Order'}
                            {activeFlow === 'lab' && 'Lab Tests'}
                            {activeFlow === 'status' && 'My Status'}
                            {activeFlow === 'consult' && 'Consultation'}
                        </h2>
                        <button onClick={() => setActiveFlow(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={18}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 pb-20">
                        {activeFlow === 'booking' && <BookingFlow onBack={() => setActiveFlow(null)} />}
                        {activeFlow === 'medicine' && <MedicineFlow onBack={() => setActiveFlow(null)} />}
                        
                        {/* LAB FLOW */}
                        {activeFlow === 'lab' && labStep === 'list' && (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Test</p>
                                {[
                                    { name: "Full Body Checkup", price: "$50", time: "24 hrs" },
                                    { name: "Blood Sugar (Fasting)", price: "$15", time: "6 hrs" },
                                    { name: "Thyroid Profile", price: "$25", time: "12 hrs" }
                                ].map((test, i) => (
                                    <button key={i} onClick={() => handleTestSelect(test)} className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-400 transition-all group text-left">
                                        <div><h4 className="font-bold text-slate-700 text-[13px] group-hover:text-blue-600">{test.name}</h4><p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10}/> Report in {test.time}</p></div>
                                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">{test.price}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeFlow === 'lab' && labStep === 'mode' && (
                            <div className="space-y-4 pt-4">
                                <h3 className="text-center font-bold text-slate-800 text-lg">Choose Collection Method</h3>
                                <p className="text-center text-slate-500 text-xs px-6">How would you like to provide your sample for {selectedTest?.name}?</p>
                                
                                <button onClick={() => confirmLabBooking('Home Collection')} className="w-full bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-500 transition-all text-left flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Home size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Home Collection</h4>
                                        <p className="text-xs text-slate-500 mt-1">Technician visits your home.</p>
                                        <span className="inline-block mt-2 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded">Safe & Contactless</span>
                                    </div>
                                </button>

                                <button onClick={() => confirmLabBooking('Lab Visit')} className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-500 transition-all text-left flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><Building2 size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Visit Lab Center</h4>
                                        <p className="text-xs text-slate-500 mt-1">Walk-in to nearest center.</p>
                                        <p className="text-[10px] text-slate-400 mt-2">Open: 8:00 AM - 8:00 PM</p>
                                    </div>
                                </button>
                                
                                <button onClick={() => setLabStep('list')} className="w-full text-slate-400 text-xs font-bold py-4">Go Back</button>
                            </div>
                        )}

                        {activeFlow === 'lab' && labStep === 'success' && (
                            <div className="text-center pt-16 px-6">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-sm"><Activity size={40}/></motion.div>
                                <h3 className="text-xl font-bold text-slate-800">Booking Confirmed</h3>
                                <div className="bg-slate-50 p-4 rounded-xl text-left mt-6 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Instructions</p>
                                    <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                                        <li>Please fast for 8-10 hours before the test.</li>
                                        <li>Drink only water if needed.</li>
                                        <li>Carry a valid ID proof.</li>
                                    </ul>
                                </div>
                                <button onClick={() => setActiveFlow(null)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-xs mt-8 w-full shadow-lg">Done</button>
                            </div>
                        )}

                        {/* STATUS FLOW */}
                        {activeFlow === 'status' && (
                            <div className="space-y-4">
                                {myAppts.length === 0 ? <div className="text-center py-20 text-slate-400 text-sm">No active history.</div> : myAppts.map(item => {
                                    
                                    // --- APPOINTMENT CARD ---
                                    if (item.category === 'appointment') {
                                        const docNameDisplay = item.doctor_name.startsWith('Dr.') ? item.doctor_name : `Dr. ${item.doctor_name}`;

                                        return (
                                            <div key={`appt-${item.id}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-md transition-all">
                                            <div className={`h-1.5 w-full ${item.type === 'lab_test' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                            <div className="p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-[10px] font-mono text-slate-400">#{item.id.toString().padStart(4, '0')}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{item.status}</span>
                                                    </div>
                                                    <div className="flex gap-3 mb-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${item.type === 'lab_test' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {item.type === 'lab_test' ? <Activity size={20}/> : <Stethoscope size={20}/>}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 text-[14px]">{item.type === 'lab_test' ? 'Lab Test' : docNameDisplay}</h3>
                                                            <p className="text-[11px] text-slate-500">{item.type === 'lab_test' ? 'Pathology' : 'Consultation'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center mb-3 border border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-slate-400"/>
                                                            <div><p className="text-[10px] text-slate-400 uppercase font-bold">Date</p><p className="text-[12px] font-semibold text-slate-700">{new Date(item.time).toLocaleDateString()}</p></div>
                                                        </div>
                                                        <div className="h-6 w-[1px] bg-slate-200"></div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-slate-400"/>
                                                            <div><p className="text-[10px] text-slate-400 uppercase font-bold">Time</p><p className="text-[12px] font-semibold text-slate-700">{new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                                                        </div>
                                                    </div>
                                                    
                                                    {item.zoom_link ? (
                                                        <button 
                                                            onClick={() => handleJoinClick(item.zoom_link)}
                                                            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all cursor-pointer"
                                                        >
                                                            <Video size={14}/> Join Video Call
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-500 py-2.5 rounded-xl text-xs font-bold"><MapPin size={14}/> {item.type === 'lab_test' ? 'Visit / Collection' : 'Clinic Visit'}</div>
                                                    )}
                                            </div>
                                            </div>
                                        );
                                    }
                                    
                                    // --- PHARMACY CARD ---
                                    if (item.category === 'medicine') {
                                        return (
                                            <div key={`rx-${item.id}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-md transition-all">
                                            <div className="h-1.5 w-full bg-emerald-500"></div>
                                            <div className="p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-[10px] font-mono text-slate-400">ORDER #{item.id}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-50 text-yellow-600">{item.status}</span>
                                                    </div>
                                                    <div className="flex gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                                            <Pill size={20}/>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 text-[14px]">Pharmacy Order</h3>
                                                            <p className="text-[11px] text-slate-500">Prescription Uploaded</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-2">
                                                        <p className="text-[10px] font-mono text-slate-500 truncate">{item.extracted_data || "Processing image..."}</p>
                                                    </div>
                                                    <div className="w-full bg-slate-100 text-slate-500 py-2.5 rounded-xl text-xs font-bold text-center">
                                                        {item.status === 'ready' ? 'Ready for Pickup' : 'Processing Order'}
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
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">Specialist</label><select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[13px] outline-none"><option>Dr. Sarah Smith (General)</option><option>Dr. James Bond (Cardio)</option></select></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">Message</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[13px] outline-none h-32 resize-none" placeholder="Type query..."></textarea></div>
                                <button onClick={() => setMsgStep('sent')} className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold text-xs shadow-md">Send</button>
                            </div>
                        )}
                        {activeFlow === 'consult' && msgStep === 'sent' && (
                            <div className="text-center pt-20">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><Check size={28}/></motion.div>
                                <h3 className="text-lg font-bold text-slate-800">Sent</h3>
                                <button onClick={() => setActiveFlow(null)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs mt-6">Close</button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPage;