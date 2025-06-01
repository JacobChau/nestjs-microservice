import React from 'react';
import { User } from '@/types';
import { DEMO_USERS, setAuthToken } from '@/services/api';
import { UserIcon } from '@heroicons/react/24/outline';

interface UserSelectorProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ currentUser, onUserChange }) => {
  const handleUserSelect = (user: User) => {
    onUserChange(user);
    if (user.token) {
      setAuthToken(user.token);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3">
        <UserIcon className="h-5 w-5 text-gray-400" />
        <select
          value={currentUser?.id || ''}
          onChange={(e) => {
            const user = DEMO_USERS.find(u => u.id === e.target.value);
            handleUserSelect(user || DEMO_USERS[0]);
          }}
          className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Select Demo User</option>
          {DEMO_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.tier})
            </option>
          ))}
        </select>
      </div>
      
      {currentUser && (
        <div className="absolute top-full mt-2 right-0 z-10">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">{currentUser.name}</div>
                <div className="text-xs text-gray-500">{currentUser.email}</div>
              </div>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(currentUser.tier)}`}>
              {currentUser.tier.toUpperCase()} TIER
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector; 