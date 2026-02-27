// eslint-disable-next-line no-unused-vars
import { motion as Motion } from "framer-motion";

// eslint-disable-next-line no-unused-vars
const LiquidButton = ({ icon: Icon, label, onClick }) => {
  return (
    <Motion.button
      whileHover={{ y: -2, backgroundColor: "#ffffff" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 w-full h-[100px]"
    >
      <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center mb-2 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
        <Icon size={20} strokeWidth={2.5} />
      </div>

      <span className="text-[12px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
        {label}
      </span>
    </Motion.button>
  );
};

export default LiquidButton;