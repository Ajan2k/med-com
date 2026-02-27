import { useState, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon, CreditCard, Video, MapPin, CheckCircle,
    ArrowLeft, Stethoscope, Activity, Brain, Heart, ChevronRight,
    ChevronLeft, Star, Clock, Info, ShieldCheck
} from 'lucide-react';
import { patientAPI } from '../services/api';

const DEPARTMENTS = [
    { id: 'General', name: 'General Practice', icon: Stethoscope, color: 'bg-blue-100 text-blue-600', desc: 'Primary care & general health checkups' },
    { id: 'Cardiology', name: 'Cardiology', icon: Heart, color: 'bg-red-100 text-red-600', desc: 'Heart health & cardiovascular care' },
    { id: 'Neurology', name: 'Neurology', icon: Brain, color: 'bg-purple-100 text-purple-600', desc: 'Brain, spine & nervous system' },
    { id: 'Orthopedics', name: 'Orthopedics', icon: Activity, color: 'bg-orange-100 text-orange-600', desc: 'Bone, joint & muscle specialist' },
];

const BookingFlow = ({ onBack, initialDoctor }) => {
    const [step, setStep] = useState(initialDoctor ? 1 : 0);
    const [selectedDept, setSelectedDept] = useState(initialDoctor ? initialDoctor.department : null);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(initialDoctor || null);

    // Initial date should be local today
    const getLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getLocalDate(new Date()));
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [apptType, setApptType] = useState('online');
    const [loading, setLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Calendar Helper Stats
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Fetch Doctors
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const { data } = await patientAPI.getDoctors();
                setDoctors(data);
            } catch (e) { console.error(e); }
        };
        fetchDocs();
    }, []);

    // Load Slots when Doc or Date changes
    useEffect(() => {
        if (selectedDoc && date) {
            const fetchSlots = async () => {
                setLoading(true);
                try {
                    const { data } = await patientAPI.getSlots(selectedDoc.id, date);
                    setSlots(data.slots);
                    setSelectedSlot(null); // Reset slot on date change
                } catch (e) { console.error(e); }
                setLoading(false);
            };
            fetchSlots();
        }
    }, [selectedDoc, date]);

    const filteredDocs = useMemo(() => {
        return doctors.filter(d => d.department === selectedDept);
    }, [doctors, selectedDept]);

    const handleBooking = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const payload = {
                patient_id: Number(user.id),
                doctor_id: Number(selectedDoc.id),
                date_str: date,
                time_slot: selectedSlot,
                type: apptType
            };
            await patientAPI.bookAppointment(payload);
            setBookingSuccess(true);
            setStep(3);
        } catch (error) {
            alert("Booking Failed: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Calendar Render Helper
    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const calendarDays = useMemo(() => {
        const days = [];
        const numDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);

        // Padding for previous month
        for (let i = 0; i < startDay; i++) days.push({ day: '', disabled: true });

        // Current month days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= numDays; i++) {
            const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            days.push({
                day: i,
                dateStr: getLocalDate(d),
                disabled: d < today
            });
        }
        return days;
    }, [currentMonth]);

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + offset)));
    };

    if (bookingSuccess) {
        return (
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-200 mb-8 animate-bounce">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-4">Consultation Booked!</h2>
                <p className="text-slate-500 max-w-md mb-10 leading-relaxed">
                    Great news! Your session with **{selectedDoc?.full_name}** is confirmed for **{new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} at {selectedSlot}**.
                </p>
                <div className="flex gap-4">
                    <button onClick={onBack} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all">Go to Health Dashboard</button>
                </div>
            </Motion.div>
        );
    }

    return (
        <div className="flex flex-col min-h-[600px]">

            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-6 mb-8">
                <button onClick={() => step === 0 ? onBack() : setStep(step - 1)} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {step === 0 && "Choose a Specialist"}
                        {step === 1 && "Book Your Session"}
                        {step === 2 && "Confirm & Secure"}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${step >= 0 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                        <span className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                        <span className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Step {step + 1} of 3</p>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <AnimatePresence mode="wait">

                    {/* STEP 0: Department Selection */}
                    {step === 0 && (
                        <Motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {DEPARTMENTS.map((dept) => (
                                <button
                                    key={dept.id}
                                    onClick={() => {
                                        setSelectedDept(dept.id);
                                        setSelectedDoc(null); // RESET DOCTOR ON DEPT CHANGE
                                        setStep(1);
                                    }}
                                    className="group bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-1 transition-all text-left flex items-start gap-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-50 transition-colors"></div>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${dept.color} group-hover:scale-110 transition-transform`}>
                                        <dept.icon size={32} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{dept.name}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">{dept.desc}</p>
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                                            View Specialists <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </Motion.div>
                    )}

                    {/* STEP 1: Integrated Doctor & Calendar View */}
                    {step === 1 && (
                        <Motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Doctor Selection Column */}
                            <div className="lg:col-span-4 space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Available Professionals</h4>
                                {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className={`w-full p-5 rounded-3xl border transition-all text-left flex items-center gap-4 ${selectedDoc?.id === doc.id ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200 text-white' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600 shadow-sm'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl uppercase ${selectedDoc?.id === doc.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                                            {doc.full_name[0]}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black uppercase tracking-tight ${selectedDoc?.id === doc.id ? 'text-blue-100' : 'text-slate-400'}`}>{doc.department}</p>
                                            <h3 className="font-extrabold text-lg leading-tight">Dr. {doc.full_name.replace('Dr. ', '')}</h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star size={12} fill="currentColor" className={selectedDoc?.id === doc.id ? 'text-white' : 'text-amber-400'} />
                                                <span className="text-[10px] font-bold">4.9 (120 Reviews)</span>
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="bg-slate-100 rounded-3xl p-10 text-center">
                                        <Info size={32} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-400 font-bold text-sm">No specialists currently active in this wing.</p>
                                    </div>
                                )}
                            </div>

                            {/* Calendar & Slot Picker Column */}
                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 h-full">
                                    {!selectedDoc ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                            <CalendarIcon size={64} className="text-slate-200 mb-6" />
                                            <p className="text-lg font-black text-slate-400 uppercase tracking-widest">Select a Specialist to view schedule</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* Custom Visual Calendar */}
                                            <div>
                                                <div className="flex items-center justify-between mb-8 px-2">
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => changeMonth(-1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"><ChevronLeft size={18} /></button>
                                                        <button onClick={() => changeMonth(1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"><ChevronRight size={18} /></button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">{d}</div>)}
                                                    {calendarDays.map((d, i) => (
                                                        <button
                                                            key={i}
                                                            disabled={d.disabled || !d.day}
                                                            onClick={() => setDate(d.dateStr)}
                                                            className={`
                                                                aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all relative
                                                                ${!d.day ? 'opacity-0 cursor-default' : ''}
                                                                ${d.disabled ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'}
                                                                ${date === d.dateStr ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-600 hover:text-white' : ''}
                                                            `}
                                                        >
                                                            {d.day}
                                                            {date === d.dateStr && <Motion.div layoutId="cal-dot" className="w-1 h-1 bg-white rounded-full mt-0.5" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Slot Picker */}
                                            <div>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Clock size={18} className="text-blue-600" />
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Select Time Slot</h4>
                                                </div>
                                                {loading ? (
                                                    <div className="grid grid-cols-4 gap-3 animate-pulse">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-12 bg-slate-50 rounded-2xl"></div>)}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                        {slots.length > 0 ? slots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={`
                                                                    py-3 rounded-2xl text-xs font-bold transition-all border
                                                                    ${selectedSlot === slot ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-300 hover:text-blue-600'}
                                                                `}
                                                            >
                                                                {slot}
                                                            </button>
                                                        )) : (
                                                            <div className="col-span-full py-8 text-center bg-red-50 rounded-3xl border border-red-100 border-dashed">
                                                                <p className="text-red-500 font-bold text-xs uppercase tracking-widest">No availability for this date</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                disabled={!selectedSlot}
                                                onClick={() => setStep(2)}
                                                className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.01] transition-all disabled:opacity-30 disabled:hover:scale-100 uppercase tracking-widest"
                                            >
                                                Proceed to Checkout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Motion.div>
                    )}

                    {/* STEP 2: Payment & Finalize */}
                    {step === 2 && (
                        <Motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-8">
                                <div className="p-10 border-b border-slate-50">
                                    <h3 className="text-xl font-black text-slate-900 mb-6">Consultation Overview</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setApptType('online')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${apptType === 'online' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${apptType === 'online' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <Video size={24} />
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${apptType === 'online' ? 'text-blue-600' : 'text-slate-400'}`}>Video Consult</span>
                                            <span className="text-lg font-black text-slate-900">$25.00</span>
                                        </button>
                                        <button onClick={() => setApptType('clinic')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${apptType === 'clinic' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${apptType === 'clinic' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <MapPin size={24} />
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${apptType === 'clinic' ? 'text-blue-600' : 'text-slate-400'}`}>In-Clinic Visit</span>
                                            <span className="text-lg font-black text-slate-900">$40.00</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-10 bg-slate-50/50 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Specialist</span>
                                        <span className="text-slate-900">Dr. {selectedDoc?.full_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Schedule</span>
                                        <span className="text-slate-900">{new Date(date).toLocaleDateString()} @ {selectedSlot}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                                        <span className="text-lg font-black text-slate-900">Total Amount</span>
                                        <span className="text-3xl font-black text-blue-600 tracking-tighter">${apptType === 'online' ? '25.00' : '40.00'}</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleBooking} disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg shadow-2xl hover:bg-slate-800 transition-all flex justify-center items-center gap-4 active:scale-95 group">
                                {loading ? (
                                    <Clock className="animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck size={24} className="text-emerald-400" />
                                        Pay & Secure Appointment
                                        <ArrowLeft size={20} className="rotate-180 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
                                <CreditCard size={12} /> SECURE 256-BIT SSL ENCRYPTED PAYMENT
                            </p>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookingFlow;
