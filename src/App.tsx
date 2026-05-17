import { useState } from 'react';
import LoginPage from './components/LoginPage';
import AdvocatePortal from './components/AdvocatePortal';

export default function App() {
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AdvocatePortal onBack={handleLogout} />;
}
