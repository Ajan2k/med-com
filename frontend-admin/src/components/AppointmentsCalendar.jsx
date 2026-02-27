import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, User as UserIcon, Clock, Phone } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../services/adminApi';

const AppointmentsCalendar = ({ appointments, setSelectedAppt, onRefresh }) => {
    // 1. State for current week offset (0 = this week, -1 = last week, 1 = next week)
    const [weekOffset, setWeekOffset] = useState(0);

    // --- ADMIN BOOKING MODAL STATE ---
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [doctorsList, setDoctorsList] = useState([]);

    const [bookForm, setBookForm] = useState({
        patient_name: '',
        patient_phone: '',
        doctor_id: '',
        date_str: '',
        time_slot: '09:00',
        type: 'clinic'
    });
    const [isBooking, setIsBooking] = useState(false);

    // Fetch lists when modal opens
    useEffect(() => {
        if (showBookingModal) {
            adminAPI.getPatients().then(res => setPatientsList(res.data)).catch(console.error);
            adminAPI.getDoctors().then(res => setDoctorsList(res.data)).catch(console.error);

            // Set default date to today
            const todayStr = new Date().toISOString().split('T')[0];
            setBookForm(prev => ({ ...prev, date_str: todayStr }));
        }
    }, [showBookingModal]);

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        if (!bookForm.patient_name || !bookForm.patient_phone || !bookForm.doctor_id || !bookForm.date_str) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsBooking(true);
        try {
            await adminAPI.bookAppointment(bookForm);
            setShowBookingModal(false);
            if (onRefresh) onRefresh(); // Reload calendar data instantly
        } catch (error) {
            console.error("Booking Error", error);
            alert("Failed to book appointment. Check console.");
        } finally {
            setIsBooking(false);
        }
    };

    // 2. Calculate the days of the currently viewed week
    const currentWeekDays = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDay();
        // Adjust so Monday is 0, Sunday is 6
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

        // Find Monday of the current week offset
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - distanceToMonday + (weekOffset * 7));
        startOfWeek.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        return days;
    }, [weekOffset]);

    const startOfWeek = currentWeekDays[0];
    const endOfWeek = currentWeekDays[6];

    // Format week header like "Oct 19 - Oct 25, 2026"
    const formatHeaderDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
    const headerDisplay = `${formatHeaderDate(startOfWeek)} - ${formatHeaderDate(endOfWeek)}`;

    // Time slots formatting
    const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

    // Grid settings
    const HOUR_HEIGHT = 80; // pixels per hour block
    const START_HOUR = 8; // 8:00 AM grid start

    // Render an appointment block intelligently mapped to the grid
    const renderAppointment = (appt) => {
        if (!appt.appointment_time || appt.type === 'lab_test') return null;

        const apptDate = new Date(appt.appointment_time);

        // Check if appointment falls within the currently viewed week
        if (apptDate < startOfWeek || apptDate >= new Date(endOfWeek.getTime() + 86400000)) {
            return null; // Skip if not this week
        }

        // Calculate Day Index (Monday = 0, Sunday = 6)
        let dayIndex = apptDate.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6; // Sunday fix

        // Calculate Hour Offset from 8:00 AM
        const hour = apptDate.getHours();
        const minute = apptDate.getMinutes();

        // If appointment is outside our visual grid (e.g. before 8am or after 6pm), skip or clamp
        if (hour < START_HOUR || hour > 18) return null;

        // Calculate Pixel Positions
        const topPosition = ((hour - START_HOUR) * HOUR_HEIGHT) + ((minute / 60) * HOUR_HEIGHT);
        const leftPosition = `calc(${dayIndex} * (100% / 7))`;
        const widthSize = `calc(100% / 7 - 12px)`;

        const isConfirmed = appt.status === 'confirmed';
        const isPending = appt.status === 'pending';

        return (
            <div
                key={appt.id}
                onClick={() => setSelectedAppt(appt)}
                className={`absolute m-1.5 p-3 rounded-xl border pointer-events-auto cursor-pointer group hover:scale-[1.02] hover:shadow-xl transition-all duration-300 hover:z-50
                    ${isConfirmed ? 'bg-white/90 backdrop-blur-md border-emerald-200 shadow-[0_4px_15px_rgba(16,185,129,0.15)]' :
                        isPending ? 'bg-amber-50/90 backdrop-blur-md border-amber-200 shadow-[0_4px_15px_rgba(245,158,11,0.15)]' :
                            'bg-slate-50/90 backdrop-blur-md border-slate-200 shadow-[0_4px_15px_rgba(100,116,139,0.1)]'
                    }
                `}
                style={{
                    top: `${topPosition}px`,
                    left: leftPosition,
                    width: widthSize,
                    height: `${HOUR_HEIGHT - 10}px`, // Standard 1 hr block size, slightly smaller for padding
                }}
            >
                <div className="flex justify-between items-start mb-1 leading-none">
                    <span className="text-[10px] font-black uppercase text-slate-500 truncate mr-2 w-full">{appt.patient_name} - {appt.patient_phone || 'No Phone'}</span>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isConfirmed ? 'bg-emerald-400' : isPending ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`}></div>
                </div>
                <h4 className={`text-sm font-bold truncate ${isConfirmed ? 'text-emerald-900' : isPending ? 'text-amber-900' : 'text-slate-600'}`}>{appt.type === 'consultation' ? 'Consultation' : 'Appointment'}</h4>
                <p className={`text-[10px] truncate font-semibold mt-0.5 ${isConfirmed ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-slate-400'}`}>{apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

                {/* Hover Action Strip */}
                <div className="absolute inset-x-0 bottom-0 top-0 bg-blue-600/95 backdrop-blur-sm text-white rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity duration-300 shadow-lg shadow-blue-500/40">
                    Manage
                </div>
            </div>
        );
    };

    return (
        <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white overflow-hidden flex flex-col h-[calc(100vh-8rem)]">

            {/* Calendar Header / Tool Bar */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" /> Managing Schedule
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{headerDisplay}</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mr-2">
                        <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors border-r border-slate-100">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setWeekOffset(0)} className={`px-4 py-2 text-sm font-bold transition-colors ${weekOffset === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Today
                        </button>
                        <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors border-l border-slate-100">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button onClick={() => setShowBookingModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <Plus size={16} /> Book Appointment
                    </button>
                </div>
            </div>

            {/* Weekly Grid Container (Scrollable) */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative custom-scrollbar">

                {/* Day Headers */}
                <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm">
                    <div className="p-4 text-center border-r border-slate-100"></div>
                    {currentWeekDays.map((day, i) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        return (
                            <div key={i} className={`p-3 text-center border-r border-slate-100 ${isToday ? 'bg-blue-50/50' : ''}`}>
                                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                <div className={`mx-auto mt-1 w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : ''}`}>
                                    <p className={`text-xl font-black ${isToday ? 'text-white' : 'text-slate-800'}`}>
                                        {day.getDate()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Time Slots Grid */}
                <div className="relative border-t border-slate-100 min-h-[880px]">
                    {/* The Background Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
                        {/* Time Axis Labels */}
                        <div className="border-r border-slate-100 bg-white/50">
                            {timeSlots.map(time => (
                                <div key={time} style={{ height: `${HOUR_HEIGHT}px` }} className="text-[10px] font-bold text-slate-400 text-right pr-3 pt-2">
                                    {time}
                                </div>
                            ))}
                        </div>
                        {/* Day Columns */}
                        {[0, 1, 2, 3, 4, 5, 6].map(i => {
                            const isToday = new Date().toDateString() === currentWeekDays[i].toDateString();
                            return (
                                <div key={i} className={`border-r border-slate-100 relative ${isToday ? 'bg-blue-50/20' : ''}`}>
                                    {/* Horizontal Hour Lines inside day columns */}
                                    {timeSlots.map((_, j) => (
                                        <div key={j} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-slate-100/60 border-dashed"></div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* APPOINTMENT BLOCKS */}
                    <div className="absolute top-0 left-[80px] right-0 bottom-0 pointer-events-none">
                        {appointments.map(renderAppointment)}
                    </div>
                </div>
            </div>

            {/* --- ADMIN BOOKING OVERLAY MODAL --- */}
            <AnimatePresence>
                {showBookingModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <Motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5">

                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800">New Appointment</h3>
                                    <p className="text-xs text-slate-500">Book a consultation on behalf of a patient.</p>
                                </div>
                                <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleBookSubmit} className="p-6 space-y-5">

                                <div className="space-y-4">
                                    {/* Patient Name Input */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><UserIcon size={12} /> Patient Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={bookForm.patient_name}
                                            onChange={(e) => setBookForm({ ...bookForm, patient_name: e.target.value })}
                                            placeholder="Enter Patient Full Name"
                                            required
                                        />
                                    </div>

                                    {/* Patient Phone Input */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Phone size={12} /> Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={bookForm.patient_phone}
                                            onChange={(e) => setBookForm({ ...bookForm, patient_phone: e.target.value })}
                                            placeholder="Enter Phone Number"
                                            required
                                        />
                                    </div>

                                    {/* Doctor Select */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Assign Doctor</label>
                                        <select
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={bookForm.doctor_id}
                                            onChange={(e) => setBookForm({ ...bookForm, doctor_id: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Choose Doctor --</option>
                                            {doctorsList.map(d => (
                                                <option key={d.id} value={d.id}>Dr. {d.full_name} • {d.department}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date and Time Group */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Calendar size={12} /> Date</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                value={bookForm.date_str}
                                                onChange={(e) => setBookForm({ ...bookForm, date_str: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Clock size={12} /> Slot</label>
                                            <select
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                value={bookForm.time_slot}
                                                onChange={(e) => setBookForm({ ...bookForm, time_slot: e.target.value })}
                                                required
                                            >
                                                {/* Generating 9 AM to 5 PM slots statically for admin override capability */}
                                                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Type Select */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Consultation Type</label>
                                        <div className="flex gap-4">
                                            <label className={`flex-1 p-3 rounded-xl border cursor-pointer border-slate-200 text-sm font-bold text-center transition-colors ${bookForm.type === 'clinic' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                                <input type="radio" className="hidden" name="type" value="clinic" checked={bookForm.type === 'clinic'} onChange={() => setBookForm({ ...bookForm, type: 'clinic' })} />
                                                In-Clinic
                                            </label>
                                            <label className={`flex-1 p-3 rounded-xl border cursor-pointer border-slate-200 text-sm font-bold text-center transition-colors ${bookForm.type === 'online' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                                <input type="radio" className="hidden" name="type" value="online" checked={bookForm.type === 'online'} onChange={() => setBookForm({ ...bookForm, type: 'online' })} />
                                                Online Video
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isBooking}
                                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isBooking ? 'Processing Booking...' : 'Confirm Book Appointment'}
                                    </button>
                                </div>
                            </form>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>

        </Motion.div>
    );
};

export default AppointmentsCalendar;
