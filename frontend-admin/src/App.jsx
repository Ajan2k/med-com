import { useState } from 'react';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_name');
    setIsLoggedIn(false);
  }

  return isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
}

export default App;