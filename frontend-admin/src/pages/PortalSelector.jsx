import React from 'react';
import { ShieldAlert, Activity, Pill, User } from 'lucide-react';

const PortalSelector = ({ onSelect }) => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="text-center mb-16 relative z-10">
                <h1 className="text-5xl font-black mb-4 tracking-tight">MediCare<span className="text-blue-500">Staff</span></h1>
                <p className="text-slate-400 text-lg">Select your designated workspace to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
                <PortalCard id="admin" icon={<ShieldAlert size={32} />} title="Super Admin" desc="Full system control & oversight" color="blue" onSelect={onSelect} />
                <PortalCard id="doctor" icon={<User size={32} />} title="Doctor Portal" desc="Manage appointments & consults" color="indigo" onSelect={onSelect} />
                <PortalCard id="lab" icon={<Activity size={32} />} title="Lab Portal" desc="Process reports & lab queue" color="purple" onSelect={onSelect} />
                <PortalCard id="pharmacist" icon={<Pill size={32} />} title="Pharmacy Portal" desc="Manage inventory & orders" color="emerald" onSelect={onSelect} />
            </div>

            <div className="mt-16 text-center relative z-10">
                <p className="text-xs text-slate-500">Secured by MediCare Enterprise Security</p>
            </div>
        </div>
    );
};

const PortalCard = ({ id, icon, title, desc, color, onSelect }) => {
    const colorClasses = {
        blue: "hover:border-blue-500 hover:shadow-blue-500/20 text-blue-500",
        indigo: "hover:border-indigo-500 hover:shadow-indigo-500/20 text-indigo-500",
        purple: "hover:border-purple-500 hover:shadow-purple-500/20 text-purple-500",
        emerald: "hover:border-emerald-500 hover:shadow-emerald-500/20 text-emerald-500"
    };

    const currentClasses = colorClasses[color] || colorClasses.blue;
    const hoverBorderColor = currentClasses.split(' ')[0];
    const hoverShadowColor = currentClasses.split(' ')[1];
    const iconTextColor = currentClasses.split(' ')[2];

    return (
        <div
            onClick={() => onSelect(id)}
            className={`bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-xl ${hoverBorderColor} ${hoverShadowColor} group`}
        >
            <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 transition-colors ${iconTextColor} group-hover:bg-white/10`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 font-medium">{desc}</p>
        </div>
    );
};

export default PortalSelector;
