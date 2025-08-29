import React from 'react';
import type { Alarm } from '../types';

interface AlarmModalProps {
  alarm: Alarm;
  time: Date;
  onDismiss: () => void;
  onSnooze: () => void;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// A component to render a single digit to avoid repetition and ensure stability
const Digit: React.FC<{ digit: string }> = ({ digit }) => (
  <div className="relative w-[1ch] text-right">
    <span className="digital-text-ghost" aria-hidden="true">8</span>
    {/* Use a non-breaking space for empty hour padding to maintain width */}
    <span className="absolute inset-0 digital-text-active">{digit === ' ' ? '\u00A0' : digit}</span>
  </div>
);

const AlarmModal: React.FC<AlarmModalProps> = ({ time, onDismiss, onSnooze }) => {
  const hours = time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(/ (AM|PM)/, '');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const period = time.getHours() >= 12 ? 'PM' : 'AM';
  const currentDay = time.getDay();

  // Pad hours with a space for single-digit hours (e.g., ' 9') to split into two chars
  const hourDigits = hours.padStart(2, ' ').split('');
  const minuteDigits = minutes.split('');
  const secondDigits = seconds.split('');

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 font-digital z-50">
      {/* Snooze Button */}
      <button onClick={onSnooze} className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
        <div className="relative w-16 h-16">
            <svg viewBox="0 0 24 24" fill="currentColor" className="absolute w-full h-full">
                <path d="M4.222 17.204a8.915 8.915 0 0 0 2.254 3.327A9.01 9.01 0 0 0 12 22a9 9 0 0 0 9-9V9a2 2 0 0 0-2-2h-3.5a1 1 0 0 0-1 1v1.134a4.012 4.012 0 0 0-1.5-1.123A4.012 4.012 0 0 0 12 8a4 4 0 0 0-4 4v1a1 1 0 0 1-2 0v-1a6 6 0 0 1 5-5.917V5a3 3 0 0 1 6 0v2h2a4 4 0 0 1 4 4v4a11 11 0 0 1-11 11c-2.533 0-4.9-.84-6.84-2.316a10.93 10.93 0 0 1-3.938-5.748.75.75 0 1 1 1.458.368Z"/>
                <path d="M10 13.5a1 1 0 0 0 1 1h2a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1Z"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-sans text-lg font-bold">Zzz</span>
        </div>
        <span className="text-xl mt-2 tracking-wider">Snooze</span>
      </button>

      {/* Clock Display */}
      <div className="flex flex-col items-center justify-center tracking-widest">
        {/* Main clock face container */}
        <div className="flex justify-center items-stretch">
          {/* Time part HH:MM */}
          <div className="text-7xl md:text-9xl flex items-baseline">
              {/* Hours */}
              <div className="flex">
                <Digit digit={hourDigits[0]} />
                <Digit digit={hourDigits[1]} />
              </div>

              {/* Colon */}
              <div className="relative w-[1ch] text-center">
                  <span className="digital-text-ghost" aria-hidden="true">:</span>
                  <span className="absolute inset-0 digital-text-active">:</span>
              </div>

              {/* Minutes */}
              <div className="flex">
                <Digit digit={minuteDigits[0]} />
                <Digit digit={minuteDigits[1]} />
              </div>
          </div>

          {/* Side Column for AM/PM and Seconds */}
          <div className="ml-3 flex flex-col justify-between">
              {/* Period (AM/PM) */}
              <div className="relative w-[2ch] text-xl md:text-3xl">
                <span className="digital-text-ghost text-right" aria-hidden="true">PM</span>
                <span className="absolute inset-0 digital-text-active flex justify-end">{period}</span>
              </div>
              
              {/* Seconds */}
              <div className="text-4xl md:text-5xl flex">
                <Digit digit={secondDigits[0]} />
                <Digit digit={secondDigits[1]} />
              </div>
          </div>
        </div>

        <div className="flex space-x-2 md:space-x-4 text-2xl md:text-3xl mt-4">
            {DAYS.map((day, index) => (
              <span key={day} className={index === currentDay ? 'digital-text-active' : 'digital-text-ghost'}>
                {day}
              </span>
            ))}
        </div>
      </div>
      
      {/* Stop Button */}
      <button onClick={onDismiss} className="flex flex-col items-center text-red-500 hover:text-red-400 transition-colors">
        <div className="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors">
          <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"></path></svg>
        </div>
        <span className="text-xl mt-2 tracking-wider">Stop</span>
      </button>
    </div>
  );
};

export default AlarmModal;