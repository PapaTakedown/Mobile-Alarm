import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Alarm } from '../types';

interface SetAlarmFormProps {
  onSave: (alarmData: Omit<Alarm, 'id' | 'isActive'>) => void;
  onCancel: () => void;
  alarmToEdit: Alarm | null;
}

const hours = Array.from({ length: 12 }, (_, i) => (i + 1));
const minutes = Array.from({ length: 60 }, (_, i) => i);
const periods = ['AM', 'PM'];

const ITEM_HEIGHT = 44; // h-11

const TimePickerColumn: React.FC<{
  values: (string | number)[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  className?: string;
}> = ({ values, selectedValue, onSelect, className }) => {
  const columnRef = useRef<HTMLDivElement>(null);
  // Fix: The return type of `setTimeout` in the browser is `number`, not `NodeJS.Timeout`.
  const isInteracting = useRef<number | null>(null);

  useEffect(() => {
    const scroller = columnRef.current;
    if (scroller) {
      const selectedIndex = values.indexOf(selectedValue);
      if (selectedIndex !== -1) {
        scroller.scrollTop = selectedIndex * ITEM_HEIGHT;
      }
    }
  }, [selectedValue, values]);
  
  const handleScroll = useCallback(() => {
    if (isInteracting.current) {
      clearTimeout(isInteracting.current);
    }
    isInteracting.current = setTimeout(() => {
      const scroller = columnRef.current;
      if (scroller) {
        const selectedIndex = Math.round(scroller.scrollTop / ITEM_HEIGHT);
        const newValue = values[selectedIndex];
        if (newValue !== undefined) {
          onSelect(newValue);
        }
      }
    }, 150);
  }, [onSelect, values]);

  return (
    <div
      ref={columnRef}
      onScroll={handleScroll}
      className={`time-picker-column h-56 overflow-y-scroll overscroll-contain ${className}`}
    >
      <div style={{ height: (values.length + 4) * ITEM_HEIGHT }}>
        <div className="h-22" /> {/* Padding for top */}
        {values.map((value) => (
          <div key={value} className="time-picker-item h-11 flex items-center justify-center text-2xl">
            {typeof value === 'number' ? String(value).padStart(2, '0') : value}
          </div>
        ))}
        <div className="h-22" /> {/* Padding for bottom */}
      </div>
    </div>
  );
};


const SetAlarmForm: React.FC<SetAlarmFormProps> = ({ onSave, onCancel, alarmToEdit }) => {
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(30);
  const [period, setPeriod] = useState('AM');
  const [name, setName] = useState('Alarm');
  const [snooze, setSnooze] = useState(true);

  useEffect(() => {
    if (alarmToEdit) {
      const [hour24String, minuteString] = alarmToEdit.time.split(':');
      const hour24 = parseInt(hour24String, 10);
      
      const newPeriod = hour24 >= 12 ? 'PM' : 'AM';
      let newHour12 = hour24 % 12;
      if (newHour12 === 0) newHour12 = 12;

      setHour(newHour12);
      setMinute(parseInt(minuteString, 10));
      setPeriod(newPeriod);
      setName(alarmToEdit.name);
      setSnooze(alarmToEdit.snooze);
    } else {
      // Reset to default for new alarm
      const now = new Date();
      let defaultHour = now.getHours() % 12;
      if (defaultHour === 0) defaultHour = 12;
      setHour(defaultHour);
      setMinute(now.getMinutes());
      setPeriod(now.getHours() >= 12 ? 'PM' : 'AM');
      setName('Alarm');
      setSnooze(true);
    }
  }, [alarmToEdit]);

  const handleSave = () => {
    let hour24 = hour;
    if (period === 'PM' && hour < 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }
    
    const time24 = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    onSave({ time: time24, name, snooze });
  };
  
  const FormRow: React.FC<{ label: string; children: React.ReactNode; isFirst?: boolean; isLast?: boolean; }> = ({ label, children, isFirst, isLast }) => (
    <div className={`flex items-center justify-between bg-[#2C2C2E] px-4 h-11 ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg' : ''}`}>
      <span className="text-white">{label}</span>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <button onClick={onCancel} className="text-orange-500 text-lg">Cancel</button>
        <h2 className="text-lg font-semibold text-white">{alarmToEdit ? 'Edit Alarm' : 'Add Alarm'}</h2>
        <button onClick={handleSave} className="text-orange-500 text-lg font-bold">Save</button>
      </div>

      {/* Time Picker */}
      <div className="relative p-4">
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-11 bg-gray-700/50 rounded-lg pointer-events-none" />
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-gray-600 pointer-events-none" />
        <div className="absolute inset-x-4 bottom-1/2 translate-y-1/2 h-px bg-gray-600 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full time-picker-overlay-top pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full time-picker-overlay-bottom pointer-events-none" />
        
        <div className="flex items-center justify-center text-gray-400">
          <TimePickerColumn values={hours} selectedValue={hour} onSelect={(v) => setHour(v as number)} className="w-1/4 justify-end text-right" />
          <div className='text-3xl pb-2'>:</div>
          <TimePickerColumn values={minutes} selectedValue={minute} onSelect={(v) => setMinute(v as number)} className="w-1/4 justify-start text-left" />
          <TimePickerColumn values={periods} selectedValue={period} onSelect={(v) => setPeriod(v as string)} className="w-1/3 justify-start text-left" />
        </div>
      </div>
      
      {/* Options */}
      <div className="px-4 py-8 space-y-px">
        <FormRow label="Repeat" isFirst>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>Never</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </FormRow>

        <FormRow label="Label">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-right text-gray-400 focus:outline-none focus:text-white" 
          />
        </FormRow>
        
        <FormRow label="Sound">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>Radar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </FormRow>

        <FormRow label="Snooze" isLast>
           <label htmlFor="snooze-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                id="snooze-toggle" 
                className="sr-only" 
                checked={snooze} 
                onChange={() => setSnooze(!snooze)} 
              />
              <div className={`block w-12 h-7 rounded-full transition-colors ${snooze ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 w-5 h-5 rounded-full transition-transform bg-white ${snooze ? 'transform translate-x-5' : ''}`}></div>
            </div>
          </label>
        </FormRow>
      </div>
    </div>
  );
};

export default SetAlarmForm;