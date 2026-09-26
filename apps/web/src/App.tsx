import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PassportPage from './pages/PassportPage';
import { getRole, getToken } from './api';

const passportMatch = window.location.pathname.match(/^\/passport\/(.+)$/);

export default function App() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (passportMatch) {
    return <PassportPage batchId={decodeURIComponent(passportMatch[1])} />;
  }

  if (!getToken()) {
    return <LoginPage />;
  }

  if (getRole() === 'admin') {
    return <AdminDashboard />;
  }
  if (getRole() === 'farmer') {
    return <FarmerDashboard />;
  }

  return <LoginPage />;
}
