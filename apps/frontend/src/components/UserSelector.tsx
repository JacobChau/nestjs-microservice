import React, { useState } from 'react';
import { User } from '@/types';
import { DEMO_USERS, authenticateDemoUser, clearAuthToken } from '@/services/api';
import toast from 'react-hot-toast';
import { UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface UserSelectorProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ currentUser, onUserChange }) => {
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleUserSelect = async (demoUser: typeof DEMO_USERS[0]) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setShowDropdown(false);
      
      // Clear previous authentication state before switching users
      clearAuthToken();
      
      toast.loading(`Authenticating ${demoUser.name}...`, { id: 'auth-loading' });
      
      // Authenticate the demo user
      const authenticatedUser = await authenticateDemoUser(demoUser);
      
      toast.success(`Welcome ${authenticatedUser.name}!`, { id: 'auth-loading' });
      onUserChange(authenticatedUser);
      
    } catch (error: any) {
      console.error('Authentication failed:', error);
      toast.error(`Authentication failed: ${error.message}`, { id: 'auth-loading' });
      onUserChange(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    onUserChange(null);
    setShowDropdown(false);
    toast.success('Logged out successfully');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'premium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'regular': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip': return '👑';
      case 'premium': return '⭐';
      case 'regular': return '👤';
      default: return '👤';
    }
  };

  return (
    <div className="relative">
      {currentUser ? (
        <div className="flex items-center space-x-3">
          {/* Current User Display */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {getTierIcon(currentUser.tier)}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{currentUser.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(currentUser.tier)}`}>
                  {currentUser.tier.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">{currentUser.email}</div>
            </div>
          </div>

          {/* Switch User Button */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            >
              Switch User
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Demo Users</h3>
                  <p className="text-xs text-gray-500">Select a different user to test with</p>
                </div>
                
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      disabled={loading || currentUser.email === user.email}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                        currentUser.email === user.email
                          ? 'bg-primary-50 border border-primary-200'
                          : 'hover:bg-gray-50'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getTierIcon(user.tier)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 truncate">{user.name}</span>
                          {currentUser.email === user.email && (
                            <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 truncate">{user.email}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(user.tier)}`}>
                            {user.tier}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">Demo User Required</div>
            <div className="text-xs text-gray-500">Select a user to start booking</div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
              <span>Select User</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Demo Users</h3>
                  <p className="text-xs text-gray-500">Choose a user to authenticate and start booking</p>
                </div>
                
                <div className="p-2 space-y-1">
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      disabled={loading}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 transition-colors ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getTierIcon(user.tier)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 truncate">{user.email}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(user.tier)}`}>
                            {user.tier}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default UserSelector; 