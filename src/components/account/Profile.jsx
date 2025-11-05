import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../../utils/AuthContext';
import { CheckCircle2, XCircle } from 'lucide-react';

export const ProfilePage = () => {
  const { auth, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChangePassword = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage("Password reset link sent! Check your email.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setError("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">User ID</h3>
            <p className="mt-1 text-sm text-gray-900 break-words">{user.uid}</p>
          </div>

          <hr />

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-800">Account Actions</h3>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-auto inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Change Password"}
            </button>
            <p className="text-sm text-gray-500">
              This will send a password reset link to your email.
            </p>
          </div>

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{message}</h3>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
