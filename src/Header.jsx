import React from 'react';
import { Users, Hospital, LogOut, User, Droplets } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from './utils/AuthContext';

export const Header = ({ setPage, page }) => {
  const { auth, userRole } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // setPage('login'); // The main app will handle this
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getRoleName = () => {
    if (userRole === 'NSS_COORDINATOR') return 'NSS Coordinator';
    if (userRole === 'HOSPITAL') return 'Hospital Staff';
    return 'User';
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Droplets className="h-8 w-8 text-red-600" />
            <span className="ml-3 font-bold text-xl text-gray-800">NSS Bloodline Connect</span>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-sm text-gray-600 hidden sm:block">
              Logged in as: <strong className="font-medium">{getRoleName()}</strong>
            </span>
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  page === 'dashboard'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {userRole === 'NSS_COORDINATOR' ? <Users className="h-5 w-5" /> : <Hospital className="h-5 w-5" />}
                <span className="sr-only">Dashboard</span>
              </button>
              <button
                onClick={() => setPage('profile')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  page === 'profile'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </nav>
    </header>
  );
};

