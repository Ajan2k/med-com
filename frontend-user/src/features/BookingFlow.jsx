import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion as Motion } from 'framer-motion';
import { Calendar, CreditCard, Video, MapPin, CheckCircle, ArrowLeft, Stethoscope, Activity, Brain, Heart, ChevronRight } from 'lucide-react';
import { patientAPI } from '../services/api';

const DEPARTMENTS = [
    { id: 'General', name: 'General Practice', icon: Stethoscope, color: 'bg-blue-100 text-blue-600' },
    { id: 'Cardiology', name: 'Cardiology', icon: Heart, color: 'bg-red-100 text-red-600' },
    { id: 'Neurology', name: 'Neurology', icon: Brain, color: 'bg-purple-100 text-purple-600' },
    { id: 'Orthopedics', name: 'Orthopedics', icon: Activity, color: 'bg-orange-100 text-orange-600' },
];

const BookingFlow = ({ onBack }) => {
    const [step, setStep] = useState(0);
    const [selectedDept, setSelectedDept] = useState(null);

    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [filteredDocs, setFilteredDocs] = useState([]);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [apptType, setApptType] = useState('online');
    const [loading, setLoading] = useState(false);

    // Load Doctors
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const { data } = await patientAPI.getDoctors();
                setDoctors(data);
            } catch (e) { console.error(e); }
        };
        fetchDocs();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (selectedDept && doctors.length > 0) {
            const filtered = doctors.filter(d => d.department === selectedDept);
            setFilteredDocs(filtered);
        }
    }, [selectedDept, doctors]);

    // Load Slots
    useEffect(() => {
        console.log("Checking Slot Requirements:", { selectedDoc, date }); // DEBUG LOG

        if (selectedDoc && date) {
            const fetchSlots = async () => {
                setLoading(true);
                try {
                    console.log(`📡 FETCHING SLOTS: DocID=${selectedDoc.id}, Date=${date}`); // DEBUG LOG
                    const { data } = await patientAPI.getSlots(selectedDoc.id, date);
                    console.log("✅ SLOTS RECEIVED:", data.slots); // DEBUG LOG
                    setSlots(data.slots);
                } catch (e) {
                    console.error("❌ SLOT ERROR:", e);
                }
                setLoading(false);
            };
            fetchSlots();
        }
    }, [selectedDoc, date]);

    const handleBooking = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error("Please login again.");
            const user = JSON.parse(userStr);

            const payload = {
                patient_id: Number(user.id),
                doctor_id: Number(selectedDoc.id),
                date_str: date,
                time_slot: selectedSlot,
                type: apptType
            };

            // eslint-disable-next-line no-unused-vars
            const { data } = await patientAPI.bookAppointment(payload);
            setStep(4);
        } catch (error) {
            alert("Booking Failed: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <button onClick={() => step === 0 ? onBack() : setStep(step - 1)} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h2 className="font-bold text-slate-800 text-sm">
                    {step === 0 && "Select Department"}
                    {step === 1 && "Select Specialist"}
                    {step === 2 && "Choose Time"}
                    {step === 3 && "Payment"}
                    {step === 4 && "Confirmed"}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">

                {/* STEP 0: Departments */}
                {step === 0 && (
                    <div className="grid grid-cols-1 gap-3">
                        {DEPARTMENTS.map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => { setSelectedDept(dept.id); setStep(1); }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${dept.color}`}>
                                    <dept.icon size={22} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-800 text-sm">{dept.name}</h3>
                                    <p className="text-[11px] text-slate-500">Available Now</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 1: Doctors (Filtered) */}
                {step === 1 && (
                    <div className="space-y-3">
                        {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                            <div key={doc.id} onClick={() => { setSelectedDoc(doc); setStep(2); }} className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex items-center gap-4 transition-all group">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-200 group-hover:text-blue-700">Dr</div>
                                <div>
                                    {/* FIX: Removed explicit "Dr." prefix because DB might have it, or we add it safely */}
                                    <h3 className="font-semibold text-slate-800 text-sm">Dr. {doc.full_name.replace('Dr. ', '')}</h3>
                                    <p className="text-[11px] text-slate-500">{doc.department}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-400 py-10 text-sm">No doctors available in this department yet.</div>
                        )}
                    </div>
                )}

                {/* STEP 2: Date & Slots */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium text-sm" min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Available Slots</label>
                            {loading ? <div className="text-center py-4 text-slate-400 text-xs">Finding slots...</div> : (
                                <div className="grid grid-cols-3 gap-2">
                                    {slots.length > 0 ? slots.map(slot => (
                                        <button key={slot} onClick={() => setSelectedSlot(slot)} className={`py-2 px-1 rounded-lg text-xs font-medium border ${selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                            {slot}
                                        </button>
                                    )) : <div className="col-span-3 text-center text-red-400 text-xs">No slots today.</div>}
                                </div>
                            )}
                        </div>
                        <button disabled={!selectedSlot} onClick={() => setStep(3)} className="w-full bg-slate-900 text-white p-3 rounded-xl disabled:opacity-50 mt-4 text-sm font-bold">Continue</button>
                    </div>
                )}

                {/* STEP 3: Payment */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <button onClick={() => setApptType('online')} className={`flex-1 p-4 border rounded-xl flex flex-col items-center gap-2 ${apptType === 'online' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>
                                <Video size={20} /> <span className="text-xs font-bold">Video ($25)</span>
                            </button>
                            <button onClick={() => setApptType('clinic')} className={`flex-1 p-4 border rounded-xl flex flex-col items-center gap-2 ${apptType === 'clinic' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>
                                <MapPin size={20} /> <span className="text-xs font-bold">Visit ($40)</span>
                            </button>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border text-xs space-y-2">
                            <div className="flex justify-between"><span>Doctor</span> <span className="font-semibold">{selectedDoc?.full_name}</span></div>
                            <div className="flex justify-between"><span>Time</span> <span className="font-semibold">{date} @ {selectedSlot}</span></div>
                            <div className="border-t pt-2 flex justify-between font-bold text-sm"><span>Total</span> <span>{apptType === 'online' ? '$25' : '$40'}</span></div>
                        </div>
                        <button onClick={handleBooking} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 text-sm">
                            {loading ? "Processing..." : <><CreditCard size={16} /> Pay & Confirm</>}
                        </button>
                    </div>
                )}

                {/* STEP 4: Success */}
                {step === 4 && (
                    <div className="text-center pt-8">
                        <Motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><CheckCircle size={40} /></Motion.div>
                        <h3 className="text-xl font-bold text-slate-800">Booked Successfully!</h3>
                        <p className="text-sm text-slate-500 mb-6">Details sent to your email.</p>
                        <button onClick={onBack} className="text-slate-500 text-sm hover:underline">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingFlow;