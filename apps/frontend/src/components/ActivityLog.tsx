import React from 'react';

interface ActivityLogProps {
  activities: string[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <div className="text-2xl mb-2">📋</div>
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {activities.map((activity, index) => (
        <div
          key={index}
          className={`text-xs p-2 rounded border-l-2 ${
            activity.includes('❌')
              ? 'bg-red-50 border-red-400 text-red-700'
              : activity.includes('✅') || activity.includes('🎉')
              ? 'bg-green-50 border-green-400 text-green-700'
              : activity.includes('🔄') || activity.includes('💳')
              ? 'bg-blue-50 border-blue-400 text-blue-700'
              : activity.includes('⏰')
              ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
              : 'bg-gray-50 border-gray-400 text-gray-700'
          }`}
        >
          {activity}
        </div>
      ))}
    </div>
  );
};

export default ActivityLog; 