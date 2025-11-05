import { useState } from "react";
import { LoginScreen } from "./components/account/Login";
import { Loader2 } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // Import auth from firebase.js
import { useAuth } from "./utils/AuthContext";
import { Header } from "./Header";
import { CoordinatorDashboard } from "./components/dashboards/CoordinatorDashboard";
import { HospitalDashboard } from "./components/dashboards/HospitalDashboard";
import { ProfilePage } from "./components/account/Profile";

function App() {
  const LoadingScreen = ({ message = "Loading..." }) => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
        <span className="mt-4 text-lg font-medium text-gray-700">
          {message}
        </span>
      </div>
    </div>
  );

  const PendingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Account Pending
        </h1>
        <p className="text-gray-600">
          Your account is logged in, but a role has not been assigned to you.
          Please contact the system administrator to get access.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );

  const { user, userRole, loading } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!userRole) {
    return <PendingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header setPage={setPage} page={page} />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {page === "dashboard" && userRole === "NSS_COORDINATOR" && (
          <CoordinatorDashboard />
        )}
        {page === "dashboard" && userRole === "HOSPITAL" && (
          <HospitalDashboard />
        )}
        {page === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}

export default App;
