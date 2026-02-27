import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Send, Plus, Minus, X, Search, ArrowRight, Clock, LayoutGrid, HelpCircle, CheckCircle, Store, Truck, Mic, Pill, ChefHat, Sparkles } from 'lucide-react';
import { PharmacyCartProvider, usePharmacyCart } from './PharmacyCartContext';
import { pharmacyApi } from './pharmacyApi';

// ─── STYLES ──────────────────────────────────────────────────────────────────
const FontStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-message { animation: slide-up 0.3s ease-out forwards; }
    .animate-toast { animation: slide-down 0.3s ease-out forwards; }
  `}</style>
);

// ─── CATEGORY ICONS MAP ───────────────────────────────────────────────────────
const CATEGORY_ICONS = {
    'OTC Medicines': '💊',
    'Health & Nutrition': '🥗',
    'Personal Care': '🧴',
    'Medical Devices': '🩺',
    'Ayurvedic': '🌿',
};

const SUBCATEGORY_MAP = {
    'OTC Medicines': [
        { label: 'Pain Relief', icon: '🩹' },
        { label: 'Cough & Cold', icon: '🤧' },
        { label: 'Antibiotics', icon: '💊' },
        { label: 'Allergy', icon: '🌸' },
        { label: 'Gas & Acidity', icon: '🫃' },
    ],
    'Health & Nutrition': [
        { label: 'Vitamins & Supplements', icon: '💪' },
        { label: 'Health Drinks', icon: '🥤' },
    ],
    'Personal Care': [
        { label: 'Skin Care', icon: '🧴' },
        { label: 'Hair Care', icon: '💇' },
        { label: 'Sexual Wellness', icon: '❤️' },
    ],
    'Medical Devices': [
        { label: 'Diabetes Care', icon: '🩸' },
        { label: 'Health Monitors', icon: '📟' },
        { label: 'First Aid', icon: '🩺' },
    ],
    'Ayurvedic': [
        { label: 'Immunity Booster', icon: '🌱' },
        { label: 'Liver Care', icon: '🫀' },
        { label: 'Pain Relief', icon: '🌿' },
    ],
};


// ─── SAFE IMAGE ───────────────────────────────────────────────────────────────
const SafeImage = ({ src, className, alt }) => {
    const [err, setErr] = useState(false);

    // If we have an error or no src, show a nice placeholder
    if (err || !src) {
        // Use a high-quality placeholder with the first letter of the product
        const char = alt ? alt.charAt(0).toUpperCase() : 'P';
        return (
            <div className={`${className} bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 font-black`}>
                {char}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || ''}
            className={className}
            onError={() => {
                console.warn(`Image failed to load: ${src}`);
                setErr(true);
            }}
        />
    );
};

// ─── PRODUCT CARD (carousel) ──────────────────────────────────────────────────
const ProductCard = ({ product }) => {
    const { cart, updateQuantity } = usePharmacyCart();
    const cartItem = cart.find(c => String(c.id) === String(product.id));
    const qty = cartItem?.quantity || 0;

    return (
        <div className="flex-shrink-0 w-44 bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
            <div className="relative h-32 overflow-hidden bg-emerald-50">
                <SafeImage src={product.image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                {product.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        {product.discount}% OFF
                    </span>
                )}
                <div className="absolute top-2 right-2 bg-white/90 rounded text-[9px] font-bold text-amber-500 px-1">
                    ★ {product.rating?.toFixed(1)}
                </div>
            </div>
            <div className="p-2.5">
                <p className="text-[10px] font-bold text-emerald-400 uppercase truncate">{product.brand}</p>
                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mt-0.5 h-8">{product.baseName || product.name}</p>
                {product.packSize && (
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded px-1.5 py-0.5">
                        📦 {product.packSize}
                    </span>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm font-extrabold text-emerald-900">₹{product.price?.toFixed(0)}</span>
                    {product.discount > 0 && <span className="text-[10px] text-slate-400 line-through">₹{product.originalPrice?.toFixed(0)}</span>}
                </div>
                <div className="mt-2">
                    {qty === 0 ? (
                        <button
                            onClick={() => updateQuantity(product, 1)}
                            className="w-full py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                            ADD <Plus size={12} />
                        </button>
                    ) : (
                        <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-0.5 border border-emerald-200">
                            <button onClick={() => updateQuantity(product, qty - 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded border border-emerald-200 hover:text-red-500 text-sm font-bold">-</button>
                            <span className="font-black text-emerald-900 text-sm">{qty}</span>
                            <button onClick={() => updateQuantity(product, qty + 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded border border-emerald-200 hover:text-emerald-600 text-sm font-bold">+</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── ORDER SUMMARY CARD ───────────────────────────────────────────────────────
const OrderSummaryCard = ({ data, onConfirm, onAbort }) => (
    <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden mt-4 w-full max-w-lg shadow-lg">
        <div className="bg-emerald-100 px-5 py-4 border-b border-emerald-200 flex items-center gap-3">
            <div className="p-2 bg-emerald-200 rounded-lg text-emerald-800">
                {data.mode === 'Store Pickup' ? <Store size={20} /> : <Truck size={20} />}
            </div>
            <div>
                <h3 className="font-bold text-sm text-emerald-900 uppercase tracking-wide">{data.mode}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold">{data.details}</p>
            </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-emerald-50 text-emerald-500 font-bold text-xs uppercase border-b border-emerald-100 sticky top-0">
                    <tr>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Spec</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                    {data.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-800 text-xs">{item.name}</td>
                            <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">Std</span></td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-900">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-emerald-50 p-4 border-t border-emerald-200">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-emerald-500">Grand Total</span>
                <span className="text-2xl font-extrabold text-emerald-900">₹{data.total.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
                <button onClick={onAbort} className="w-1/4 py-3 border border-emerald-300 rounded-lg text-emerald-700 font-bold text-xs hover:bg-white hover:text-red-600 hover:border-red-200 transition-colors uppercase">Edit</button>
                <div className="flex-1 flex gap-2">
                    <button onClick={() => onConfirm('online')} className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-bold text-[10px] hover:bg-teal-700 flex flex-col justify-center items-center gap-1 uppercase">
                        <Sparkles size={14} /> Confirm & Pay
                    </button>
                    <button onClick={() => onConfirm('cod')} className="flex-1 py-3 bg-emerald-800 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-950 flex flex-col justify-center items-center gap-1 uppercase">
                        <Truck size={14} /> Cash on Delivery
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// ─── TOAST ────────────────────────────────────────────────────────────────────
const ToastNotification = () => {
    const { toast } = usePharmacyCart();
    if (!toast) return null;
    return (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-toast w-max max-w-sm">
            <div className="bg-emerald-800 text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600">
                <CheckCircle size={20} className="text-teal-400" />
                <span className="font-semibold text-sm">{toast.message}</span>
            </div>
        </div>
    );
};

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
const QuickActions = ({ onAction }) => (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full px-6 pt-2 border-t border-emerald-100 bg-emerald-50/50">
        {[
            { label: 'Browse Store', icon: <LayoutGrid size={15} />, action: 'Show Categories' },
            { label: 'Health Tips', icon: <ChefHat size={15} />, action: 'Health Tips' },
            { label: 'Order History', icon: <Clock size={15} />, action: 'Show Last Order' },
            { label: 'Shopping Cart', icon: <ShoppingBag size={15} />, action: 'View Cart' },
            { label: 'Support', icon: <HelpCircle size={15} />, action: 'Help' },
        ].map((btn, idx) => (
            <button
                key={idx}
                onClick={() => onAction({ action: btn.action, label: btn.label })}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-emerald-200 rounded-lg shadow-sm hover:border-emerald-600 hover:text-emerald-700 hover:shadow-md transition-all text-sm font-semibold text-emerald-800 whitespace-nowrap active:scale-[0.98]"
            >
                {btn.icon} {btn.label}
            </button>
        ))}
    </div>
);

// ─── SMART REORDER CARD ───────────────────────────────────────────────────────
const SmartReorderCard = ({ order, onReorderOne }) => (
    <div className="mt-3 bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-lg w-full max-w-sm">
        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 flex items-center gap-2">
            <Clock size={16} className="text-emerald-700" />
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800">Smart Reorder</span>
        </div>
        <div className="divide-y divide-emerald-50 max-h-64 overflow-y-auto">
            {(order.items || []).map((item, idx) => (
                <div key={idx} className="p-3 flex items-center gap-3 hover:bg-emerald-50/30 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <SafeImage
                            src={item.image || item.image_url}
                            alt={item.baseName || item.product_name}
                            className="w-full h-full object-contain p-1"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-900 truncate">{item.baseName || item.product_name}</p>
                        <p className="text-[10px] font-bold text-emerald-700">₹{item.price?.toFixed(0)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                        <button onClick={() => onReorderOne(item)} className="px-2.5 py-1.5 bg-white border border-emerald-200 rounded-md text-[10px] font-black text-emerald-800 hover:border-emerald-600 active:scale-90 transition-all">
                            ADD
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <div className="p-3 bg-emerald-50/50 border-t border-emerald-100">
            <button onClick={() => onReorderOne(null, order.items)} className="w-full py-2 bg-emerald-800 text-white rounded-lg text-xs font-extrabold shadow-md hover:bg-emerald-700 transition-all active:scale-95">
                REORDER ALL ITEMS
            </button>
        </div>
    </div>
);

// ─── MAIN CHAT VIEW ───────────────────────────────────────────────────────────
const PharmacyChatView = ({ user, onLogout }) => {
    const { cart, updateQuantity, isCartOpen, setIsCartOpen, cartCount, cartTotal, clearCart } = usePharmacyCart();
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [input, setInput] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const messagesEndRef = useRef(null);
    const hasInit = useRef(false);

    const addMsg = (sender, content, type = 'text', data = null) => {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, content, type, data }]);
    };

    // Search debounce
    useEffect(() => {
        const t = setTimeout(async () => {
            if (searchQuery.length > 2) {
                const r = await pharmacyApi.searchMedicines(searchQuery);
                setSearchResults(r);
            } else setSearchResults([]);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    // Init — welcome + last purchased
    useEffect(() => {
        if (hasInit.current) return;
        hasInit.current = true;

        addMsg('bot', `Hello ${user.name}! 👋 Welcome to MediMart Pharmacy.`, 'text');

        // Check localStorage for previous orders for this user
        const storageKey = `medimart_orders_${user.id}`;
        let savedOrders = [];
        try { savedOrders = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { console.debug('No saved orders found'); }

        if (savedOrders.length > 0) {
            const lastOrder = savedOrders[savedOrders.length - 1];

            setTimeout(() => addMsg('bot', `Welcome back, ${user.name.split(' ')[0]}! I found your recent order.`, 'text'), 700);
            setTimeout(() => addMsg('bot', '', 'smart_reorder', lastOrder), 1400);

            setTimeout(() => addMsg('bot', 'Anything else you need today?', 'options', [
                { id: 'fresh_start', label: '🛒 Browse Store', action: 'Show Categories' },
                { id: 'health_tips', label: '🍎 Health Tips', action: 'Health Tips' },
            ]), 2200);
        } else {
            setTimeout(() => addMsg('bot', 'Browse medicines by category, search by name, or ask me anything about your health!', 'text'), 700);
            setTimeout(() => addMsg('bot', 'Select a department to get started:', 'grid'), 1400);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSend = (text) => { handleUserMessage(text); setInput(''); };

    const handleOptionSelect = (option) => {
        if (option.id !== 'confirm_order') addMsg('user', option.label);
        setIsTyping(true);

        setTimeout(async () => {
            setIsTyping(false);

            if (option.action === 'Show Categories' || option.id === 'fresh_start') {
                addMsg('bot', 'Select a department:', 'grid');
            } else if (option.action === 'View Cart') {
                setIsCartOpen(true);
            } else if (option.action === 'Show Last Order') {
                const storageKey = `medimart_orders_${user.id}`;
                let savedOrders = [];
                try { savedOrders = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { console.debug('No saved orders found'); }
                if (savedOrders.length > 0) {
                    const lastOrder = savedOrders[savedOrders.length - 1];
                    addMsg('bot', `Here is your most recent order (#${lastOrder.id}):`, 'smart_reorder', lastOrder);
                } else {
                    addMsg('bot', "You haven't placed any orders yet. Let's find some medicines for you!", 'grid');
                }
            } else if (option.action === 'Health Tips' || option.id === 'health_tips') {
                const tips = [
                    '💧 Drink at least 8 glasses of water daily.',
                    '🏃 Walk 30 minutes every day for heart health.',
                    '💊 Never self-medicate with antibiotics — always consult a doctor.',
                    '😴 Get 7–8 hours of quality sleep for better immunity.',
                    '🌿 Turmeric milk boosts immunity naturally.',
                    '🍋 Vitamin C helps faster recovery from cold and flu.',
                    '🩺 Regular checkups can catch problems early.',
                    '🥦 Eat more green vegetables to maintain iron levels.',
                    '🧴 Apply sunscreen SPF 30+ every day, even indoors.',
                    '💊 Store medicines at room temperature, away from humidity.',
                ];
                addMsg('bot', tips[Math.floor(Math.random() * tips.length)]);
                setTimeout(() => addMsg('bot', 'Want another tip or shall we browse medicines?', 'options', [
                    { id: 'fresh_start', label: 'Browse Medicines', action: 'Show Categories' },
                    { id: 'health_tips', action: 'Health Tips', label: 'Another Tip 🌿' },
                ]), 800);
            } else if (option.action === 'Help') {
                addMsg('bot', 'How can we assist?', 'options', [
                    { id: 'support_faq', label: 'View FAQs' },
                    { id: 'support_call', label: 'Call Pharmacist' },
                ]);
            } else if (option.id === 'support_faq') {
                addMsg('bot', 'Policy:\n• Free delivery above ₹500.\n• Easy returns within 7 days.\n• Prescription medicines need valid Rx.');
                setTimeout(() => addMsg('bot', 'Anything else?', 'options', [{ id: 'fresh_start', label: 'Back to Shopping', action: 'Show Categories' }]), 800);
            } else if (option.id === 'support_call') {
                addMsg('bot', '📞 Pharmacist Helpline: 1800-MEDI-MART (9 AM – 9 PM)');
            } else if (option.action === 'add_direct' && option.product) {
                updateQuantity(option.product, 1);
                addMsg('bot', `✅ Added **${option.product.baseName || option.product.name}** (₹${option.product.price?.toFixed(0)}) to your cart!`);
                setTimeout(() => addMsg('bot', 'Continue shopping or checkout?', 'options', [
                    { id: 'fresh_start', label: '🛍️ Browse Store', action: 'Show Categories' },
                    { id: 'checkout_now', label: '💳 Checkout' },
                ]), 400);
            } else if (option.id === 'checkout_now' || option.id === 'proceed') {
                if (cart.length === 0) {
                    addMsg('bot', 'Your cart is empty. Please add medicines first.');
                } else {
                    addMsg('bot', `Total Amount: ₹${cartTotal.toLocaleString()}.`);
                    setTimeout(() => addMsg('bot', 'Select your preferred fulfillment method:', 'options', [
                        { id: 'pickup', label: 'Store Pickup' },
                        { id: 'delivery', label: 'Home Delivery' },
                    ]), 900);
                }
            } else if (option.id === 'pickup') {
                setIsCartOpen(false);
                addMsg('bot', 'Please review your final order:', 'order_summary', {
                    mode: 'Store Pickup', details: 'Pharmacy Counter', items: cart, total: cartTotal
                });
            } else if (option.id === 'delivery') {
                setIsCartOpen(false);
                addMsg('bot', 'Please provide delivery details:', 'delivery_form', { name: user.name || '', address: '', mobile: '', altMobile: '' });
            } else if (option.id === 'submit_delivery') {
                const { name, address, mobile, altMobile } = option.data;
                addMsg('bot', 'Here is your final order:', 'order_summary', {
                    mode: 'Home Delivery',
                    details: `${name} | M: ${mobile} | Alt: ${altMobile} | ${address}`,
                    items: cart, total: cartTotal
                });
            } else if (option.id === 'confirm_order') {
                const orderPayload = {
                    user_id: user.id || 'guest',
                    user_name: user.name,
                    total_amount: cartTotal,
                    payment_method: option.payment_method || 'online',
                    items: cart.map(i => ({
                        product_id: i.id,
                        product_name: i.name,
                        baseName: i.baseName || i.name,
                        packSize: i.packSize || i.selectedWeight || '',
                        quantity: i.quantity,
                        price: i.price,
                        image: i.image,
                        brand: i.brand
                    }))
                };
                const order = await pharmacyApi.createOrder(orderPayload);
                if (order) {
                    // Persist to localStorage so it shows on next login
                    const storageKey = `medimart_orders_${user.id}`;
                    try {
                        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                        existing.push(order);
                        if (existing.length > 10) existing.splice(0, existing.length - 10);
                        localStorage.setItem(storageKey, JSON.stringify(existing));
                    } catch { console.debug('Failed to update orders'); }
                    addMsg('bot', '🎉 Order Placed Successfully!');
                    addMsg('bot', `Your Order ID is #${order.id}. Thank you for shopping with MediMart.`);
                    clearCart();
                } else {
                    addMsg('bot', 'Payment failed. Please try again.');
                }
            } else if (option.id === 'abort_order') {
                addMsg('bot', 'Checkout paused. Your cart is open for adjustments.');
                setIsCartOpen(true);
            }
        }, 600);
    };

    // ── NLP: Map symptoms to REAL subcategory/product keywords in the DB ────────
    const extractSearchKeyword = (text) => {
        const lower = text.toLowerCase();
        // Maps symptoms/intent → exact backend subcategory or product name fragments
        const SYMPTOM_MAP = [
            // Fever → paracetamol medicines are under "Pain Relief" in the DB
            { patterns: ['fever', 'temperature', 'pyrexia', 'viral fever'], keyword: 'pain relief' },
            // Pain / headache
            { patterns: ['pain', 'ache', 'headache', 'body pain', 'backache', 'muscle pain'], keyword: 'pain relief' },
            // Cold / cough
            { patterns: ['cold', 'cough', 'sneezing', 'runny nose', 'sore throat', 'flu', 'nasal'], keyword: 'cough' },
            // Acidity / gas
            { patterns: ['acidity', 'gas', 'indigestion', 'heartburn', 'stomach', 'bloating', 'antacid'], keyword: 'gas' },
            // Allergy
            { patterns: ['allergy', 'allergic', 'itching', 'rashes', 'cetirizine', 'antihistamine'], keyword: 'allergy' },
            // Vitamins & supplements
            { patterns: ['vitamin', 'supplement', 'multivitamin', 'nutrition', 'mineral', 'zinc', 'calcium'], keyword: 'vitamins' },
            // Diabetes / blood sugar
            { patterns: ['diabetes', 'blood sugar', 'glucometer', 'insulin', 'sugar level'], keyword: 'diabetes' },
            // Blood pressure
            { patterns: ['blood pressure', 'bp', 'hypertension', 'bp monitor'], keyword: 'health monitor' },
            // Skin care
            { patterns: ['skin', 'moisturizer', 'face wash', 'cream', 'lotion', 'sunscreen', 'acne', 'pimple'], keyword: 'skin care' },
            // Hair care
            { patterns: ['hair', 'shampoo', 'conditioner', 'hair fall', 'dandruff'], keyword: 'hair care' },
            // Immunity
            { patterns: ['immunity', 'immune', 'booster', 'chyawanprash'], keyword: 'immunity booster' },
            // Antibiotics / infection
            { patterns: ['antibiotic', 'infection', 'bacteria', 'amoxicillin', 'azithromycin'], keyword: 'antibiotic' },
            // Brand names — search directly
            { patterns: ['dolo', 'crocin', 'combiflam', 'aspirin', 'ibuprofen', 'paracetamol', 'moov', 'volini'], keyword: lower },
            { patterns: ['vicks', 'benadryl', 'strepsils', 'otrivin', 'd cold', 'actifed'], keyword: lower },
            { patterns: ['glucon', 'ensure', 'horlicks', 'boost', 'protinex'], keyword: lower },
            // Protein / fitness
            { patterns: ['protein', 'whey', 'mass gainer', 'workout', 'creatine'], keyword: 'vitamins' },
        ];
        for (const { patterns, keyword } of SYMPTOM_MAP) {
            if (patterns.some(p => lower.includes(p))) return keyword;
        }
        // Strip filler / question words and return the core query
        const clean = lower
            .replace(/\b(show|me|the|find|i want|i need|what|which|best|good|for|my|any|some|please|recommend|suggest|available|medicine|medicines|tablet|tablets|capsule|capsules|drug|drugs|product|products|need|looking for|search|want|give|tell|about|information)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return clean.length >= 2 ? clean : lower;
    };

    const handleUserMessage = async (text) => {
        if (!text.trim()) return;
        addMsg('user', text);
        setIsTyping(true);
        const lower = text.toLowerCase().trim();

        // ── INTERNAL COMMAND: ShowSub (from category grid clicks) ──────────────
        if (text.startsWith('ShowSub ')) {
            const parts = text.replace('ShowSub ', '');
            const pipeIdx = parts.indexOf('|');
            const parentCat = parts.substring(0, pipeIdx);
            const subLabel = parts.substring(pipeIdx + 1);
            const products = await pharmacyApi.getMedicinesBySubCategory(parentCat, subLabel);
            setIsTyping(false);
            if (products.length > 0) {
                addMsg('bot', `Found ${products.length} products in ${subLabel}:`, 'carousel', products);
            } else {
                addMsg('bot', `No products found in ${subLabel}. Try another section:`, 'options', [
                    { id: 'fresh_start', label: 'Back to Categories', action: 'Show Categories' }
                ]);
            }
            return;
        }

        // ── INTERNAL COMMAND: Show <CategoryName> (from grid button clicks) ───
        if (text.startsWith('Show ') && !text.includes(' ') === false) {
            const catName = text.replace(/^Show /, '').trim();
            const subCats = SUBCATEGORY_MAP[catName];
            if (subCats) {
                setIsTyping(false);
                const formatted = subCats.map(s => ({
                    id: s.label.toLowerCase().replace(/ /g, '_'),
                    label: `${s.icon} ${s.label}`,
                    command: `ShowSub ${catName}|${s.label}`,
                }));
                addMsg('bot', `Select a ${catName} section:`, 'sub_carousel', formatted);
                return;
            }
            // It's a category with no sub-map, just browse all
            const products = await pharmacyApi.getMedicinesByCategory(catName);
            setIsTyping(false);
            if (products.length > 0) {
                addMsg('bot', `Showing all ${catName} products:`, 'carousel', products.slice(0, 20));
            }
            return;
        }

        // ── CHECKOUT ──────────────────────────────────────────────────────────
        if (lower.includes('checkout') || lower.includes('proceed') || lower === 'pay now' || lower === 'pay') {
            setIsTyping(false);
            handleOptionSelect({ id: 'checkout_now', label: 'Checkout' });
            return;
        }

        // ── CART ──────────────────────────────────────────────────────────────
        if ((lower.includes('cart') && !lower.includes('add')) || lower === 'basket') {
            setIsTyping(false);
            setIsCartOpen(true);
            addMsg('bot', 'Here is your cart! 🛒');
            return;
        }

        // ── HELP ──────────────────────────────────────────────────────────────
        if (lower === 'help' || lower === 'support' || lower.startsWith('help ')) {
            setIsTyping(false);
            addMsg('bot', 'How can we assist?', 'options', [
                { id: 'support_faq', label: 'View FAQs' },
                { id: 'support_call', label: 'Call Pharmacist' },
            ]);
            return;
        }

        // ── BROWSE / MENU ─────────────────────────────────────────────────────
        if (lower.includes('browse') || lower.includes('categories') || lower.includes('category') || lower === 'menu' || lower === 'departments') {
            setIsTyping(false);
            addMsg('bot', 'Select a department:', 'grid');
            return;
        }

        // ── HEALTH TIPS ───────────────────────────────────────────────────────
        if (lower.includes('health tip') || lower === 'tip' || lower === 'tips') {
            setIsTyping(false);
            handleOptionSelect({ id: 'health_tips', action: 'Health Tips', label: 'Health Tips' });
            return;
        }

        // ── EXPLICIT ADD: "add dolo", "buy vicks", "order paracetamol", "add X to my cart" ────────
        if (/^(add|buy|order|get)\s+/i.test(lower)) {
            // Strip the verb prefix AND any trailing cart-related phrases
            let query = text
                .replace(/^(add|buy|order|get)\s+/i, '')
                .replace(/\s+(to\s+(my\s+)?cart|in\s+(my\s+)?cart|for\s+me|please|now)\s*$/i, '')
                .trim();
            // Also strip "X units of" or "X of" prefix from quantity phrases
            query = query.replace(/^\d+\s+(units?\s+of|packs?\s+of|bottles?\s+of)\s+/i, '').trim();
            const results = await pharmacyApi.searchMedicines(query);
            setIsTyping(false);
            if (results.length > 0) {
                const product = results[0];
                updateQuantity(product, 1);
                addMsg('bot', `✅ Added ${product.name} (₹${product.price.toFixed(0)}) to your cart!`);
                addMsg('bot', 'Want to continue shopping or checkout?', 'options', [
                    { id: 'fresh_start', label: 'Continue Shopping', action: 'Show Categories' },
                    { id: 'checkout_now', label: 'Proceed to Checkout' },
                ]);
            } else {
                addMsg('bot', `Sorry, I couldn't find "${query}". Try the search icon or browse categories.`, 'options', [
                    { id: 'fresh_start', label: 'Browse Categories', action: 'Show Categories' },
                ]);
            }
            return;
        }

        // ── PRICE INQUIRY: "what is the price of X", "how much is X", "price of X" ──
        const pricePatterns = [
            /^(?:what(?:'s|\s+is)?\s+the\s+)?price\s+of\s+(.+)/i,
            /^how\s+much\s+(?:does\s+|is\s+|costs?\s+)?(.+?)(?:\s+cost)?[?!]?\s*$/i,
            /^(?:tell\s+me\s+(?:the\s+)?)?cost\s+of\s+(.+)/i,
            /^(?:what\s+is\s+)?(?:the\s+)?(?:rate|mrp|price)\s+(?:of\s+)?(.+)/i,
            /^(.+)\s+(?:price|cost|rate|mrp)[?!]?\s*$/i,
        ];

        let priceQuery = null;
        for (const pat of pricePatterns) {
            const m = lower.match(pat);
            if (m && m[1] && m[1].trim().length > 2) {
                // Filter out noise words
                let candidate = m[1].trim().replace(/[?!.]+$/, '');
                // Fix common typos
                candidate = candidate.replace(/\bsampoo\b/i, 'shampoo');
                const noiseWords = ['medicine', 'medicines', 'product', 'tablet', 'it', 'this', 'that', 'the'];
                if (!noiseWords.includes(candidate)) {
                    priceQuery = candidate;
                    break;
                }
            }
        }

        if (priceQuery) {
            const results = await pharmacyApi.searchMedicines(priceQuery);
            setIsTyping(false);

            if (results.length === 0) {
                addMsg('bot', `I couldn't find "${priceQuery}" in our store. Try the search icon for exact matches.`, 'options', [
                    { id: 'fresh_start', label: '🛍️ Browse Categories', action: 'Show Categories' },
                ]);
                return;
            }

            const top = results[0];
            addMsg('bot', '', 'price_card', top);

            if (results.length > 1) {
                addMsg('bot', `Found ${results.length} matching products. Here are the top results:`, 'carousel', results.slice(0, 12));
            }

            setTimeout(() => addMsg('bot', 'What would you like to do?', 'options', [
                { id: 'add_price_result', label: `🛒 Add ${top.baseName || top.name} to Cart`, action: 'add_direct', product: top },
                { id: 'fresh_start', label: '🔍 Browse More', action: 'Show Categories' },
            ]), 500);
            return;
        }

        // ── SMART NLP SEARCH — extract keywords from natural language ─────────
        const keyword = extractSearchKeyword(lower);
        const results = await pharmacyApi.searchMedicines(keyword);
        setIsTyping(false);
        if (results.length > 0) {
            addMsg('bot', `Here are ${results.length} medicines for "${keyword}":`, 'carousel', results.slice(0, 20));
            setTimeout(() => addMsg('bot', 'Would you like to explore more?', 'options', [
                { id: 'fresh_start', label: 'Browse All Categories', action: 'Show Categories' },
                { id: 'checkout_now', label: 'Checkout' },
            ]), 500);
        } else {
            addMsg('bot', `I couldn't find medicines for "${text}". Try browsing by category or use the search icon.`, 'options', [
                { id: 'fresh_start', label: 'Browse Categories', action: 'Show Categories' },
                { id: 'health_tips', action: 'Health Tips', label: 'Health Tips' },
            ]);
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) { alert('Voice not supported in this browser.'); return; }
        const r = new window.webkitSpeechRecognition();
        r.continuous = false; r.lang = 'en-US';
        r.onstart = () => setIsListening(true);
        r.onend = () => setIsListening(false);
        r.onresult = (e) => handleUserMessage(e.results[0][0].transcript);
        r.start();
    };

    // Category grid images (placeholder)
    const CATEGORY_IMAGES = {
        'OTC Medicines': 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/nimrrccivlkapnxsstc4.jpg',
        'Health & Nutrition': 'https://onemg.gumlet.io/images/f_auto,w_150,h_150,c_fit,q_auto/gmkrpf1imjj9djwvq4gq/tata-1mg-multivitamin-supreme-zinc-calcium-and-vitamin-d-capsule-for-immunity-energy-overall-health.jpg',
        'Personal Care': 'https://onemg.gumlet.io/images/f_auto,w_150,h_150,c_fit,q_auto/c8be7d3b06ef4cd28507bfa8fcdf600e/bioderma-sebium-hydra-moisturiser.jpg',
        'Medical Devices': 'https://onemg.gumlet.io/l_watermark_346,w_120,h_120/a_ignore,w_120,h_120,c_fit,q_auto,f_auto/a5c00abfc40b49d38ef059da263b0e32.jpg',
        'Ayurvedic': 'https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/qir6i2zlhzeddxa4mqt0.jpg',
    };

    const [allCategories, setAllCategories] = useState([]);
    useEffect(() => {
        pharmacyApi.getCategories().then(cats => {
            setAllCategories(cats.map(c => ({
                id: c.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_'),
                label: c,
                img: CATEGORY_IMAGES[c] || `https://placehold.co/200x200/f3e8ff/6b21a8?text=${encodeURIComponent(c)}`,
                icon: CATEGORY_ICONS[c] || '💊',
            })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {/* HEADER */}
            <header className="px-6 h-20 border-b border-emerald-100 flex justify-between items-center bg-white sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center">
                        <Pill size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-emerald-900">MediMart</h1>
                        <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Online Pharmacy</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-emerald-100 hover:border-emerald-500 hover:text-emerald-600 text-emerald-400 transition-colors">
                        <Search size={20} />
                    </button>
                    <button onClick={() => setIsCartOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white shadow-lg transition-all relative">
                        <ShoppingBag size={20} />
                        {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 rounded-full border-2 border-white text-[10px] flex items-center justify-center font-bold">{cartCount}</span>}
                    </button>
                    <button onClick={onLogout} className="ml-2 px-4 py-2 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">LOGOUT</button>
                </div>
            </header>

            <ToastNotification />

            {/* MESSAGES */}
            <main className="flex-1 overflow-y-auto p-6 bg-emerald-50/50 scroll-smooth">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-8 animate-message`}>
                        {msg.sender === 'bot' && (
                            <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 flex items-center justify-center mr-4 flex-shrink-0 shadow-sm mt-1">
                                <Pill size={16} className="text-emerald-600" />
                            </div>
                        )}
                        <div className={`max-w-[85%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            {msg.content && (
                                <div className={`py-3.5 px-6 text-[15px] font-medium leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-emerald-800 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-slate-800 border border-emerald-100 rounded-2xl rounded-tl-sm'}`}>
                                    {msg.content}
                                </div>
                            )}

                            {/* PRICE CARD */}
                            {msg.type === 'price_card' && msg.data && (() => {
                                const p = msg.data;
                                return (
                                    <div className="mt-3 bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-md w-full max-w-sm">
                                        <div className="flex gap-4 p-4">
                                            <div className="w-24 h-24 flex-shrink-0 bg-emerald-50 border border-emerald-100 rounded-xl overflow-hidden flex items-center justify-center">
                                                <SafeImage src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-emerald-900 text-sm leading-snug">{p.baseName || p.name}</p>
                                                <p className="text-xs text-emerald-400 font-semibold mt-0.5">{p.brand}</p>
                                                {p.packSize && (
                                                    <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">📦 {p.packSize}</span>
                                                )}
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <span className="text-xl font-extrabold text-emerald-800">₹{p.price?.toFixed(0)}</span>
                                                    {p.discount > 0 && (
                                                        <>
                                                            <span className="text-xs text-slate-400 line-through">₹{p.originalPrice?.toFixed(0)}</span>
                                                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{p.discount}% OFF</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs">
                                                    <span className="text-amber-500 font-bold">⭐ {p.rating?.toFixed(1)}</span>
                                                    <span className={`font-semibold ${p.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {p.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* SMART REORDER CARD */}
                            {msg.type === 'smart_reorder' && (
                                <SmartReorderCard
                                    order={msg.data}
                                    onReorderOne={async (one, all) => {
                                        const itemsToAdd = all || [one];
                                        setIsTyping(true);
                                        for (const item of itemsToAdd) {
                                            const results = await pharmacyApi.searchMedicines(item.baseName || item.product_name || '');
                                            if (results.length > 0) updateQuantity(results[0], item.quantity || 1);
                                        }
                                        setIsTyping(false);
                                        addMsg('bot', `✅ Added ${itemsToAdd.length} items to your cart!`);
                                    }}
                                />
                            )}

                            {/* CATEGORY GRID */}
                            {msg.type === 'grid' && (
                                <div className="grid grid-cols-5 gap-x-4 gap-y-6 mt-4 w-full px-1">
                                    {allCategories.map(c => (
                                        <button key={c.id} onClick={() => onSend(`Show ${c.label}`)} className="flex flex-col items-center gap-3 group active:scale-95 transition-all">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 shadow-sm group-hover:shadow-md group-hover:border-emerald-400 transition-all flex items-center justify-center p-0.5">
                                                <SafeImage src={c.img} alt={c.label} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <span className="text-xs font-bold text-emerald-900 text-center leading-tight">{c.icon} {c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* SUBCATEGORY CAROUSEL */}
                            {msg.type === 'sub_carousel' && (
                                <div className="grid grid-cols-4 gap-x-4 gap-y-5 mt-4 w-full px-1">
                                    {msg.data.map(c => (
                                        <button key={c.id} onClick={() => onSend(c.command)} className="flex flex-col items-center gap-2 group active:scale-95 transition-all">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 shadow-sm group-hover:shadow-md group-hover:border-emerald-400 transition-all flex items-center justify-center text-3xl">
                                                {c.label.split(' ')[0]}
                                            </div>
                                            <span className="text-xs font-bold text-emerald-900 text-center leading-tight">{c.label.split(' ').slice(1).join(' ')}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* PRODUCT CAROUSEL */}
                            {msg.type === 'carousel' && (
                                <div className="mt-4 w-full flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
                                    {(msg.data || []).map(p => <ProductCard key={p.id} product={p} />)}
                                </div>
                            )}

                            {/* OPTIONS */}
                            {msg.type === 'options' && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {(msg.data || []).map(opt => (
                                        <button key={opt.id || opt.label} onClick={() => handleOptionSelect(opt)}
                                            className="px-6 py-3 bg-white border-2 border-emerald-100 rounded-xl text-sm font-bold text-emerald-800 hover:border-emerald-600 hover:text-emerald-900 hover:shadow-md transition-all active:scale-[0.98]">
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ORDER SUMMARY */}
                            {msg.type === 'order_summary' && (
                                <OrderSummaryCard
                                    data={msg.data}
                                    onConfirm={(method) => handleOptionSelect({ id: 'confirm_order', label: method === 'cod' ? 'COD' : 'Pay Online', payment_method: method })}
                                    onAbort={() => handleOptionSelect({ id: 'abort_order', label: 'Edit Order' })}
                                />
                            )}

                            {/* DELIVERY FORM */}
                            {msg.type === 'delivery_form' && (
                                <div className="bg-white border border-emerald-200 rounded-xl p-6 mt-4 w-full max-w-md shadow-lg">
                                    <div className="flex items-center gap-3 mb-4 text-emerald-900">
                                        <Truck size={24} className="text-emerald-600" />
                                        <h3 className="font-bold text-lg uppercase tracking-wide">Delivery Details</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'del-name', label: 'Full Name', placeholder: 'Recipient name', defaultVal: msg.data.name },
                                            { id: 'del-mobile', label: 'Mobile Number', placeholder: '10-digit mobile', defaultVal: msg.data.mobile },
                                            { id: 'del-alt', label: 'Alternate Mobile', placeholder: 'Alternate 10-digit', defaultVal: msg.data.altMobile },
                                        ].map(f => (
                                            <div key={f.id}>
                                                <label className="block text-xs font-bold text-emerald-500 uppercase mb-1">{f.label} *</label>
                                                <input id={f.id} className="w-full bg-emerald-50 border border-emerald-100 p-3 rounded-lg outline-none focus:border-emerald-600 font-semibold text-emerald-900" placeholder={f.placeholder} defaultValue={f.defaultVal} />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-500 uppercase mb-1">Delivery Address *</label>
                                            <textarea id="del-address" className="w-full bg-emerald-50 border border-emerald-100 p-3 rounded-lg outline-none focus:border-emerald-600 font-semibold text-emerald-900 h-24 resize-none" placeholder="Full street address" defaultValue={msg.data.address} />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const name = document.getElementById('del-name').value.trim();
                                                const mobile = document.getElementById('del-mobile').value.trim();
                                                const altMobile = document.getElementById('del-alt').value.trim();
                                                const address = document.getElementById('del-address').value.trim();
                                                if (!name || !mobile || !altMobile || !address) return alert('Please fill all fields');
                                                if (!/^\d{10}$/.test(mobile) || !/^\d{10}$/.test(altMobile)) return alert('Mobile must be 10 digits');
                                                handleOptionSelect({ id: 'submit_delivery', label: 'Confirm Delivery', data: { name, mobile, altMobile, address } });
                                            }}
                                            className="w-full py-4 bg-emerald-800 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            Confirm Address <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="ml-14 mb-4 flex gap-1.5">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200" />
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* FOOTER */}
            <footer className="bg-white border-t border-emerald-100 z-20 pb-6 pt-2">
                <QuickActions onAction={handleOptionSelect} />
                <div className="px-6 mt-3">
                    <div className="flex gap-3 items-center bg-emerald-50 rounded-xl px-2 py-2 border-2 border-emerald-100 focus-within:bg-white focus-within:border-emerald-600 focus-within:shadow-lg transition-all">
                        <input
                            className="flex-1 bg-transparent px-4 outline-none text-base text-emerald-900 font-semibold h-11 placeholder:text-emerald-300"
                            placeholder={isListening ? 'Listening...' : "Type 'Add Dolo 650' or 'Pain Relief'..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onSend(input)}
                        />
                        <button onClick={startListening} className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${isListening ? 'bg-teal-500 text-white animate-pulse' : 'text-emerald-300 hover:text-emerald-600 hover:bg-emerald-100'}`}>
                            <Mic size={20} />
                        </button>
                        <button onClick={() => onSend(input)} disabled={!input.trim()} className="w-11 h-11 bg-emerald-800 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center disabled:opacity-50">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </footer>

            {/* SEARCH OVERLAY */}
            {isSearchOpen && (
                <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-xl flex flex-col animate-message">
                    <div className="p-6 flex gap-4 items-center border-b border-emerald-100">
                        <button onClick={() => setIsSearchOpen(false)} className="w-10 h-10 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center">
                            <ArrowRight className="rotate-180 text-emerald-900" size={20} />
                        </button>
                        <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search medicines..." className="flex-1 outline-none text-2xl font-bold text-emerald-900 bg-transparent placeholder:text-emerald-300" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                        {searchQuery && (
                            <div className="grid grid-cols-1 gap-2">
                                {searchResults.map(p => (
                                    <div key={p.id}
                                        onClick={() => {
                                            updateQuantity(p, 1);
                                            setIsSearchOpen(false);
                                            setSearchQuery('');
                                            addMsg('bot', `✅ Added ${p.name} (₹${p.price.toFixed(0)}) to your cart!`);
                                            setTimeout(() => addMsg('bot', 'Continue shopping or checkout?', 'options', [
                                                { id: 'fresh_start', label: 'Keep Shopping', action: 'Show Categories' },
                                                { id: 'checkout_now', label: 'Checkout' },
                                            ]), 400);
                                        }}
                                        className="flex items-center gap-4 p-4 border border-emerald-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all bg-white shadow-sm">
                                        <SafeImage src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-contain bg-emerald-50 border border-emerald-100" />
                                        <div className="flex-1">
                                            <p className="font-bold text-emerald-900">{p.name}</p>
                                            <p className="text-xs text-emerald-400 font-semibold">{p.brand} · {p.category}</p>
                                            <p className="text-sm font-bold text-emerald-700 mt-1">₹{p.price.toFixed(0)} {p.discount > 0 && <span className="text-xs text-green-600 font-semibold ml-1">{p.discount}% off</span>}</p>
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center text-white flex-shrink-0">
                                            <Plus size={18} />
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && searchQuery.length > 2 && (
                                    <p className="text-emerald-400 font-semibold text-center py-12">No medicines found for "{searchQuery}"</p>
                                )}
                            </div>
                        )}
                        {!searchQuery && (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-4">💊</p>
                                <p className="text-emerald-300 font-semibold">Start typing to search medicines...</p>
                                <p className="text-xs text-emerald-200 mt-2">Try: "Dolo", "Vitamin C", "Cough syrup"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CART DRAWER */}
            {isCartOpen && (
                <div className="absolute inset-0 z-50 flex justify-end bg-emerald-800/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}>
                    <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-emerald-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50">
                            <h2 className="font-extrabold text-2xl text-emerald-900 flex items-center gap-2"><ShoppingBag className="text-emerald-700" /> Cart</h2>
                            <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-white border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center text-emerald-500"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 && <p className="text-center text-emerald-300 font-semibold py-12">Your cart is empty</p>}
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-4 p-3 border border-emerald-100 rounded-xl hover:border-emerald-300 transition-colors bg-white shadow-sm">
                                    <SafeImage src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-contain bg-emerald-50 border border-emerald-100" />
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <p className="font-bold text-emerald-900 text-sm leading-snug">{item.baseName || item.name}</p>
                                            <p className="text-xs font-semibold text-emerald-400">{item.brand}</p>
                                            {(item.packSize || item.selectedWeight) && item.packSize !== 'Std' && (
                                                <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5">
                                                    📦 {item.packSize || item.selectedWeight}
                                                </span>
                                            )}
                                            <p className="text-sm font-semibold text-emerald-500 mt-1">₹{item.price?.toFixed(0)} / unit</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => updateQuantity(item, (item.quantity || 1) - 1)} className="w-8 h-8 rounded-lg border border-emerald-200 flex items-center justify-center hover:bg-emerald-50"><Minus size={14} /></button>
                                            <span className="font-bold w-6 text-center text-emerald-900">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item, (item.quantity || 1) + 1)} className="w-8 h-8 rounded-lg border border-emerald-200 flex items-center justify-center hover:bg-emerald-50"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="font-extrabold text-emerald-700 self-end text-lg">₹{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div className="border-t border-emerald-200 p-6 bg-emerald-50">
                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-emerald-500 font-bold uppercase text-sm tracking-wide">Total Amount</span>
                                    <span className="text-3xl font-extrabold text-emerald-900">₹{cartTotal.toLocaleString()}</span>
                                </div>
                                <button onClick={() => { setIsCartOpen(false); onSend('Proceed to Checkout'); }}
                                    className="w-full py-4 bg-emerald-800 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all flex justify-between px-6 items-center active:scale-[0.99]">
                                    <span>Secure Checkout</span><ArrowRight size={22} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const MOCK_USERS = [
    { email: 'patient@demo.com', password: 'patient123', name: 'Rahul Sharma', id: 'PAT-001' },
    { email: 'priya@demo.com', password: 'demo1234', name: 'Priya Singh', id: 'PAT-002' },
];

const PharmacyLogin = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            const user = MOCK_USERS.find(u => u.email === email && u.password === password);
            if (user) { onLogin(user); }
            else { setError('Invalid credentials. Try patient@demo.com / patient123'); }
            setLoading(false);
        }, 700);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50">
            <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-emerald-100">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Pill size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-emerald-900">MediMart</h1>
                    <p className="text-emerald-400 mt-1 font-medium text-sm">Your Online Pharmacy</p>
                </div>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" className="w-full bg-emerald-50 border border-emerald-200 p-4 rounded-lg outline-none focus:border-emerald-600 font-semibold text-emerald-900 placeholder:text-emerald-300" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" className="w-full bg-emerald-50 border border-emerald-200 p-4 rounded-lg outline-none focus:border-emerald-600 font-semibold text-emerald-900 placeholder:text-emerald-300" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-800 text-white rounded-lg font-bold text-lg shadow-lg hover:bg-emerald-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? 'Logging in...' : 'Login'} <ArrowRight size={20} />
                    </button>
                </form>
                <p className="text-center text-xs text-emerald-300 mt-6 font-semibold">Demo: patient@demo.com / patient123</p>
            </div>
        </div>
    );
};

// ─── APP WRAPPER ──────────────────────────────────────────────────────────────
const PharmacyApp = () => {
    const [user, setUser] = useState(null);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-emerald-50 p-4">
            <FontStyles />
            <div className="w-full max-w-6xl h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col relative border border-emerald-200 ring-1 ring-emerald-800/5">
                {!user ? (
                    <PharmacyLogin onLogin={setUser} />
                ) : (
                    <PharmacyCartProvider>
                        <PharmacyChatView user={user} onLogout={() => setUser(null)} />
                    </PharmacyCartProvider>
                )}
            </div>
        </div>
    );
};

export default PharmacyApp;
