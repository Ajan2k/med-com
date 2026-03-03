import re

def find_missing_icons(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get the imports
    import_match = re.search(r"import \{([^}]+)\} from 'lucide-react';", content)
    if not import_match:
        print("No lucide-react imports found.")
        return
    
    imported_icons = set([i.strip() for i in import_match.group(1).split(',')])
    
    # Identify icon components in the JSX (e.g. <Calendar size={18} />)
    jsx_icons = set(re.findall(r'<([A-Z]\w+)\s+', content))
    # Identify icons passed as props (e.g. Icon={Pill})
    prop_icons = set(re.findall(r'Icon=\{([A-Z]\w+)\}', content))
    
    all_used_icons = jsx_icons.union(prop_icons)
    
    # Filter out known non-icon components (React components, etc.)
    # Dashboard is the main component. AppointmentsCalendar is local. Motion is from framer-motion.
    # AreaChart etc. are from recharts.
    non_icons = {'Dashboard', 'SidebarItem', 'AppointmentsCalendar', 'Motion', 'AnimatePresence', 'AreaChart', 'Area', 'XAxis', 'YAxis', 'CartesianGrid', 'RechartsTooltip', 'ResponsiveContainer', 'PieChart', 'Pie', 'Cell', 'BarChart', 'Bar', 'Legend', 'PortalCard'}
    
    missing = []
    for icon in all_used_icons:
        if icon not in imported_icons and icon not in non_icons:
            missing.append(icon)
            
    if missing:
        print(f"Missing Icons: {missing}")
    else:
        print("No icons missing.")

if __name__ == "__main__":
    find_missing_icons('D:/Desktop/med-com/frontend-admin/src/pages/Dashboard.jsx')
