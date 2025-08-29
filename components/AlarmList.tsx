

import React from 'react';
import type { Alarm } from '../types';
import AlarmItem from './AlarmItem';

interface AlarmListProps {
  alarms: Alarm[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

const AlarmList: React.FC<AlarmListProps> = ({ alarms, onToggle, onDelete, onEdit, onAdd, onClose }) => {
  const sortedAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="h-full w-full bg-[#111] flex flex-col">
       {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <button onClick={onClose} className="text-orange-500 text-lg">Close</button>
        <h2 className="text-lg font-semibold text-white">Alarms</h2>
        <button onClick={onAdd} className="text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {alarms.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No Alarms</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAlarms.map(alarm => (
              <AlarmItem key={alarm.id} alarm={alarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmList;