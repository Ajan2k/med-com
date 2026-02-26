import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminApi';
import io from 'socket.io-client';
import { Calendar, Pill, Activity, Bell, LogOut, LayoutDashboard, Clock, Check, X, AlertCircle, RefreshCw, FileText, TestTube, Truck, Package, Users, TrendingUp, AlertTriangle, BarChart as BarChartIcon, Receipt, Printer, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// --- MOCK ANALYTICS DATA ---
const revenueData = [
    { name: 'Sep', revenue: 4000, patients: 240 },
    { name: 'Oct', revenue: 4500, patients: 290 },
    { name: 'Nov', revenue: 5200, patients: 320 },
    { name: 'Dec', revenue: 4800, patients: 280 },
    { name: 'Jan', revenue: 6100, patients: 390 },
    { name: 'Feb', revenue: 7500, patients: 450 },
];

const departmentData = [
    { name: 'Consultations', value: 45 },
    { name: 'Lab Tests', value: 25 },
    { name: 'Pharmacy', value: 30 },
];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

const medicineSalesData = [
    { name: 'Paracetamol', sales: 400 },
    { name: 'Amoxicillin', sales: 300 },
    { name: 'Ibuprofen', sales: 300 },
    { name: 'Vitamin C', sales: 200 },
    { name: 'Cough Syrup', sales: 278 },
];

// --- MOCK BILLING DATA ---
const mockBillingData = [
    { id: 'INV-2026-001', patientName: 'John Doe', patientId: '1024', date: 'Oct 24, 2026', type: 'Consultation + Lab', amount: 1250, status: 'Paid', items: [{ desc: 'General Consultation', amount: 500 }, { desc: 'Complete Blood Count', amount: 750 }] },
    { id: 'INV-2026-002', patientName: 'Sarah Smith', patientId: '1089', date: 'Oct 24, 2026', type: 'Pharmacy', amount: 480, status: 'Completed', items: [{ desc: 'Amoxicillin 500mg', amount: 300 }, { desc: 'Paracetamol', amount: 180 }] },
    { id: 'INV-2026-003', patientName: 'Michael Chen', patientId: '1102', date: 'Oct 23, 2026', type: 'Consultation', amount: 800, status: 'Pending', items: [{ desc: 'Cardiology Specialist Consult', amount: 800 }] },
    { id: 'INV-2026-004', patientName: 'Emma Watson', patientId: '1145', date: 'Oct 23, 2026', type: 'Lab Test', amount: 2100, status: 'Paid', items: [{ desc: 'MRI Scan - Knee', amount: 2100 }] },
    { id: 'INV-2026-005', patientName: 'David Lee', patientId: '1167', date: 'Oct 22, 2026', type: 'Pharmacy', amount: 150, status: 'Overdue', items: [{ desc: 'Cough Syrup', amount: 150 }] },
];

// Ensure backend URL is correct
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const socket = io(API_URL);

const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]); // New state for medicines
    const [stats, setStats] = useState({ doctors: 0, lab: 0, pharmacy: 0, inventory: 0 });

    // ACTION MODAL STATE
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [selectedInventory, setSelectedInventory] = useState(null); // Inventory modal state
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

    // BILLING & INVOICE STATE
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const adminName = localStorage.getItem('admin_name') || 'Staff';
    const role = localStorage.getItem('admin_role') || 'admin';

    // --- INITIAL SETUP ---
    useEffect(() => {
        if (role === 'doctor') setActiveTab('appointments');
        else if (role === 'lab') setActiveTab('lab');
        else if (role === 'pharmacist') setActiveTab('pharmacy');

        fetchData();

        socket.on('new_appointment', () => {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log("Audio blocked"));
            } catch (e) { }
            fetchData();
        });
        return () => socket.off('new_appointment');
    }, [role]);

    const fetchData = async () => {
        try {
            const apptRes = await adminAPI.getAppointments();
            const rxRes = await adminAPI.getPharmacyOrders();
            const invRes = await adminAPI.getMedicines(); // Fetch medicines

            // Safety check: ensure data is an array
            const apptData = Array.isArray(apptRes.data) ? apptRes.data : [];
            const rxData = Array.isArray(rxRes.data) ? rxRes.data : [];
            const invData = Array.isArray(invRes.data) ? invRes.data : [];

            setAppointments(apptData);
            setOrders(rxData);
            setInventory(invData); // Store medicines

            setStats({
                doctors: apptData.filter(a => a.type !== 'lab_test' && a.status === 'pending').length,
                lab: apptData.filter(a => a.type === 'lab_test' && a.status !== 'completed').length,
                pharmacy: rxData.filter(o => o.status === 'preparing').length,
                inventory: invData.length // Total medicines in stock
            });
        } catch (e) {
            console.error("Data Load Error", e);
        }
    };

    const handleStatus = async (type, id, status) => {
        try {
            if (status === 'rescheduled') {
                if (!rescheduleDate || !rescheduleTime) {
                    alert("Please select a valid date and time first.");
                    return;
                }
                await adminAPI.updateStatus(type, id, status, { date: rescheduleDate, time: rescheduleTime });
            } else {
                await adminAPI.updateStatus(type, id, status);
            }

            setSelectedAppt(null); // Close modal
            setRescheduleDate(''); // Reset fields
            setRescheduleTime('');
            fetchData(); // Refresh table
        } catch (e) {
            alert("Action Failed. Check console.");
            console.error(e);
        }
    };

    // --- SUB-COMPONENTS ---
    const SidebarItem = ({ id, icon: Icon, label, count, visible }) => {
        if (!visible) return null;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl mb-2 transition-all duration-300 font-medium ${activeTab === id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 font-bold tracking-wide' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1'}`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} className={activeTab === id ? "text-white" : "text-slate-500"} />
                    <span className="text-sm">{label}</span>
                </div>
                {count > 0 && <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${activeTab === id ? 'bg-white text-blue-600 shadow-sm' : 'bg-red-500 text-white'}`}>{count}</span>}
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
            {/* Global Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>

            {/* SIDEBAR */}
            <div className="w-72 bg-[#0a0f1d] border-r border-slate-800/50 text-white p-6 flex flex-col justify-between relative shadow-2xl z-20">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                    <div
                        className="flex items-center gap-4 mb-12 px-2 cursor-pointer group"
                        onClick={() => setActiveTab('overview')}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 text-white group-hover:shadow-blue-500/40 transition-shadow">M</div>
                        <h1 className="font-black text-xl tracking-tight">MediCare<span className="text-blue-400 font-medium">Admin</span></h1>
                    </div>

                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Workspace</p>

                        {/* STRICT ROLE FILTERING */}
                        <SidebarItem id="analytics" icon={BarChartIcon} label="Analytics" count={0} visible={role === 'admin'} />
                        <SidebarItem id="appointments" icon={Calendar} label="Appointments" count={stats.doctors} visible={role === 'doctor' || role === 'admin'} />
                        <SidebarItem id="lab" icon={Activity} label="Lab Queue" count={stats.lab} visible={role === 'lab' || role === 'admin'} />
                        <SidebarItem id="pharmacy" icon={Pill} label="Pharmacy" count={stats.pharmacy} visible={role === 'pharmacist' || role === 'admin'} />
                        <SidebarItem id="inventory" icon={Package} label="Inventory" count={stats.inventory} visible={role === 'pharmacist' || role === 'admin'} />
                        <SidebarItem id="billing" icon={Receipt} label="Billing & Invoices" count={0} visible={role === 'admin'} />
                    </div>
                </div>

                <button onClick={onLogout} className="flex items-center gap-3 text-slate-400 hover:text-white px-3 py-2 transition-colors">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Sign Out</span>
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full backdrop-blur-[2px]">

                {/* TOP BAR */}
                <div className="h-20 bg-white/40 backdrop-blur-2xl border-b border-white/60 sticky top-0 z-20 flex justify-between items-center px-10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
                    <h2 className="font-black text-slate-800 text-2xl capitalize flex items-center gap-3 tracking-tight">
                        {activeTab === 'appointments' && <><div className="p-2 bg-blue-50 rounded-xl"><Calendar className="text-blue-600" size={24} /></div> My Schedule</>}
                        {activeTab === 'lab' && <><div className="p-2 bg-purple-50 rounded-xl"><Activity className="text-purple-600" size={24} /></div> Lab Requests</>}
                        {activeTab === 'pharmacy' && <><div className="p-2 bg-emerald-50 rounded-xl"><Pill className="text-emerald-600" size={24} /></div> Pharmacy Orders</>}
                        {activeTab === 'inventory' && <><div className="p-2 bg-indigo-50 rounded-xl"><Package className="text-indigo-600" size={24} /></div> Product Inventory</>}
                        {activeTab === 'analytics' && <><div className="p-2 bg-rose-50 rounded-xl"><BarChartIcon className="text-rose-600" size={24} /></div> Analytics Hub</>}
                        {activeTab === 'billing' && <><div className="p-2 bg-cyan-50 rounded-xl"><Receipt className="text-cyan-600" size={24} /></div> Transactions & Billing</>}
                        {activeTab === 'overview' && <><div className="p-2 bg-slate-100 rounded-xl"><LayoutDashboard className="text-slate-600" size={24} /></div> Overview</>}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{adminName}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full mt-1 border border-slate-200/60 inline-block">{role === 'lab' ? 'Technician' : role}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* DASHBOARD CONTENT */}
                <div className="flex-1 overflow-y-auto p-10 relative z-0 scroll-smooth">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8 pb-10">

                            {/* WELCOME HERO BANNER */}
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-[2rem] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden flex justify-between items-center group">
                                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 blur-3xl rounded-full group-hover:scale-110 transition-transform duration-700"></div>
                                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full group-hover:translate-x-10 transition-transform duration-700"></div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                                <div className="relative z-10">
                                    <h2 className="text-4xl font-black mb-3 tracking-tight">Welcome back, {adminName}! 👋</h2>
                                    <p className="text-blue-100/90 font-medium text-lg max-w-xl">Here's what's happening across your clinic today. You have {stats.doctors} patients waiting and {stats.pharmacy} pharmacy orders to fulfill.</p>
                                </div>
                                <div className="relative z-10 hidden lg:block text-right bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl shadow-xl">
                                    <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Today's Date</p>
                                    <p className="text-xl font-black tracking-tight">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>

                            {/* STATS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-7 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer overflow-hidden relative" onClick={() => setActiveTab('appointments')}>
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-60 group-hover:bg-blue-100 transition-colors"></div>
                                    <div className="relative z-10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pending Consults</p>
                                        <h3 className="text-4xl font-black text-slate-800">{stats.doctors}</h3>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                        <Calendar size={26} />
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer overflow-hidden relative" onClick={() => setActiveTab('lab')}>
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-60 group-hover:bg-purple-100 transition-colors"></div>
                                    <div className="relative z-10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lab Requests</p>
                                        <h3 className="text-4xl font-black text-slate-800">{stats.lab}</h3>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                        <Activity size={26} />
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer overflow-hidden relative" onClick={() => setActiveTab('pharmacy')}>
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-60 group-hover:bg-emerald-100 transition-colors"></div>
                                    <div className="relative z-10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pharmacy Orders</p>
                                        <h3 className="text-4xl font-black text-slate-800">{stats.pharmacy}</h3>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                        <Pill size={26} />
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer overflow-hidden relative" onClick={() => setActiveTab('inventory')}>
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-60 group-hover:bg-indigo-100 transition-colors"></div>
                                    <div className="relative z-10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Inventory</p>
                                        <h3 className="text-4xl font-black text-slate-800">{stats.inventory}</h3>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                        <Package size={26} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8 pb-10">

                            {/* KPI CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Revenue', value: '₹32,100', trend: '+14%', color: 'blue' },
                                    { label: 'Patient Footfall', value: '1,980', trend: '+8%', color: 'purple' },
                                    { label: 'Lab Tests Done', value: '430', trend: '+22%', color: 'emerald' },
                                    { label: 'Pharmacy Sales', value: '890', trend: '-3%', color: 'rose' }
                                ].map((kpi, i) => (
                                    <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform cursor-default">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{kpi.trend}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpi.value}</h3>
                                    </div>
                                ))}
                            </div>

                            {/* MAIN CHARTS AREA */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* REVENUE TREND (AREA CHART) */}
                                <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-xl tracking-tight">Revenue & Patient Trends</h3>
                                            <p className="text-xs text-slate-500 font-medium">Last 6 Months performance metrics.</p>
                                        </div>
                                        <select className="bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 px-4 py-2 rounded-xl outline-none">
                                            <option>Last 6 Months</option>
                                            <option>Last Year</option>
                                        </select>
                                    </div>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} />
                                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* DEPARTMENT DISTRIBUTION (PIE CHART) */}
                                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col">
                                    <div className="mb-0">
                                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">Department Traffic</h3>
                                        <p className="text-xs text-slate-500 font-medium">Volume distribution by service.</p>
                                    </div>
                                    <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={departmentData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {departmentData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 mt-4">
                                        {departmentData.map((dept, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                                    <span className="text-xs font-bold text-slate-600">{dept.name}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-800">{dept.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TOP MEDICINES (BAR CHART) */}
                                <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                                    <div className="mb-8">
                                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">Top Dispensed Medicines</h3>
                                        <p className="text-xs text-slate-500 font-medium">Highest volume moving inventory items.</p>
                                    </div>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={medicineSalesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* OVERVIEW - RECENT ACTIVITY SUMMARY */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* UPCOMING APPOINTMENTS */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden flex flex-col group/card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                                <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg"><div className="bg-white p-1.5 shadow-sm border border-slate-100 rounded-lg"><Clock size={18} className="text-blue-600" /></div> Upcoming Consults</h3>
                                    <button onClick={() => setActiveTab('appointments')} className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors">View All Schedule</button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {appointments.filter(a => a.type !== 'lab_test' && a.status === 'pending').slice(0, 5).map(appt => (
                                        <div key={appt.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">Patient #{appt.patient_id}</p>
                                                <p className="text-xs text-slate-400">{new Date(appt.appointment_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded">Pending</span>
                                        </div>
                                    ))}
                                    {appointments.filter(a => a.type !== 'lab_test' && a.status === 'pending').length === 0 && (
                                        <div className="p-8 text-center text-slate-400 text-sm">No upcoming consults.</div>
                                    )}
                                </div>
                            </div>

                            {/* PENDING ORDERS */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden flex flex-col group/card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                                <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg"><div className="bg-white p-1.5 shadow-sm border border-slate-100 rounded-lg"><AlertTriangle size={18} className="text-amber-500" /></div> Urgent Rx Orders</h3>
                                    <button onClick={() => setActiveTab('pharmacy')} className="text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors">Go to Pharmacy</button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {orders.filter(o => o.status === 'processing' || o.status === 'preparing').slice(0, 5).map(order => (
                                        <div key={order.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">Order #{order.id}</p>
                                                <p className="text-xs text-slate-400">Needs fulfillment</p>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-600 px-2 py-1 rounded">Preparing</span>
                                        </div>
                                    ))}
                                    {orders.filter(o => o.status === 'processing' || o.status === 'preparing').length === 0 && (
                                        <div className="p-8 text-center text-slate-400 text-sm">All pharmacy orders complete.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BILLING & INVOICING TAB */}
                    {activeTab === 'billing' && (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8 pb-10">

                            {/* BILLING KPI HEADER */}
                            <div className="flex flex-wrap gap-4 mb-4">
                                <div className="flex-1 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-cyan-50 text-cyan-500 rounded-2xl flex items-center justify-center">
                                            <CreditCard size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-400">Total Collected</p>
                                            <h3 className="text-2xl font-black text-slate-800">₹142,500</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-400">Pending Payments</p>
                                            <h3 className="text-2xl font-black text-slate-800">₹18,200</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                            <Receipt size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-400">Invoices Generated</p>
                                            <h3 className="text-2xl font-black text-slate-800">1,204</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TRANSACTIONS TABLE */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
                                <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/50">
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Receipt size={18} className="text-slate-500" /> Transaction Ledger</h3>
                                    <div className="text-xs font-bold text-slate-400">Click any row to view & print invoice</div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Billed To</th>
                                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {mockBillingData.map((txn) => (
                                            <tr key={txn.id} onClick={() => setSelectedInvoice(txn)} className="hover:bg-white cursor-pointer group transition-colors">
                                                <td className="p-5 whitespace-nowrap">
                                                    <span className="font-bold text-slate-700 bg-slate-100/50 px-3 py-1.5 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">{txn.id}</span>
                                                </td>
                                                <td className="p-5 whitespace-nowrap text-sm font-medium text-slate-500">{txn.date}</td>
                                                <td className="p-5 whitespace-nowrap">
                                                    <p className="font-bold text-slate-800 text-sm">{txn.patientName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">ID: {txn.patientId}</p>
                                                </td>
                                                <td className="p-5 whitespace-nowrap text-sm font-bold text-slate-500">{txn.type}</td>
                                                <td className="p-5 whitespace-nowrap font-black text-slate-800">₹{txn.amount.toLocaleString()}</td>
                                                <td className="p-5 whitespace-nowrap">
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded w-fit ${txn.status === 'Paid' || txn.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        txn.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-red-50 text-red-600'
                                                        }`}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* DOCTOR VIEW: WEEKLY CALENDAR SCHEDULE */}
                    {activeTab === 'appointments' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white overflow-hidden flex flex-col h-[calc(100vh-8rem)]">

                            {/* Calendar Header / Tool Bar */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar size={18} className="text-blue-500" /> Managing Schedule</h3>
                                    <p className="text-xs font-semibold text-slate-400 mt-1">Oct 19 - Oct 25, 2026</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Today</button>
                                    <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">Set Availability</button>
                                </div>
                            </div>

                            {/* Weekly Grid Container (Scrollable) */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative custom-scrollbar">

                                {/* Day Headers */}
                                <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur-md z-30 shadow-sm">
                                    <div className="p-4 text-center border-r border-slate-100"></div>
                                    {['Mon 19', 'Tue 20', 'Wed 21', 'Thu 22', 'Fri 23', 'Sat 24', 'Sun 25'].map((day, i) => (
                                        <div key={day} className={`p-4 text-center border-r border-slate-100 ${i === 2 ? 'bg-blue-50/50' : ''}`}>
                                            <p className={`text-xs font-extrabold uppercase tracking-widest ${i === 2 ? 'text-blue-600' : 'text-slate-400'}`}>{day.split(' ')[0]}</p>
                                            <p className={`text-2xl font-black mt-1 ${i === 2 ? 'text-blue-700' : 'text-slate-800'}`}>{day.split(' ')[1]}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Time Slots Grid */}
                                <div className="relative border-t border-slate-100 min-h-[800px]">
                                    {/* The Background Grid Lines */}
                                    <div className="absolute inset-0 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
                                        {/* Time Axis Labels */}
                                        <div className="border-r border-slate-100 bg-white/50">
                                            {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map(time => (
                                                <div key={time} className="h-20 text-[10px] font-bold text-slate-400 text-right pr-3 pt-2">{time}</div>
                                            ))}
                                        </div>
                                        {/* Day Columns */}
                                        {[0, 1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className={`border-r border-slate-100 relative ${i === 2 ? 'bg-blue-50/20' : ''}`}>
                                                {/* Horizontal Hour Lines inside day columns */}
                                                {[...Array(11)].map((_, j) => (
                                                    <div key={j} className="h-20 border-b border-slate-50 border-dashed"></div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* APPOINTMENT BLOCKS (Absolutely positioned over the grid) */}
                                    <div className="absolute top-0 left-[80px] right-0 bottom-0 pointer-events-none">

                                        {appointments.filter(a => a.type !== 'lab_test').map((appt, i) => {

                                            // Mock Logic: We randomly distribute the parsed real appointments onto the grid for visual flair.
                                            // In a real app, this calculates Top/Left based on appt.appointment_time

                                            const dayIndex = (appt.id % 5); // Spread across Mon-Fri
                                            const hourIndex = ((appt.id % 8) + 1); // Spread 9am-4pm

                                            // 80px per hour block. 
                                            const topPosition = `${hourIndex * 80}px`;
                                            const leftPosition = `calc(${dayIndex} * (100% / 7))`;
                                            const widthSize = `calc(100% / 7 - 12px)`;

                                            const isConfirmed = appt.status === 'confirmed';
                                            const isPending = appt.status === 'pending';

                                            return (
                                                <div
                                                    key={appt.id}
                                                    onClick={() => setSelectedAppt(appt)}
                                                    className={`absolute m-1.5 p-3 rounded-xl border pointer-events-auto cursor-pointer group hover:scale-[1.02] hover:shadow-xl transition-all duration-300 hover:z-50
                                                        ${isConfirmed ? 'bg-white/80 backdrop-blur-md border-emerald-100 shadow-[0_4px_15px_rgba(16,185,129,0.1)]' :
                                                            isPending ? 'bg-amber-50/90 backdrop-blur-md border-amber-100 shadow-[0_4px_15px_rgba(245,158,11,0.15)]' :
                                                                'bg-slate-50/90 backdrop-blur-md border-slate-200'
                                                        }
                                                    `}
                                                    style={{
                                                        top: topPosition,
                                                        left: leftPosition,
                                                        width: widthSize,
                                                        height: '70px', // Assume 1 hr block 
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-1 leading-none">
                                                        <span className="text-[10px] font-black uppercase text-slate-400">#P-{appt.patient_id}</span>
                                                        <div className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-emerald-400' : isPending ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`}></div>
                                                    </div>
                                                    <h4 className={`text-sm font-bold truncate ${isConfirmed ? 'text-emerald-900' : isPending ? 'text-amber-900' : 'text-slate-600'}`}>Consultation</h4>
                                                    <p className={`text-[10px] truncate font-semibold ${isConfirmed ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-slate-400'}`}>Dr. Smith</p>

                                                    {/* Hover Action Strip */}
                                                    <div className="absolute inset-x-0 bottom-0 top-0 bg-blue-600 text-white rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity duration-300 shadow-lg shadow-blue-500/40">
                                                        Manage
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* Mock Blocked Time */}
                                        <div
                                            className="absolute m-1.5 rounded-xl border border-slate-200 bg-slate-100/50 backdrop-blur-sm shadow-inner flex items-center justify-center"
                                            style={{ top: '320px', left: `calc(1 * (100% / 7))`, width: `calc(100% / 7 - 12px)`, height: '150px' }}
                                        >
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest rotate-90 whitespace-nowrap">Surgery Block</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* LAB VIEW: TEST REQUESTS */}
                    {activeTab === 'lab' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6">
                            {appointments.filter(a => a.type === 'lab_test').map(test => {
                                const isHome = test.doctor_name && test.doctor_name.includes("Home Collection");
                                return (
                                    <div key={test.id} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex justify-between items-center group hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300">
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isHome ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                                {isHome ? <Truck size={24} /> : <TestTube size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Test #{test.id}</h3>
                                                <p className="text-sm text-slate-600 font-medium">{test.doctor_name || "Lab Test"}</p>
                                                <p className="text-xs text-slate-400 mt-1">Patient #{test.patient_id} • Status: <span className="uppercase font-bold text-slate-600">{test.status}</span></p>
                                            </div>
                                        </div>
                                        <div>
                                            <button onClick={() => setSelectedAppt(test)} className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-slate-200 transition-all duration-300 hover:shadow-purple-500/30">Manage Request</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {appointments.filter(a => a.type === 'lab_test').length === 0 && <div className="p-16 text-center text-slate-400 font-medium">No pending lab tests.</div>}
                        </motion.div>
                    )}

                    {/* PHARMACY VIEW */}
                    {activeTab === 'pharmacy' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-8">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300">
                                    <div className="flex justify-between mb-4">
                                        <h3 className="font-bold text-slate-800 text-lg">Rx Order #{order.id}</h3>
                                        <span className="text-xs font-bold uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{order.status}</span>
                                    </div>
                                    <div className="h-28 bg-slate-50 rounded-2xl p-4 mb-6 text-xs font-mono text-slate-600 overflow-y-auto border border-slate-100/60 shadow-inner">
                                        {order.extracted_data || "Reading prescription..."}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleStatus('prescription', order.id, 'ready')} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">Mark Ready</button>
                                        <button onClick={() => handleStatus('prescription', order.id, 'delivered')} className="flex-1 bg-blue-500 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">Dispatched</button>
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && <div className="col-span-2 p-16 text-center text-slate-400 font-medium">No orders in queue.</div>}
                        </motion.div>
                    )}

                    {/* INVENTORY VIEW */}
                    {activeTab === 'inventory' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-white overflow-hidden">
                            <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-lg">Product Inventory</h3>
                                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-full shadow-sm">{inventory.length} Items Listed</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black tracking-wider text-slate-400">
                                        <tr>
                                            <th className="p-5">Product</th>
                                            <th className="p-5">Category</th>
                                            <th className="p-5">Price</th>
                                            <th className="p-5">Stock</th>
                                            <th className="p-5">Expiry Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {inventory.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedInventory(item)}>
                                                <td className="p-5 flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-1 shrink-0 group-hover:shadow-md transition-shadow">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors mb-0.5">{item.name}</p>
                                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{item.brand}</p>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full mb-1.5 block w-max">{item.category}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{item.subCategory}</span>
                                                </td>
                                                <td className="p-5">
                                                    <p className="font-black text-slate-800 text-sm">₹{item.price.toFixed(2)}</p>
                                                    {item.originalPrice > item.price && (
                                                        <p className="text-[11px] text-slate-400 font-bold line-through mt-0.5">₹{item.originalPrice.toFixed(2)}</p>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.stock > 50 ? 'bg-green-50 text-green-600 border border-green-100' :
                                                        item.stock > 20 ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                                            'bg-red-50 text-red-600 border border-red-100'
                                                        }`}>
                                                        {item.stock} Units
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <p className="text-sm font-bold text-slate-600">{new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {inventory.length === 0 && <div className="p-16 text-center text-slate-400 font-medium">No products found in inventory.</div>}
                        </motion.div>
                    )}


                </div>
            </div>

            {/* ROBUST MANAGEMENT MODAL */}
            <AnimatePresence>
                {selectedAppt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5">

                            {/* MODAL HEADER */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{selectedAppt.type === 'lab_test' ? 'Manage Lab Request' : 'Manage Appointment'}</h3>
                                    <p className="text-xs text-slate-500">ID #{selectedAppt.id} • Patient #{selectedAppt.patient_id}</p>
                                </div>
                                <button onClick={() => setSelectedAppt(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>

                            {/* MODAL BODY */}
                            <div className="p-6 space-y-4">

                                {/* LAB ACTIONS */}
                                {selectedAppt.type === 'lab_test' ? (
                                    <>
                                        <button onClick={() => handleStatus('appointment', selectedAppt.id, 'processing')} className="w-full flex items-center justify-between p-4 bg-yellow-50 text-yellow-700 rounded-xl font-bold hover:bg-yellow-100 border border-yellow-200 transition-colors">
                                            <div>
                                                <span className="block">Sample Collected</span>
                                                <span className="text-[10px] opacity-70 font-normal">Mark as Processing</span>
                                            </div>
                                            <TestTube size={18} />
                                        </button>

                                        <button onClick={() => handleStatus('appointment', selectedAppt.id, 'completed')} className="w-full flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 border border-green-200 transition-colors">
                                            <div>
                                                <span className="block">Result Ready</span>
                                                <span className="text-[10px] opacity-70 font-normal">Upload Report & Notify</span>
                                            </div>
                                            <FileText size={18} />
                                        </button>
                                    </>
                                ) : (
                                    /* DOCTOR ACTIONS */
                                    <button onClick={() => handleStatus('appointment', selectedAppt.id, 'confirmed')} className="w-full flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 border border-green-200 transition-colors">
                                        Confirm Booking <Check size={18} />
                                    </button>
                                )}

                                {/* RESCHEDULE ACTION */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Reschedule To</p>
                                    <div className="flex gap-2 mb-3">
                                        <input type="date" className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-blue-500" onChange={e => setRescheduleDate(e.target.value)} />
                                        <input type="time" className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-blue-500" onChange={e => setRescheduleTime(e.target.value)} />
                                    </div>
                                    <button onClick={() => handleStatus('appointment', selectedAppt.id, 'rescheduled')} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 flex justify-center items-center gap-2 transition-colors">
                                        <RefreshCw size={14} /> Save New Time
                                    </button>
                                </div>

                                <button onClick={() => handleStatus('appointment', selectedAppt.id, 'cancelled')} className="w-full flex items-center justify-center gap-2 p-3 text-red-600 text-sm font-bold hover:bg-red-50 rounded-xl transition-colors">
                                    <AlertCircle size={16} /> Cancel Request
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* INVENTORY MANAGEMENT MODAL */}
            <AnimatePresence>
                {selectedInventory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5">

                            {/* MODAL HEADER */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-sm">
                                        <img src={selectedInventory.image} alt={selectedInventory.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{selectedInventory.name}</h3>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedInventory.brand}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedInventory(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0"><X size={20} className="text-slate-500" /></button>
                            </div>

                            {/* MODAL BODY */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pricing</p>
                                        <p className="text-2xl font-black text-slate-800">₹{selectedInventory.price.toFixed(2)}</p>
                                        {selectedInventory.originalPrice > selectedInventory.price && (
                                            <p className="text-xs text-slate-400 font-bold line-through mt-0.5">MRP ₹{selectedInventory.originalPrice.toFixed(2)}</p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Stock</p>
                                        <p className={`text-2xl font-black ${selectedInventory.stock > 20 ? 'text-green-600' : 'text-red-500'}`}>{selectedInventory.stock} <span className="text-sm font-bold opacity-70">Units</span></p>
                                        <p className="text-xs font-bold text-slate-500 mt-0.5">Expires: {new Date(selectedInventory.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Tags</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100">{selectedInventory.category}</span>
                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">{selectedInventory.subCategory}</span>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedInventory(null)} className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    );
};

export default Dashboard;