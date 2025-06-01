import React, { useState } from 'react';
import { User } from '@/types';
import { DEMO_USERS } from '@/services/api';
import { 
  InformationCircleIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DemoGuideProps {
  currentUser: User | null;
}

const DemoGuide: React.FC<DemoGuideProps> = ({ currentUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getUserSyncStatus = (user: typeof DEMO_USERS[0]) => {
    if (!currentUser) return 'not-auth';
    return currentUser.email === user.email ? 'active' : 'available';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'available': return <UserGroupIcon className="w-4 h-4 text-blue-600" />;
      case 'not-auth': return <XMarkIcon className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Currently Active';
      case 'available': return 'Available';
      case 'not-auth': return 'Select User First';
      default: return '';
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'regular': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Seminar Demo Guide</h3>
            <p className="text-xs text-blue-700">
              Frontend & Postman Collection are synced with the same 3 demo users
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          {isExpanded ? (
            <XMarkIcon className="w-5 h-5" />
          ) : (
            <ClipboardDocumentListIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* User Sync Status */}
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-2" />
              Demo Users (Synced with Postman)
            </h4>
            <div className="space-y-2">
              {DEMO_USERS.map((user) => {
                const status = getUserSyncStatus(user);
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 rounded-md border ${
                      status === 'active' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getTierIcon(user.tier)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{user.email}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(user.tier)}`}>
                            {user.tier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className="text-xs font-medium text-gray-600">
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demo Instructions */}
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Frontend ↔ Postman Demo Flow
            </h4>
            <div className="bg-white rounded-md p-3 border border-blue-200">
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-medium">1.</span>
                  <span><strong>Frontend:</strong> Select Alice/Bob/Charlie to authenticate</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-medium">2.</span>
                  <span><strong>Frontend:</strong> Book seats and see real-time updates</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-medium">3.</span>
                  <span><strong>Postman:</strong> Run concurrent booking scenarios</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-medium">4.</span>
                  <span><strong>Watch:</strong> Frontend shows live seat conflicts & updates!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Tips */}
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Quick Demo Tips
            </h4>
            <div className="bg-white rounded-md p-3 border border-blue-200">
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• <strong>Concurrent Test:</strong> Open multiple browser tabs with different users</li>
                <li>• <strong>Race Conditions:</strong> Use Postman to simulate simultaneous bookings</li>
                <li>• <strong>Real-time Updates:</strong> Watch seat status change instantly across tabs</li>
                <li>• <strong>Conflict Demo:</strong> Try booking same seat in both frontend & Postman</li>
              </ul>
            </div>
          </div>

          {/* Environment Sync Status */}
          <div className="bg-white rounded-md p-3 border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">
                Environment Synced: Same users, tokens, and event ID across Frontend & Postman
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoGuide; 