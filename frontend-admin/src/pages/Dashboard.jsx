import { useState, useEffect } from 'react';
import axios from 'axios';
import { adminAPI } from '../services/adminApi';
import io from 'socket.io-client';
import {
    Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BarChart as BarChartIcon, Bell, Briefcase, Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, FileText, Info, LayoutDashboard, List, LogOut, MessageSquare, MoreHorizontal, Package, Pill, Plus, Printer, Receipt, RefreshCw, Search, Shield, TestTube, Trash2, TrendingUp, Truck, User, Users, X
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import AppointmentsCalendar from '../components/AppointmentsCalendar';

// --- SUB-COMPONENTS ---
const SidebarItem = ({ id, Icon, label, count, visible, activeTab, setActiveTab }) => {
    if (!visible) return null;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl mb-2 transition-all duration-300 font-medium ${activeTab === id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 font-bold tracking-wide' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1'}`}
        >
            <div className="flex items-center gap-3">
                {Icon && <Icon size={20} className={activeTab === id ? "text-white" : "text-slate-400"} />}
                <span className="text-sm">{label}</span>
            </div>
            {(Number(count) > 0) && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${activeTab === id ? 'bg-white text-blue-600 shadow-sm' : 'bg-red-500 text-white'}`}>
                    {count}
                </span>
            )}
        </button>
    );
};

// --- MOCK ANALYTICS DATA ---
const revenueData = [
    { name: 'Sep', revenue: 4000, patients: 240 },
    { name: 'Oct', revenue: 4500, patients: 290 },
    { name: 'Nov', revenue: 5200, patients: 320 },
    { name: 'Dec', revenue: 4800, patients: 280 },
    { name: 'Jan', revenue: 6100, patients: 390 },
    { name: 'Feb', revenue: 7500, patients: 450 },];

const departmentData = [
    { name: 'Consultations', value: 45 },
    { name: 'Lab Tests', value: 25 },
    { name: 'Pharmacy', value: 30 },];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

const medicineSalesData = [
    { name: 'Paracetamol', sales: 400 },
    { name: 'Amoxicillin', sales: 300 },
    { name: 'Ibuprofen', sales: 300 },
    { name: 'Vitamin C', sales: 200 },
    { name: 'Cough Syrup', sales: 278 },];

// --- MOCK BILLING DATA ---
const mockBillingData = [
    { id: 'INV-2026-001', patientName: 'John Doe', patientId: '1024', date: 'Oct 24, 2026', type: 'Consultation + Lab', amount: 1250, status: 'Paid', items: [{ desc: 'General Consultation', amount: 500 }, { desc: 'Complete Blood Count', amount: 750 }] },
    { id: 'INV-2026-002', patientName: 'Sarah Smith', patientId: '1089', date: 'Oct 24, 2026', type: 'Pharmacy', amount: 480, status: 'Completed', items: [{ desc: 'Amoxicillin 500mg', amount: 300 }, { desc: 'Paracetamol', amount: 180 }] },
    { id: 'INV-2026-003', patientName: 'Michael Chen', patientId: '1102', date: 'Oct 23, 2026', type: 'Consultation', amount: 800, status: 'Pending', items: [{ desc: 'Cardiology Specialist Consult', amount: 800 }] },
    { id: 'INV-2026-004', patientName: 'Emma Watson', patientId: '1145', date: 'Oct 23, 2026', type: 'Lab Test', amount: 2100, status: 'Paid', items: [{ desc: 'MRI Scan-Knee', amount: 2100 }] },
    { id: 'INV-2026-005', patientName: 'David Lee', patientId: '1167', date: 'Oct 22, 2026', type: 'Pharmacy', amount: 150, status: 'Overdue', items: [{ desc: 'Cough Syrup', amount: 150 }] },];

// Ensure backend URL is correct
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const socket = io(API_URL);

const Dashboard = ({ onLogout, onBack }) => {
    const rawRole = localStorage.getItem('admin_role') || 'Admin';
    const adminRole = rawRole.toLowerCase();
    const [activeTab, setActiveTab] = useState(() => {
        if (adminRole === 'doctor') return 'doctor_dashboard';
        if (adminRole === 'lab') return 'lab_dashboard';
        if (adminRole === 'pharmacist') return 'pharmacy';
        return 'overview';
    });
    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]); // Master list of doctors
    const [staffUsers, setStaffUsers] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [stats, setStats] = useState({ doctors: 0, lab: 0, pharmacy: 0, inventory: 0 });
    const [backendDiag, setBackendDiag] = useState(null); // Backend health check state

    // ACTION MODAL STATE
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [selectedInventory, setSelectedInventory] = useState(null); // Inventory modal state
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

    // LAB BOOKING STATE
    const [showLabBookingModal, setShowLabBookingModal] = useState(false);
    const [labBookingData, setLabBookingData] = useState({
        patient_name: '',
        patient_phone: '',
        test_name: ''
    });

    // USER MANAGEMENT STATE
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ full_name: '', email: '', password: '', role: 'doctor', department: '', phone: '' });
    const [activeRoleTab, setActiveRoleTab] = useState('all'); // NEW: For filtering users by role inline
    const [showProfileMenu, setShowProfileMenu] = useState(false); // NEW: Dropdown menu for profile
    const [scheduleTab, setScheduleTab] = useState('today'); // NEW: For doctor dashboard tabs
    const [searchQuery, setSearchQuery] = useState(''); // NEW: For patient search in doctor dashboard

    const adminName = localStorage.getItem('admin_name') || 'Staff';
    const adminId = localStorage.getItem('admin_id');

    const fetchData = async () => {
        try {
            const apptRes = await adminAPI.getAppointments();
            const rxRes = await adminAPI.getPharmacyOrders();
            const invRes = await adminAPI.getMedicines();
            const docRes = await adminAPI.getDoctors();

            // Safety check: ensure data is an array
            const apptData = Array.isArray(apptRes?.data) ? apptRes.data : [];
            const rxData = Array.isArray(rxRes?.data) ? rxRes.data : [];
            const invData = Array.isArray(invRes?.data) ? invRes.data : [];
            const docData = Array.isArray(docRes?.data) ? docRes.data : [];

            // Filter appointments if the user is a specific doctor
            let filteredAppts = apptData.filter(a => a.patient_name !== 'Main Admin'); // Filter out mock admin data globally
            if (adminRole === 'doctor' && adminId) {
                // If they are a doctor, only show their appointments OR generic lab tests
                filteredAppts = filteredAppts.filter(a => String(a?.doctor_id) === String(adminId) || a?.type === 'lab_test');
            }

            // --- DUMMY DATA INJECTION (If Empty) ---
            if ((filteredAppts || []).length === 0 && adminRole === 'doctor') {
                const now = new Date();
                const dummyAppts = [
                    { id: 1001, patient_name: 'Rahul Sharma', patient_phone: '+91 98765 43210', appointment_time: now.toISOString(), status: 'confirmed', type: 'consultation' },
                    { id: 1002, patient_name: 'Priya Verma', patient_phone: '+91 87654 32109', appointment_time: new Date(now.getTime() + 3600000).toISOString(), status: 'pending', type: 'consultation' },
                    { id: 1003, patient_name: 'Amit Patel', patient_phone: '+91 76543 21098', appointment_time: new Date(now.getTime() + 7200000).toISOString(), status: 'in_progress', type: 'consultation' },
                    { id: 1004, patient_name: 'Sneha Gupta', patient_phone: '+91 99887 76655', appointment_time: new Date(now.getTime() + 86400000).toISOString(), status: 'confirmed', type: 'consultation' }, // Tomorrow
                    { id: 1005, patient_name: 'Vikram Singh', patient_phone: '+91 88776 65544', appointment_time: new Date(now.getTime() + 172800000).toISOString(), status: 'pending', type: 'consultation' }, // Day after
                    { id: 1006, patient_name: 'Anjali Rae', patient_phone: '+91 77665 54433', appointment_time: new Date(now.getTime() - 86400000).toISOString(), status: 'completed', type: 'consultation' }, // Yesterday
                    { id: 1007, patient_name: 'Raj Malhotra', patient_phone: '+91 66554 43322', appointment_time: new Date(now.getTime() - 172800000).toISOString(), status: 'completed', type: 'consultation' } // Day before
                ];
                setAppointments(dummyAppts);
            } else if ((filteredAppts || []).filter(a => a.type === 'lab_test').length === 0 && adminRole === 'lab') {
                const now = new Date();
                const dummyLabTests = [
                    { id: 1005, patient_name: 'Alice Smith', patient_age: 25, type: 'lab_test', lab_test_name: 'Complete Blood Count (CBC)', status: 'new', payment_status: 'pending', appointment_time: now.toISOString() },
                    { id: 1006, patient_name: 'John Doe', patient_age: 25, type: 'lab_test', lab_test_name: 'Lipid Profile', status: 'processing', payment_status: 'pending', appointment_time: new Date(now.getTime() - 3600000).toISOString() },
                    { id: 1007, patient_name: 'Sarah Miller', patient_age: 25, type: 'lab_test', lab_test_name: 'Diabetes Screen (HbA1c)', status: 'ready', payment_status: 'pending', appointment_time: new Date(now.getTime() - 7200000).toISOString() }
                ];
                setAppointments(dummyLabTests);
            } else {
                setAppointments(filteredAppts);
            }
            setOrders(rxData);
            setInventory(invData);
            setAllDoctors(docData);

            try {
                const usersRes = await adminAPI.getUsers();
                const rolesRes = await adminAPI.getRolePermissions();
                setStaffUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
                setRolePermissions(Array.isArray(rolesRes?.data) ? rolesRes.data : []);
            } catch (err) {
                console.error("Failed to load users/roles", err);
            }

            setStats({
                doctors: (filteredAppts || []).filter(a => a?.type !== 'lab_test' && a?.status?.toLowerCase() === 'pending').length,
                lab: (apptData || []).filter(a => a?.type === 'lab_test' && a?.status?.toLowerCase() !== 'completed').length, // Admins/Labs see all lab tests stats
                pharmacy: (rxData || []).filter(o => o?.status?.toLowerCase() === 'preparing' || o?.status?.toLowerCase() === 'pending').length,
                inventory: (invData || []).length
            });

            setOrders(rxData);
            setInventory(invData);
            setAllDoctors(docData);
            // Hit Health Check for Diagnostic
            try {
                const health = await axios.get(API_URL + '/');
                setBackendDiag(health.data);
            } catch (err) {
                console.error("Health Check Failed", err);
            }
        } catch (error) {
            console.error("CRITICAL: Dashboard Data Load Error", error);
        }
    };

    const forceSync = () => {
        console.log("FORCE SYNC INITIATED");
        fetchData();
        alert("Data Sync Requested. Refreshing dashboards from the central database...");
    };

    // RBAC: Get permissions for the current logged-in user's role
    const getMyPermissions = () => {
        if (adminRole === 'admin') {
            return { manage_users: true, manage_roles: true, manage_appointments: true, manage_lab: true, manage_pharmacy: true, manage_inventory: true };
        }
        const myRoleData = rolePermissions.find(r => r.role_name === adminRole);
        return myRoleData?.permissions || {};
    };
    const myPerms = getMyPermissions();

    // --- INITIAL SETUP ---
    useEffect(() => {
        fetchData(); // eslint-disable-line react-hooks/set-state-in-effect

        socket.on('new_appointment', () => {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => console.log("Audio blocked"));
            } catch { /* Audio blocked */ }
            fetchData();
        });
        return () => socket.off('new_appointment');
    }, []);



    const handleStatus = async (type, id, status) => {
        try {
            if (status === 'rescheduled') {
                if (!rescheduleDate || !rescheduleTime) {
                    alert("Please select a valid date and time first.");
                    return;
                }
                await adminAPI.updateStatus(type, id, status, { date: rescheduleDate, time: rescheduleTime });
            } else if (status === 'completed' || status === 'ready') {
                const res = prompt("Enter Lab Result Findings (e.g. Blood Sugar: 120mg/dL):", "");
                if (res === null) return; // Cancelled prompt
                await adminAPI.updateStatus(type, id, status, { result: res });
            } else {
                await adminAPI.updateStatus(type, id, status);
            }

            setSelectedAppt(null); // Close modal
            setRescheduleDate(''); // Reset fields
            setRescheduleTime('');
            fetchData(); // Refresh table
        } catch (error) {
            console.error(error);
            alert("Action Failed. Check console.");
        }
    };

    const handleLabBookSubmit = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.bookLab(labBookingData);
            setShowLabBookingModal(false);
            setLabBookingData({ patient_name: '', patient_phone: '', test_name: '' });
            fetchData();
        } catch (error) {
            alert("Failed to book lab test.");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.createUser(newUserForm);
            setShowUserModal(false);
            setNewUserForm({ full_name: '', email: '', password: '', role: 'doctor', department: '', phone: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to create user.");
        }
    };

    const toggleUserStatus = async (id, currentStatus) => {
        try {
            await adminAPI.updateUserStatus(id, !currentStatus);
            fetchData();
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    const resetUserPassword = async (id) => {
        if (!window.confirm("Reset password to 'defaultpassword'?")) return;
        try {
            await adminAPI.resetUserPassword(id);
            alert("Password reset successfully.");
        } catch (error) {
            alert("Failed to reset password.");
        }
    };

    const toggleRolePermission = async (roleName, permissionKey, currentValue) => {
        const role = rolePermissions.find(r => r.role_name === roleName);
        if (!role) return;
        const updatedPerms = { ...role.permissions, [permissionKey]: !currentValue };
        try {
            await adminAPI.updateRolePermissions({ role_name: roleName, permissions: updatedPerms });
            fetchData();
        } catch (error) {
            alert("Failed to update permissions.");
        }
    };



    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
            {/* Global Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>

            {/* SIDEBAR */}
            <div className="w-72 bg-[#0a0f1d] border-r border-slate-800/50 text-white flex flex-col relative shadow-2xl z-20 overflow-y-auto overflow-x-hidden scrollbar-hide py-6">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10 px-6 flex-1">
                    <div
                        className="flex items-center gap-4 mb-6 px-2 cursor-pointer group"
                        onClick={() => setActiveTab('overview')}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 text-white group-hover:shadow-blue-500/40 transition-shadow">M</div>
                        <h1 className="font-black text-xl tracking-tight">MediCare<span className="text-blue-400 font-medium">Admin</span></h1>
                    </div>

                    {/* TOP LEVEL ACTION */}
                    <button onClick={onBack} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 mb-8 transition-colors w-full text-left text-slate-300 hover:text-white group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-blue-400" />
                        <span className="text-sm font-bold tracking-wide">Switch Portals</span>
                    </button>

                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Workspace</p>

                        {/* FULL ACCESS FOR ALL ADMIN LOGINS */}
                        <SidebarItem id="overview" Icon={Activity} label="Overview" count={0} visible={adminRole === 'admin'} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="doctor_dashboard" Icon={LayoutDashboard} label="Dashboard" count={0} visible={adminRole === 'doctor'} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="lab_dashboard" Icon={LayoutDashboard} label="Dashboard" count={0} visible={adminRole === 'lab' || adminRole === 'admin'} activeTab={activeTab} setActiveTab={setActiveTab} />

                        <SidebarItem id="analytics" Icon={BarChartIcon} label="Analytics" count={0} visible={adminRole === 'admin'} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="appointments" Icon={Calendar} label="Appointments" count={stats.doctors} visible={myPerms.manage_appointments} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="lab" Icon={List} label="Lab Queue" count={stats.lab} visible={myPerms.manage_lab} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="pharmacy" Icon={Pill} label="Pharmacy" count={stats.pharmacy} visible={myPerms.manage_pharmacy} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="inventory" Icon={Package} label="Inventory" count={stats.inventory} visible={myPerms.manage_inventory} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="billing" Icon={Receipt} label="Billing & Invoices" count={0} visible={adminRole === 'admin'} activeTab={activeTab} setActiveTab={setActiveTab} />

                        <div className="my-2 border-t border-slate-800/50"></div>
                        <SidebarItem id="users" Icon={Users} label="User Management" count={0} visible={myPerms.manage_users} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SidebarItem id="roles" Icon={Shield} label="Roles & Permissions" count={0} visible={myPerms.manage_roles || adminRole === 'admin'} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>

                <div className="mt-8 pt-6 px-6 border-t border-slate-800/50 relative z-10 flex-shrink-0">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/30">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System Health</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Appts</p>
                                <p className="text-xs font-black text-blue-400">{Array.isArray(appointments) ? appointments.length : 0}</p>
                            </div>
                            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Orders</p>
                                <p className="text-xs font-black text-emerald-400">{Array.isArray(orders) ? orders.length : 0}</p>
                            </div>
                            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Stock</p>
                                <p className="text-xs font-black text-purple-400">{Array.isArray(inventory) ? inventory.length : 0}</p>
                            </div>
                            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Docs</p>
                                <p className="text-xs font-black text-amber-400">{Array.isArray(allDoctors) ? allDoctors.length : 0}</p>
                            </div>
                            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/30">
                                <p className="text-[8px] text-slate-500 font-bold uppercase">DB</p>
                                <p className="text-[8px] font-black text-emerald-400 truncate">VERIFIED</p>
                            </div>
                        </div>

                        {/* BACKEND DIAGNOSTIC HUB */}
                        {backendDiag && (
                            <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                                <p className="text-[9px] font-black text-blue-400 uppercase mb-2">Live Backend Stats</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Appointments:</span>
                                        <span className="text-white font-bold">{backendDiag.counts?.appointments || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Users:</span>
                                        <span className="text-white font-bold">{backendDiag.counts?.users || 0}</span>
                                    </div>
                                    <p className="text-[8px] text-slate-500 mt-2 truncate italic">{backendDiag.database?.split('/').pop()}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={forceSync}
                            className="w-full mt-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold py-2 rounded-xl border border-blue-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={12} /> Force Data Sync
                        </button>
                    </div>
                </div>

                <div className="mt-6 border-t border-slate-800/50 pt-4 px-6 flex flex-col gap-2">
                    <button onClick={onLogout} className="flex items-center justify-center gap-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl px-3 py-3 transition-colors w-full text-center">
                        <LogOut size={16} />
                        <span className="text-sm font-bold">Secure Sign Out</span>
                    </button>
                </div>
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
                        {activeTab === 'users' && <><div className="p-2 bg-indigo-50 rounded-xl"><Users className="text-indigo-600" size={24} /></div> User Management</>}
                        {activeTab === 'roles' && <><div className="p-2 bg-slate-100 rounded-xl"><Shield className="text-slate-600" size={24} /></div> Roles & Permissions</>}
                        {activeTab === 'overview' && <><div className="p-2 bg-slate-100 rounded-xl"><LayoutDashboard className="text-slate-600" size={24} /></div> Overview</>}
                        {activeTab === 'doctor_dashboard' && <><div className="p-2 bg-indigo-50 rounded-xl"><Users className="text-indigo-600" size={24} /></div> Doctor Dashboard</>}
                    </h2>
                    <div className="flex items-center gap-4 relative">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800">{adminName}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full mt-1 border border-slate-200/60 inline-block">{adminRole === 'lab' ? 'Technician' : rawRole}</p>
                        </div>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 hover:scale-105 transition-transform cursor-pointer relative z-30"
                        >
                            {adminName.charAt(0).toUpperCase()}
                        </button>

                        {/* PROFILE DROPDOWN MENU */}
                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowProfileMenu(false)}></div>
                                <div className="absolute top-14 right-0 mt-2 w-48 bg-white border border-slate-100/60 rounded-2xl shadow-xl shadow-slate-200/50 z-30 overflow-hidden transform origin-top-right transition-all">
                                    <div className="p-4 border-b border-slate-50 sm:hidden">
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{adminName}</p>
                                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{adminRole === 'lab' ? 'Technician' : rawRole}</p>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* DASHBOARD CONTENT */}
                <div className={`flex-1 overflow-y-auto ${activeTab === 'doctor_dashboard' ? 'p-0 bg-slate-50/50' : 'p-10'} relative z-0 scroll-smooth`}>

                    {/* DOCTOR DASHBOARD TAB */}
                    {activeTab === 'doctor_dashboard' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex h-full min-h-[calc(100vh-5rem)]">

                            {/* MAIN COLUMN (LEFT) */}
                            <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar border-r border-slate-200/60 bg-white/30 backdrop-blur-sm">

                                {/* HERO SECTION (NEW Premium Style) */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        <span>Dashboard</span>
                                        <ChevronRight size={12} />
                                        <span className="text-blue-500">Doctor Overview</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome back, {adminName.toLowerCase().startsWith('dr.') ? adminName : `Dr.${adminName.split(' ')[0]} `}! 👋</h1>
                                            <p className="text-slate-500 font-medium">Here is your overview for today:</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/80 p-1.5 rounded-2xl border border-white shadow-sm">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold ring-1 ring-blue-500/10">
                                                <Calendar size={14} />
                                                <span>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                                                <ChevronRight size={20} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors bg-white rounded-lg shadow-sm">
                                                <Calendar size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* HORIZONTAL STATS GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* TODAY'S APPOINTMENTS */}
                                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                <Calendar size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 mb-0.5">Today's Appointments</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">2k people</p>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-black text-slate-800">{appointments.filter(a => new Date(a.appointment_time).toDateString() === new Date().toDateString()).length || 0}</div>
                                    </div>

                                    {/* LAB RESULTS */}
                                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                                <TestTube size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 mb-0.5">Lab Results</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Awaiting Review</p>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-black text-slate-800">{appointments.filter(a => a.type === 'lab_test' && a.status === 'processing').length || 0}</div>
                                    </div>

                                    {/* PRESCRIPTIONS */}
                                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                                <Pill size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 mb-0.5">Prescriptions</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Issued Today</p>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-black text-slate-800">8</div>
                                    </div>
                                </div>

                                {/* TODAY'S SCHEDULE SECTION */}
                                <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 p-8 space-y-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">Today's Schedule</h3>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Consultations</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                            {/* SEARCH BAR */}
                                            <div className="relative w-full sm:w-64 group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Search patients..."
                                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all placeholder:text-slate-400"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TABS (Schedule filter) */}
                                    <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-max">
                                        {[
                                            { id: 'today', label: "Today's Schedule" },
                                            { id: 'upcoming', label: "Upcoming" },
                                            { id: 'past', label: "Past Visits" }].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setScheduleTab(tab.id)}
                                                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${scheduleTab === tab.id ? 'bg-white text-blue-600 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                    </div>

                                    {/* TABLE HEADER */}
                                    <div className="grid grid-cols-[100px_1fr_120px_1fr] px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
                                        <div>Time</div>
                                        <div>Patient Name</div>
                                        <div>Status</div>
                                        <div className="text-right pr-4">Actions</div>
                                    </div>

                                    {/* SCHEDULE LIST */}
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {appointments
                                            .filter(a => a.patient_name !== 'Main Admin') // Filter out mock admin data
                                            .filter(a => {
                                                const apptDate = new Date(a.appointment_time);
                                                const today = new Date();
                                                if (scheduleTab === 'today') return apptDate.toDateString() === today.toDateString();
                                                if (scheduleTab === 'upcoming') {
                                                    // Set time to 0 to compare dates only, or keep it to include future times today
                                                    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
                                                    return apptDate > new Date(); // Truly in the future
                                                }
                                                if (scheduleTab === 'past') return apptDate < new Date().setHours(0, 0, 0, 0);
                                                return true;
                                            })
                                            .filter(a => a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((appt, idx) => {
                                                const time = new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                return (
                                                    <div key={idx} className="grid grid-cols-[100px_1fr_120px_1fr] items-center px-6 py-5 bg-white rounded-3xl border border-slate-100/60 hover:shadow-xl hover:shadow-slate-100/80 transition-all group">
                                                        <div className="text-sm font-black text-slate-800">{time}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-black text-slate-800">{appt.patient_name}</p>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase">#10{idx + 7}</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{appt.patient_phone || 'No Phone Number'}</p>
                                                        </div>
                                                        <div>
                                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${appt.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                                                                appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                                } `}>
                                                                {appt.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            {appt.status !== 'completed' ? (
                                                                <button onClick={() => setSelectedAppt(appt)} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                                                                    Start Consultation
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => setSelectedAppt(appt)} className="text-slate-400 hover:text-slate-600 text-[11px] font-black px-4 py-2.5 flex items-center gap-2 transition-all">
                                                                    View Details <ChevronRight size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {appointments.length === 0 && (
                                            <div className="py-20 text-center space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                                                    <Calendar size={32} />
                                                </div>
                                                <p className="text-slate-400 font-bold tracking-tight">No appointments found for this filter.</p>
                                            </div>
                                        )}
                                    </div>
                                    <button className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                        <Plus size={14} /> View All Records
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT SIDEBAR */}
                            <div className="w-[380px] bg-slate-50/10 p-8 space-y-10 overflow-y-auto custom-scrollbar border-l border-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">

                                {/* PATIENT FOLLOW UPS */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Patient Follow-Ups</h3>
                                        <button className="text-slate-400 hover:text-blue-500 transition-colors">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { id: 1005, icon: <ArrowUpRight />, color: "bg-emerald-50 text-emerald-600", title: "Review lab results for Alok Sharma", sub: "#1005", time: "15 mins ago", patient_name: "Alok Sharma" },
                                            { id: 1010, icon: <MessageSquare />, color: "bg-blue-50 text-blue-600", title: "Prescribe medication for Emma Wilson", sub: "#1010", time: "30 mins ago", patient_name: "Emma Wilson" },
                                            { id: 1013, icon: <Clock />, color: "bg-indigo-50 text-indigo-600", title: "Call back Daniel Jones for follow-up", sub: "#1013", time: "1 hr ago", patient_name: "Daniel Jones" }].map((item, i) => (
                                                <div key={i} onClick={() => setSelectedAppt({ id: item.id, patient_name: item.patient_name, status: 'pending', type: 'consultation', patient_phone: '+91 99999 88888' })} className="flex gap-4 group cursor-pointer hover:bg-white p-2 rounded-2xl transition-all">
                                                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-black text-slate-800 truncate leading-snug">{item.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-slate-400 font-bold">{item.sub}</span>
                                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                                            <span className="text-[10px] text-slate-400 font-bold">{item.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <button className="w-full py-3.5 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-400 hover:text-blue-500 hover:border-blue-500/20 shadow-sm transition-all flex items-center justify-center gap-2">
                                        View All <ChevronRight size={14} />
                                    </button>
                                </div>

                                {/* NOTIFICATIONS SECTION */}
                                <div className="space-y-6 pt-4 border-t border-slate-200/40">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Notifications</h3>
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-rose-500/60 rounded-full animate-bounce delay-100"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { icon: <Activity size={16} />, color: "bg-purple-100 text-purple-600", text: "New lab result available for Vikram Lal. Go to Lab Results for review.", time: "15 mins ago", tab: 'lab' },
                                            { icon: <Clock size={16} />, color: "bg-amber-100 text-amber-600", text: "John Doe's appointment is waiting (#1014) in Schedule.", time: "30 mins ago", tab: 'doctor_dashboard' },
                                            { icon: <CheckCircle2 size={16} />, color: "bg-blue-100 text-blue-600", text: "Rahul Mehta appointment completed. Update patient record.", time: "1 hr ago", tab: 'doctor_dashboard' }].map((note, i) => (
                                                <div key={i} onClick={() => setActiveTab(note.tab)} className="flex gap-4 p-4 hover:bg-white rounded-3xl transition-colors group cursor-pointer">
                                                    <div className={`w-10 h-10 ${note.color} rounded-xl shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                        {note.icon}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{note.text}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{note.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    )}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8 pb-10">

                            {/* PROJECT ECOSYSTEM SNAPSHOT */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl flex items-center justify-between shadow-sm group hover:bg-white/60 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Portal</p>
                                            <p className="text-xs font-bold text-slate-700">user-portal:5173</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-green-100/50 px-2 py-1 rounded-full border border-green-200/50">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-green-600 uppercase">Online</span>
                                    </div>
                                </div>
                                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl flex items-center justify-between shadow-sm group hover:bg-white/60 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Truck size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pharmacy Store</p>
                                            <p className="text-xs font-bold text-slate-700">store-portal:5173</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-green-100/50 px-2 py-1 rounded-full border border-green-200/50">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-green-600 uppercase">Online</span>
                                    </div>
                                </div>
                                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-2xl flex items-center justify-between shadow-sm group hover:bg-white/60 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <RefreshCw size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Backend</p>
                                            <p className="text-xs font-bold text-slate-700">api-server:8000</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-green-100/50 px-2 py-1 rounded-full border border-green-200/50">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-green-600 uppercase">Healthy</span>
                                    </div>
                                </div>
                            </div>

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
                        </Motion.div>
                    )}
                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8 pb-10">

                            {/* KPI CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Revenue', value: '₹32,100', trend: '+14%', color: 'blue' },
                                    { label: 'Patient Footfall', value: '1,980', trend: '+8%', color: 'purple' },
                                    { label: 'Lab Tests Done', value: '430', trend: '+22%', color: 'emerald' },
                                    { label: 'Pharmacy Sales', value: '890', trend: '-3%', color: 'rose' }].map((kpi, i) => (
                                        <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform cursor-default">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} `}>{kpi.trend}</span>
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
                                                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
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
                        </Motion.div>
                    )}
                    {/* OVERVIEW-RECENT ACTIVITY SUMMARY */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                                {/* LAB REPORTS HIGHLIGHTS */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden flex flex-col group/card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                                    <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/50">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg"><div className="bg-white p-1.5 shadow-sm border border-slate-100 rounded-lg"><TestTube size={18} className="text-purple-600" /></div> Latest Lab Results</h3>
                                        <button onClick={() => setActiveTab('lab')} className="text-xs font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-full hover:bg-purple-600 hover:text-white transition-colors">Open Lab Queue</button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {appointments.filter(a => a.type === 'lab_test' && a.status === 'ready').slice(0, 5).map(lab => (
                                            <div key={lab.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-all group/row">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover/row:scale-110 transition-transform">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-sm">{lab.doctor_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Patient #{lab.patient_id} • {lab.lab_result?.substring(0, 30)}...</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">Validated</span>
                                                </div>
                                            </div>
                                        ))}
                                        {appointments.filter(a => a.type === 'lab_test' && a.status === 'ready').length === 0 && (
                                            <div className="p-8 text-center text-slate-400 text-sm">No verified results yet.</div>
                                        )}
                                    </div>
                                </div>

                                {/* INVENTORY ALERTS */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden flex flex-col group/card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                                    <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/50">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg"><div className="bg-white p-1.5 shadow-sm border border-slate-100 rounded-lg"><Package size={18} className="text-rose-500" /></div> Inventory Criticals</h3>
                                        <button onClick={() => setActiveTab('inventory')} className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-500 hover:text-white transition-colors">Manage Stock</button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {inventory.filter(item => (item.stock || 0) < 15).slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 overflow-hidden border border-rose-100/40 shadow-sm">
                                                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Category: {item.category || 'General'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-rose-600">{item.stock} left</p>
                                                    <p className="text-[10px] text-slate-300 uppercase font-black tracking-tighter">Low stock</p>
                                                </div>
                                            </div>
                                        ))}
                                        {inventory.filter(item => (item.stock || 0) < 15).length === 0 && (
                                            <div className="p-8 text-center text-slate-400 text-sm">Inventory levels healthy.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RECENT TRANSACTIONS LEDGER SNAPSHOT */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden flex flex-col group/card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                                <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg"><div className="bg-white p-1.5 shadow-sm border border-slate-100 rounded-lg"><Receipt size={18} className="text-emerald-500" /></div> Recent Transactions</h3>
                                    <button onClick={() => setActiveTab('billing')} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-600 hover:text-white transition-colors">View All Ledger</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Invoice ID</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Patient</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {mockBillingData.slice(0, 4).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4"><p className="text-xs font-bold text-slate-800 tracking-tight">{item.id}</p></td>
                                                    <td className="p-4"><p className="text-xs font-medium text-slate-600">{item.patientName}</p></td>
                                                    <td className="p-4"><p className="text-xs font-black text-slate-800">₹{item.amount}</p></td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tight ${item.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                                                            item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                            } `}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BILLING & INVOICING TAB */}
                    {activeTab === 'billing' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-8 pb-10">

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
                                            <tr key={txn.id} className="hover:bg-white cursor-pointer group transition-colors">
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
                                                        } `}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Motion.div>
                    )}
                    {/* DOCTOR VIEW: WEEKLY CALENDAR SCHEDULE */}
                    {activeTab === 'appointments' && (
                        <AppointmentsCalendar
                            appointments={appointments}
                            doctors={allDoctors}
                            setSelectedAppt={setSelectedAppt}
                            onRefresh={fetchData}
                        />
                    )}
                    {/* LAB DASHBOARD (OVERVIEW) */}
                    {activeTab === 'lab_dashboard' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex h-full min-h-[calc(100vh-5rem)]">
                            {/* MAIN COLUMN (LEFT) */}
                            <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar border-r border-slate-200/60 bg-white/30 backdrop-blur-sm">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        <span>Workspace</span>
                                        <ChevronRight size={12} />
                                        <span className="text-blue-500">Lab Overview</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                        Welcome back, Lab! 👋
                                    </h2>
                                    <p className="text-slate-500 font-medium">Here's a quick overview of the lab activity that requires your attention.</p>
                                </div>

                                {/* KPI CARDS (Premium Style) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: "New Lab Requests", value: "1", sub: "30 ops", color: "from-blue-500 to-blue-600", icon: <TestTube size={24} />, sparkline: true },
                                        { label: "Pending Results", value: "1", sub: "25+ items", color: "from-purple-500 to-indigo-600", icon: <Clock size={24} /> },
                                        { label: "Completed Today", value: "1", sub: "Goal: 30", color: "from-emerald-500 to-teal-600", icon: <CheckCircle2 size={24} /> }
                                    ].map((card, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 group hover:scale-[1.02] transition-all duration-300 flex items-center gap-5">
                                            <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                                                {card.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                                                <div className="flex items-baseline gap-2">
                                                    <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{card.value}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400">{card.sub}</span>
                                                </div>
                                            </div>
                                            {card.sparkline && (
                                                <div className="w-16 h-8 text-blue-500/20">
                                                    <svg viewBox="0 0 100 40" className="w-full h-full stroke-current fill-none stroke-[3]">
                                                        <path d="M0,35 Q20,5 40,30 T80,10 T100,5" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* SAMPLES SUMMARY CHART */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Samples Summary</h3>
                                            <button className="text-slate-400 hover:text-blue-500"><MoreHorizontal size={20} /></button>
                                        </div>
                                        <div className="h-[240px] relative flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={[{ name: 'New', value: 1 }, { name: 'Processing', value: 1 }, { name: 'Ready', value: 1 }]} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                                                        <Cell fill="#3b82f6" />
                                                        <Cell fill="#a855f7" />
                                                        <Cell fill="#10b981" />
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-4xl font-black text-slate-800">3</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TEST UPDATES */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Test Updates</h3>
                                            <button className="text-slate-400 hover:text-blue-500"><MoreHorizontal size={20} /></button>
                                        </div>
                                        <div className="space-y-5">
                                            {[
                                                { patient: 'RAHUL MEHTA', id: '#1012', desc: 'Thyroid Function Test is awaiting review.', status: 'Reviewing', color: 'orange' },
                                                { patient: 'JOHN DOE', id: '#1009', desc: 'Liver Function Test is awaiting review.', status: 'Reviewing', color: 'blue' },
                                                { patient: 'SARAH WILLIAMS', id: '#1003', desc: 'Complete Blood Count Test is completed.', status: 'Completed', color: 'emerald' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-4 group cursor-pointer">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors`}>
                                                        {item.patient[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-800 tracking-wide">{item.patient}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">{item.id}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    )}

                    {/* LAB VIEW: TEST QUEUE */}
                    {activeTab === 'lab' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-10 space-y-8">
                            <div className="flex justify-between items-end">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <TestTube size={16} />
                                        </div>
                                        <span>Lab Test Queue</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Welcome back, Lab! 👋</h2>
                                        <p className="text-slate-500 font-medium">Here's a quick overview of the lab activity that requires your attention.</p>
                                    </div>
                                </div>
                                <div className="bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-white/60 shadow-sm flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Date</p>
                                        <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                        <Calendar size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* QUEUE TABLE CONTAINER */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-8">
                                    <div className="flex items-center gap-8">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Lab Queue</h3>
                                        <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                                            {['ALL REQUESTS', 'NEW REQUESTS', 'IN PROGRESS'].map(tab => (
                                                <button key={tab} className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${tab === 'ALL REQUESTS' ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 max-w-sm relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input type="text" placeholder="Quick Search..." className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all" />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient & Age</th>
                                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Type</th>
                                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payment</th>
                                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {appointments.filter(a => a.type === 'lab_test').map((test, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-800">{test.patient_name} <span className="text-slate-300 font-bold text-[11px]">({test.patient_age} Yrs)</span></span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">ID: #{test.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                                <TestTube size={16} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700">{test.lab_test_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${test.payment_status === 'pending' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                            {test.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6 text-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${test.status === 'new' ? 'bg-amber-50 text-amber-500 border border-amber-100' : test.status === 'processing' ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                            {test.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <button onClick={() => setSelectedAppt(test)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${test.status === 'new' ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
                                                            {test.status === 'new' ? 'Start Test' : 'Finalize'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Motion.div>
                    )}

                    {/* PHARMACY VIEW */}
                    {activeTab === 'pharmacy' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">

                            {/* PHARMACY HERO BANNER */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex justify-between items-center group">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

                                <div className="relative z-10 space-y-4">
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest">
                                        <Pill size={14} /> Pharmacy Hub
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tight leading-tight">
                                        Welcome, Pharmacist {adminName.split(' ')[0]}! 💊
                                    </h2>
                                    <p className="text-emerald-100/80 font-medium text-lg max-w-xl">
                                        Fulfilling prescriptions and managing medical supplies with precision.
                                        There are <span className="text-white font-black underline decoration-2 underline-offset-4">{orders.filter(o => o.status === 'processing' || o.status === 'pending').length} tasks</span> requiring your attention.
                                    </p>
                                </div>
                                <div className="relative z-10 hidden xl:flex gap-4">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] shadow-xl text-center min-w-[120px]">
                                        <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1">Queue Size</p>
                                        <p className="text-3xl font-black tracking-tight">{orders.length}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] shadow-xl text-center min-w-[120px]">
                                        <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1">In Process</p>
                                        <p className="text-3xl font-black tracking-tight text-emerald-300">{orders.filter(o => o.status === 'processing' || o.status === 'preparing').length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ORDERS GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                                {orders.map((order, idx) => (
                                    <Motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-8 flex flex-col justify-between hover:-translate-y-2 hover:shadow-blue-500/10 transition-all duration-300 relative group overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Pill size={80} className="rotate-12" />
                                        </div>

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div>
                                                <h3 className="font-black text-slate-800 text-xl tracking-tight mb-1">Order #{order.id}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                        {order.patient_name[0]}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{order.patient_name}</p>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${order.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                order.status === 'delivered' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-amber-50 text-amber-500 border-amber-100'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-xs font-mono text-slate-600 overflow-y-auto border border-slate-100/60 shadow-inner group-hover:bg-slate-100/50 transition-colors">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <FileText size={12} /> Prescription Details
                                            </p>
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                {order.extracted_data || "No prescription data attached."}
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleStatus('prescription', order.id, 'ready')}
                                                className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Check size={14} /> Ready for Pickup
                                            </button>
                                            <button
                                                onClick={() => handleStatus('prescription', order.id, 'delivered')}
                                                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Truck size={14} /> Dispatched
                                            </button>
                                        </div>
                                    </Motion.div>
                                ))}
                                {orders.length === 0 && (
                                    <div className="col-span-1 lg:col-span-2 py-24 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                            <MoreHorizontal size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Queue is Empty</h3>
                                            <p className="text-slate-400 font-medium">No pharmacy orders are waiting for fulfillment.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Motion.div>
                    )}

                    {/* INVENTORY VIEW */}
                    {activeTab === 'inventory' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">

                            {/* INVENTORY HEADER & KPIs */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        <Package size={14} />
                                        <span>Logistics & Supplies</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Product Inventory</h2>
                                    <p className="text-slate-500 font-medium text-sm">Real-time stock monitoring and procurement management.</p>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                    {[
                                        { label: "Total Items", value: inventory.length, icon: <Package size={14} />, color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Low Stock", value: inventory.filter(i => i.stock < 20).length, icon: <AlertTriangle size={14} />, color: "bg-amber-50 text-amber-600" },
                                        { label: "Expiring soon", value: inventory.filter(i => new Date(i.expiryDate) < new Date(Date.now() + 90 * 86400000)).length, icon: <Clock size={14} />, color: "bg-rose-50 text-rose-600" }
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-[140px]">
                                            <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                                                {stat.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                                <p className="text-lg font-black text-slate-800 leading-none">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* INVENTORY TABLE CONTAINER */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-8 bg-slate-50/30">
                                    <div className="flex-1 max-w-md relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input type="text" placeholder="Search by name, brand or category..." className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"><Printer size={18} /></button>
                                        <button className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-2">
                                            <Plus size={16} /> Add Product
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Availability</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expiry</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {inventory.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer" onClick={() => setSelectedInventory(item)}>
                                                    <td className="px-8 py-6 flex items-center gap-5">
                                                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform group-hover:shadow-md">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black text-slate-800 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{item.brand}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200/60 mb-1.5 inline-block">
                                                            {item.category}
                                                        </span>
                                                        <p className="text-[11px] text-slate-400 font-medium px-1">{item.subCategory}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-800">₹{Number(item?.price || 0).toLocaleString()}</span>
                                                            {Number(item?.originalPrice || 0) > Number(item?.price || 0) && (
                                                                <span className="text-[10px] text-slate-400 font-bold line-through">MRP: ₹{Number(item?.originalPrice || 0).toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${item.stock > 50 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100' :
                                                            item.stock > 20 ? 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100' :
                                                                'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100 animate-pulse'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${item.stock > 50 ? 'bg-emerald-500' :
                                                                item.stock > 20 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`} />
                                                            {item.stock} Units
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-slate-600 tracking-tight">
                                                                {item?.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Exp. Date</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {inventory.length === 0 && (
                                    <div className="p-24 text-center space-y-4 bg-slate-50/50">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-slate-300">
                                            <Package size={24} />
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm">No products found in the database.</p>
                                    </div>
                                )}
                            </div>
                        </Motion.div>
                    )}

                    {/* USER MANAGEMENT VIEW */}
                    {activeTab === 'users' && (
                        <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">

                            {/* USER MANAGEMENT HEADER & KPIs */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        <Users size={14} />
                                        <span>Identity & Access</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Staff Management</h2>
                                    <p className="text-slate-500 font-medium text-sm">Control administrative access and manage hospital personnel.</p>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                    {[
                                        { label: "Total Staff", value: staffUsers.length, icon: <Users size={14} />, color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Doctors", value: staffUsers.filter(u => u.role === 'doctor').length, icon: <Briefcase size={14} />, color: "bg-blue-50 text-blue-600" },
                                        { label: "Active Now", value: staffUsers.filter(u => u.is_active).length, icon: <CheckCircle2 size={14} />, color: "bg-emerald-50 text-emerald-600" }
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-[140px]">
                                            <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                                                {stat.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                                <p className="text-lg font-black text-slate-800 leading-none">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* STAFF TABLE CONTAINER */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50/30">
                                    <div className="flex bg-white p-1.5 rounded-[1.25rem] border border-slate-200 shadow-sm gap-1 w-full md:w-auto overflow-x-auto">
                                        {['all', 'doctor', 'admin', 'pharmacist', 'lab'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setActiveRoleTab(r)}
                                                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeRoleTab === r ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {r === 'all' ? 'All Personnel' : `${r}s`}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowUserModal(true)}
                                        className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-2 w-full md:w-auto justify-center"
                                    >
                                        <Plus size={16} /> Register New Staff
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Information</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Department</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contact</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Access Controls</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {staffUsers.filter(u => activeRoleTab === 'all' || u.role === activeRoleTab).map((user, idx) => (
                                                <tr key={user.id} className="hover:bg-slate-50/80 transition-all group">
                                                    <td className="px-8 py-6 flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-xs shadow-sm group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white transition-all">
                                                            {user.full_name[0]}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black text-slate-800 text-sm tracking-tight">{user.full_name}</p>
                                                            <p className="text-[11px] text-slate-400 font-medium">#{user.id} • {user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                user.role === 'doctor' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    user.role === 'pharmacist' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                        'bg-purple-50 text-purple-600 border-purple-100'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                        {user.department && <p className="text-[11px] text-slate-400 font-bold mt-1.5 tracking-wide">{user.department}</p>}
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <p className="text-xs font-bold text-slate-600 tracking-tight">{user.phone || 'N/A'}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                            }`}>
                                                            <div className={`w-1 h-1 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                            {user.is_active ? 'Active' : 'Revoked'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                                className={`p-2 rounded-xl transition-all active:scale-95 ${user.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                                title={user.is_active ? 'Revoke Access' : 'Grant Access'}
                                                            >
                                                                {user.is_active ? <Shield size={16} /> : <CheckCircle2 size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => resetUserPassword(user.id)}
                                                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all active:scale-95"
                                                                title="Reset Credentials"
                                                            >
                                                                <RefreshCw size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {staffUsers.filter(u => activeRoleTab === 'all' || u.role === activeRoleTab).length === 0 && (
                                    <div className="p-24 text-center space-y-4 bg-slate-50/10">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-slate-200">
                                            <Users size={24} />
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">No records found for this role query.</p>
                                    </div>
                                )}
                            </div>
                        </Motion.div>
                    )}

                    {/* ROLES & PERMISSIONS VIEW */}
                    {
                        activeTab === 'roles' && (
                            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="bg-white p-6 justify-between items-center rounded-3xl shadow-sm border border-slate-100">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Role-Based Access Control</h3>
                                        <p className="text-sm text-slate-500">Configure what modules each role can access.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {rolePermissions.map((rp) => (
                                        <div key={rp.role_name} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg capitalize">{rp.role_name} Role</h4>
                                                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Module Permissions</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries({
                                                    "manage_users": "Users & Roles Management",
                                                    "manage_appointments": "Appointments & Consults",
                                                    "manage_lab": "Laboratory Queue",
                                                    "manage_pharmacy": "Pharmacy Dashboard",
                                                    "manage_inventory": "Inventory Controls"
                                                }).map(([key, label]) => (
                                                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold text-slate-700">{label}</span>
                                                        <button
                                                            onClick={() => toggleRolePermission(rp.role_name, key, rp.permissions[key])}
                                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease -in -out relative ${rp.permissions[key] ? 'bg-green-500' : 'bg-slate-300'} `}
                                                        >
                                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${rp.permissions[key] ? 'translate-x-6' : 'translate-x-0'} `} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {rolePermissions.length === 0 && <div className="col-span-2 p-16 text-center text-slate-400 font-medium">No role permissions defined.</div>}
                                </div>
                            </Motion.div>
                        )
                    }


                </div >
            </div >

            {/* ROBUST MANAGEMENT MODAL */}
            < AnimatePresence >
                {selectedAppt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5">

                            {/* MODAL HEADER */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{selectedAppt.type === 'lab_test' ? 'Manage Lab Request' : 'Manage Appointment'}</h3>
                                    <p className="text-xs text-slate-500">ID #{selectedAppt.id} • {selectedAppt.patient_name} - {selectedAppt.patient_phone || 'No Phone'}</p>
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
                                    <div className="space-y-3">
                                        {(selectedAppt.status === 'pending' || selectedAppt.status === 'confirmed') && (
                                            <button onClick={() => handleStatus('appointment', selectedAppt.id, 'in_progress')} className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 border border-blue-200 transition-colors">
                                                <span>Start Consultation</span>
                                                <ArrowUpRight size={18} />
                                            </button>
                                        )}
                                        {selectedAppt.status === 'in_progress' && (
                                            <button onClick={() => handleStatus('appointment', selectedAppt.id, 'completed')} className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 border border-emerald-200 transition-colors">
                                                <span>Complete Consultation</span>
                                                <Check size={18} />
                                            </button>
                                        )}
                                        {selectedAppt.status === 'pending' && (
                                            <button onClick={() => handleStatus('appointment', selectedAppt.id, 'confirmed')} className="w-full flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 border border-slate-200 transition-colors">
                                                <span>Confirm Booking</span>
                                                <Check size={18} />
                                            </button>
                                        )}
                                    </div>
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
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* INVENTORY MANAGEMENT MODAL */}
            < AnimatePresence >
                {selectedInventory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5">

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
                                        <p className={`text-2xl font-black ${selectedInventory.stock > 20 ? 'text-green-600' : 'text-red-500'} `}>{selectedInventory.stock} <span className="text-sm font-bold opacity-70">Units</span></p>
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
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* LAB BOOKING MODAL */}
            < AnimatePresence >
                {showLabBookingModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800">New Lab Request</h3>
                                <button onClick={() => setShowLabBookingModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleLabBookSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Patient Full Name</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500" placeholder="e.g. John Doe" value={labBookingData.patient_name} onChange={e => setLabBookingData({ ...labBookingData, patient_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500" placeholder="e.g. 9876543210" value={labBookingData.patient_phone} onChange={e => setLabBookingData({ ...labBookingData, patient_phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Test Name</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500" placeholder="e.g. CBC, Lipid Profile" value={labBookingData.test_name} onChange={e => setLabBookingData({ ...labBookingData, test_name: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 shadow-xl shadow-purple-500/20 transition-all mt-4">
                                    Book Lab Test
                                </button>
                            </form>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* USER CREATION MODAL */}
            < AnimatePresence >
                {showUserModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600" /> Create System User</h3>
                                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                                        <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={newUserForm.full_name} onChange={e => setNewUserForm({ ...newUserForm, full_name: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                                        <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                                        <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700" value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}>
                                            <option value="doctor">Doctor</option>
                                            <option value="lab">Lab Technician</option>
                                            <option value="pharmacist">Pharmacist</option>
                                            <option value="admin">Super Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone</label>
                                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={newUserForm.phone} onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })} />
                                    </div>
                                    {newUserForm.role === 'doctor' && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                                            <input required type="text" placeholder="e.g. Cardiology" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={newUserForm.department} onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })} />
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Temporary Password</label>
                                        <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" placeholder="Must be changed on login" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all mt-6">
                                    Register User
                                </button>
                            </form>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence >

        </div >
    );
};

export default Dashboard;