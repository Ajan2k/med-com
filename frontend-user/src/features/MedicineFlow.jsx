import { useState, useEffect } from 'react';
import {
    FileText, ShoppingCart, Truck, CreditCard, Download,
    Bell, Pill, ChevronRight, ArrowLeft, Clock,
    CheckCircle2, Package, MapPin, AlertCircle
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { patientAPI } from '../services/api';
import { pharmacyApi } from '../pharmacy/pharmacyApi';

const mockAlerts = [
    { id: 1, name: 'Atorvastatin 20mg', daysLeft: 4, message: 'Running low. Refill recommended soon.', urgency: 'high' },
    { id: 2, name: 'Metformin 500mg', daysLeft: 10, message: 'Stock adequate for next week.', urgency: 'medium' },
];

// Minimal base64 1-page PDF string (A blank page) to simulate a real file download
const dummyPdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+Cj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwgL0xlbmd0aCA1MSA+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjAgMCAwIHJnCjEwIDEwMCBUZAooTWVkaWNhcmUrIER1bW15IEludm9pY2UpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDc5IDAwMDAwIG4gCjAwMDAwMDAxNzMgMDAwMDAgbiAKMDAwMDAwMDMwMSAwMDAwMCBuIAowMDAwMDAwMzk2IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ5OQolJUVPRgo=";

const MedicineFlow = ({ onBack, onNavigatePortal }) => {
    const [view, setView] = useState('grid'); // 'grid', 'prescriptions', 'orders', 'payments', 'bills', 'alerts'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // MOCK PDF DOWNLOAD HANDLER
    const handleDownloadPDF = (invoiceId) => {
        const byteCharacters = atob(dummyPdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (view === 'prescriptions') {
            fetchPrescriptions();
        } else if (view === 'orders' || view === 'payments' || view === 'bills') {
            fetchOrders();
        } else if (view === 'alerts') {
            setData(mockAlerts);
        } else {
            setData([]);
        }
    }, [view]);

    const fetchPrescriptions = async () => {
        if (!user.id) return;
        setLoading(true);
        try {
            const res = await patientAPI.getMyPrescriptions(user.id);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch prescriptions", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        if (!user.id) return;
        setLoading(true);
        try {
            const res = await pharmacyApi.getOrders(user.id);
            setData(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const dashboardItems = [
        {
            id: 'prescriptions',
            icon: FileText,
            label: "My Prescriptions",
            color: "text-blue-600",
            bg: "bg-blue-50",
            desc: "View and manage your active medical prescriptions.",
            action: () => setView('prescriptions')
        },
        {
            id: 'order',
            icon: Pill,
            label: "Order Medicines",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            desc: "Browse our store and order medications directly.",
            action: () => onNavigatePortal && onNavigatePortal('pharmacy')
        },
        {
            id: 'track',
            icon: Truck,
            label: "Track Orders",
            color: "text-amber-600",
            bg: "bg-amber-50",
            desc: "Check the real-time status of your medicine deliveries.",
            action: () => setView('orders')
        },
        {
            id: 'payments',
            icon: CreditCard,
            label: "Payment History",
            color: "text-purple-600",
            bg: "bg-purple-50",
            desc: "Review your past pharmacy bills and transactions.",
            action: () => setView('payments')
        },
        {
            id: 'bills',
            icon: Download,
            label: "Download Bills",
            color: "text-rose-600",
            bg: "bg-rose-50",
            desc: "Get digital copies of your invoices for insurance.",
            action: () => setView('bills')
        },
        {
            id: 'alerts',
            icon: Bell,
            label: "Refill Alerts",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            desc: "Get notified when it's time to refill your medications.",
            action: () => setView('alerts')
        }
    ];

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'bg-emerald-50 text-emerald-600';
            case 'ready': return 'bg-blue-50 text-blue-600';
            case 'preparing': return 'bg-amber-50 text-amber-600';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-6">
            <AnimatePresence mode="wait">
                {view === 'grid' ? (
                    <Motion.div
                        key="grid"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                        <Pill size={28} />
                                    </div>
                                    Pharmacy Dashboard
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">Manage your medications, orders, and health records in one place.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dashboardItems.map((item, index) => (
                                <Motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={item.action || (() => alert(`${item.label} feature integration in progress!`))}
                                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-left hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden"
                                >
                                    <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                        <item.icon size={28} />
                                    </div>
                                    <h4 className="font-extrabold text-slate-900 text-xl">{item.label}</h4>
                                    <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed">{item.desc}</p>

                                    <div className="mt-6 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-emerald-500 transition-colors">Access Feature</span>
                                        <ChevronRight size={18} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Motion.button>
                            ))}
                        </div>
                    </Motion.div>
                ) : (
                    <Motion.div
                        key="view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
                            <button
                                onClick={() => setView('grid')}
                                className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-slate-100"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {view === 'prescriptions' && 'My Prescriptions'}
                                {view === 'orders' && 'Track Orders'}
                                {view === 'payments' && 'Payment History'}
                                {view === 'bills' && 'Download Bills'}
                                {view === 'alerts' && 'Refill Alerts'}
                            </h3>
                        </div>

                        <div className="p-8 min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing with Pharmacy Vault...</p>
                                </div>
                            ) : data.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <AlertCircle size={40} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-lg">No records found in this category.</p>
                                    <button onClick={() => setView('grid')} className="mt-6 text-emerald-600 font-black text-xs uppercase tracking-widest">Back to Dashboard</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(view === 'prescriptions' || view === 'orders') && data.map((item) => (
                                        <div key={item.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                                        {view === 'orders' ? <Package size={28} /> : <FileText size={28} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-lg">
                                                            {view === 'orders' ? `Order #${item.id}` : `Prescription #${item.id.toString().padStart(4, '0')}`}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5"><Clock size={12} /> {new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.status || 'processing')}`}>
                                                                {item.status || 'processing'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {view === 'orders' && (
                                                        <div className="flex -space-x-2 mr-4">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${item.status === 'delivered' ? 'bg-emerald-500' :
                                                                    item.status === 'ready' && i <= 2 ? 'bg-blue-500' :
                                                                        i === 1 ? 'bg-amber-500' : 'bg-slate-200'
                                                                    } text-white transition-colors`}>
                                                                    {item.status === 'delivered' ? <CheckCircle2 size={12} /> : i}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <button className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                                                        {view === 'orders' ? 'Track Live' : 'View Details'}
                                                    </button>
                                                </div>
                                            </div>
                                            {view === 'prescriptions' && item.extracted_data && (
                                                <div className="mt-6 pt-6 border-t border-slate-100">
                                                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-3">Extracted Medication List</p>
                                                    <div className="bg-white p-4 rounded-2xl text-xs font-medium text-slate-600 italic leading-relaxed border border-slate-100">
                                                        {typeof item.extracted_data === 'string' ? item.extracted_data : JSON.stringify(item.extracted_data)}
                                                    </div>
                                                </div>
                                            )}
                                            {view === 'orders' && item.items && (
                                                <div className="mt-6 pt-6 border-t border-slate-100">
                                                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-3">Order Items</p>
                                                    <div className="bg-white p-4 rounded-2xl text-sm font-medium text-slate-600 border border-slate-100">
                                                        {item.items.map((i, idx) => (
                                                            <div key={idx} className="flex justify-between py-1 border-b border-slate-50 last:border-0 items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                                                                        <img src={i.image || 'https://placehold.co/100'} alt="item" className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span>{i.quantity}x {i.baseName || i.name || i.product_name}</span>
                                                                </div>
                                                                <span className="font-bold text-slate-800">₹{(i.price * i.quantity).toFixed(0)}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between pt-3 mt-3 border-t border-slate-100 font-black text-slate-900">
                                                            <span>Total</span>
                                                            <span>₹{item.total_amount?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {view === 'payments' && data.map((item) => (
                                        <div key={item.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex justify-between items-center hover:border-purple-200 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                                                    <CreditCard size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg">Order {item.id}</h4>
                                                    <p className="text-xs text-slate-400 font-medium">{new Date(item.created_at || Date.now()).toLocaleDateString()} &bull; {item.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="text-right">
                                                    <h4 className="font-black text-slate-900 text-lg">₹{(item.total_amount || 0).toLocaleString()}</h4>
                                                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">{item.status || 'Completed'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {view === 'bills' && data.map((item) => (
                                        <div key={item.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex justify-between items-center hover:border-rose-200 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                                                    <FileText size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg">Pharmacy Order</h4>
                                                    <p className="text-xs text-slate-400 font-medium">{new Date(item.created_at || Date.now()).toLocaleDateString()} &bull; Invoice #{item.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <h4 className="font-black text-slate-900 text-lg mr-2">₹{(item.total_amount || 0).toLocaleString()}</h4>
                                                <button
                                                    onClick={() => handleDownloadPDF(item.id)}
                                                    className="bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    <Download size={16} /> Download PDF
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {view === 'alerts' && data.map((item) => (
                                        <div key={item.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm relative">
                                                    <Bell size={28} />
                                                    {item.urgency === 'high' && (
                                                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg">{item.name}</h4>
                                                    <p className="text-xs font-medium mt-1 text-slate-500">{item.message}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${item.urgency === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {item.daysLeft} Days Left
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={onBack}
                className="w-full text-center mt-12 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-[0.2em] transition-all"
            >
                ← Back to Health Console
            </button>
        </div>
    );
};

export default MedicineFlow;