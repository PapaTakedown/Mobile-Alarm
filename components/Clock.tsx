import React from 'react';

interface ClockProps {
  time: Date;
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

const Clock: React.FC<ClockProps> = ({ time }) => {
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
    <div className="flex flex-col items-center justify-center font-digital tracking-widest p-4">
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
      
      {/* Days of the week */}
      <div className="flex space-x-2 md:space-x-4 text-2xl md:text-3xl mt-4">
        {DAYS.map((day, index) => (
          <span key={day} className={index === currentDay ? 'digital-text-active' : 'digital-text-ghost'}>
            {day}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Clock;