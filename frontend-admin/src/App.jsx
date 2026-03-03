import { useState } from 'react';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import PortalSelector from './pages/PortalSelector';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [selectedPortal, setSelectedPortal] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_name');
    setIsLoggedIn(false);
    setSelectedPortal(null);
  }

  if (isLoggedIn) return <Dashboard onLogout={handleLogout} onBack={() => { setSelectedPortal(null); setIsLoggedIn(false); }} />;
  if (!selectedPortal) return <PortalSelector onSelect={setSelectedPortal} />;

  return <AdminLogin portal={selectedPortal} onLogin={() => setIsLoggedIn(true)} onBack={() => setSelectedPortal(null)} />;
}

export default App;