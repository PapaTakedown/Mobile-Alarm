

import React from 'react';
import type { Alarm } from '../types';

interface AlarmItemProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void; // Kept for potential future use (e.g., swipe to delete)
  onEdit: (id: string) => void;
}

const formatTo12Hour = (time24: string): { time: string, period: string } => {
  const [hourString, minute] = time24.split(':');
  const hour = parseInt(hourString, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  let hour12 = hour % 12;
  if (hour12 === 0) {
    hour12 = 12; // Handle midnight (00:xx) and noon (12:xx)
  }
  return { time: `${hour12}:${minute}`, period };
};

const AlarmItem: React.FC<AlarmItemProps> = ({ alarm, onToggle, onEdit }) => {
  const { time, period } = formatTo12Hour(alarm.time);

  return (
    <div 
      onClick={() => onEdit(alarm.id)}
      className={`flex items-center justify-between py-2 border-b border-gray-800 cursor-pointer`}
    >
      <div className={`${alarm.isActive ? 'text-white' : 'text-gray-500'}`}>
        <p className="font-light">
          <span className="text-5xl">{time}</span>
          <span className="text-2xl ml-1">{period}</span>
        </p>
        <p className="text-sm">{alarm.name}</p>
      </div>
      <div className="flex items-center space-x-2">
        {/* Toggle Switch */}
        <label 
            htmlFor={`toggle-${alarm.id}`} 
            className="flex items-center cursor-pointer"
            onClick={(e) => e.stopPropagation()} // Prevent item click when toggling
        >
          <div className="relative">
            <input 
              type="checkbox" 
              id={`toggle-${alarm.id}`} 
              className="sr-only" 
              checked={alarm.isActive} 
              onChange={() => onToggle(alarm.id)} 
            />
            <div className={`block w-12 h-7 rounded-full transition-colors ${alarm.isActive ? 'bg-green-500' : 'bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 w-5 h-5 rounded-full transition-transform bg-white ${alarm.isActive ? 'transform translate-x-5' : ''}`}></div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default AlarmItem;