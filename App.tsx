

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Clock from './components/Clock';
import AlarmList from './components/AlarmList';
import SetAlarmForm from './components/SetAlarmForm';
import AlarmModal from './components/AlarmModal';
import { useCurrentTime } from './hooks/useCurrentTime';
import type { Alarm } from './types';
import { ALARM_SOUND_URL, SNOOZE_MINUTES } from './constants';

type Theme = 'blue' | 'red' | 'green' | 'white';
type AlarmModalView = 'list' | 'form';
type SettingsView = 'main' | 'themes' | 'install' | 'about';

const App: React.FC = () => {
  const currentTime = useCurrentTime();
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const savedAlarms = localStorage.getItem('alarms');
      return savedAlarms ? JSON.parse(savedAlarms) : [];
      // FIX: Added curly braces to the catch block to fix a syntax error.
    } catch (error) {
      console.error("Could not parse alarms from localStorage", error);
      return [];
    }
  });

  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [isAlarmManagerOpen, setIsAlarmManagerOpen] = useState(false);
  const [alarmModalView, setAlarmModalView] = useState<AlarmModalView>('list');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const snoozeTimeoutRef = useRef<number | null>(null);
  const [snoozingAlarmId, setSnoozingAlarmId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('blue');
  
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);


  // Effect for PWA installation prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Load theme from localStorage on initial mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'blue' || savedTheme === 'red' || savedTheme === 'green' || savedTheme === 'white') {
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      console.error("Could not load theme from localStorage", error);
    }
  }, []);

  // Apply theme to body and save to localStorage on change
  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error("Could not save theme to localStorage", error);
    }
  }, [theme]);


  useEffect(() => {
    try {
      localStorage.setItem('alarms', JSON.stringify(alarms));
    } catch(error) {
      console.error("Could not save alarms to localStorage", error);
    }
  }, [alarms]);

  useEffect(() => {
    if (!isAlarmManagerOpen) {
      setEditingAlarm(null); // Cancel edit if modal is closed
      setAlarmModalView('list'); // Reset to list view when closing
    }
  }, [isAlarmManagerOpen]);

  const checkAlarms = useCallback(() => {
    if (ringingAlarmId || snoozingAlarmId) return;

    const currentTimeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const alarmToRing = alarms.find(alarm => alarm.time === currentTimeStr && alarm.isActive);

    if (alarmToRing) {
      setRingingAlarmId(alarmToRing.id);
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [currentTime, alarms, ringingAlarmId, snoozingAlarmId]);

  useEffect(() => {
    checkAlarms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  // Cleanup snooze timeout on unmount
  useEffect(() => {
    return () => {
      if (snoozeTimeoutRef.current) {
        clearTimeout(snoozeTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveAlarm = (alarmData: Omit<Alarm, 'id' | 'isActive'>) => {
    if (editingAlarm) {
      // Update existing alarm
      setAlarms(prevAlarms =>
        prevAlarms.map(alarm =>
          alarm.id === editingAlarm.id ? { ...alarm, ...alarmData } : alarm
        )
      );
    } else {
      // Add new alarm
      const newAlarm: Alarm = {
        ...alarmData,
        id: crypto.randomUUID(),
        isActive: true,
      };
      setAlarms(prevAlarms => [...prevAlarms, newAlarm]);
    }
    setEditingAlarm(null);
    setAlarmModalView('list');
  };

  const handleStartAdd = () => {
    setEditingAlarm(null);
    setAlarmModalView('form');
  }

  const handleStartEdit = (id: string) => {
    const alarmToEdit = alarms.find(alarm => alarm.id === id);
    if (alarmToEdit) {
      setEditingAlarm(alarmToEdit);
      setAlarmModalView('form');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingAlarm(null);
    setAlarmModalView('list');
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === id ? { ...alarm, isActive: !alarm.isActive } : alarm
      )
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
  };
  
  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const handleDismiss = () => {
    stopAudio();
    if (snoozeTimeoutRef.current) {
      clearTimeout(snoozeTimeoutRef.current);
    }
    
    const alarmToDismiss = alarms.find(a => a.id === ringingAlarmId);
    if (alarmToDismiss && !alarmToDismiss.snooze) { // Only disable non-snoozable alarms
      setAlarms(prevAlarms =>
        prevAlarms.map(alarm =>
          alarm.id === ringingAlarmId ? { ...alarm, isActive: false } : alarm
        )
      );
    }
    setRingingAlarmId(null);
    setSnoozingAlarmId(null);
  };

  const handleSnooze = () => {
    stopAudio();
    if (snoozeTimeoutRef.current) {
      clearTimeout(snoozeTimeoutRef.current);
    }
    const snoozingId = ringingAlarmId;
    setSnoozingAlarmId(snoozingId);
    setRingingAlarmId(null);

    snoozeTimeoutRef.current = window.setTimeout(() => {
        setRingingAlarmId(snoozingId);
        setSnoozingAlarmId(null);
        audioRef.current?.play().catch(e => console.error("Audio play failed after snooze:", e));
    }, SNOOZE_MINUTES * 60 * 1000);
  };
  

  const ringingAlarm = alarms.find(alarm => alarm.id === ringingAlarmId);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Failed to copy link: ', err));
  };

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredInstallPrompt(null);
    setIsSettingsOpen(false);
  };


  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans">
      <button
        onClick={() => {
          setIsSettingsOpen(true);
          setSettingsView('main');
        }}
        className="fixed top-8 right-8 text-active-primary hover:text-heading-primary transition-colors transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-primary z-30"
        aria-label="Open settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <main className="max-w-3xl mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Clock time={currentTime} />
      </main>

      <button
        onClick={() => setIsAlarmManagerOpen(true)}
        className="fixed bottom-8 right-8 text-active-primary hover:text-heading-primary transition-colors transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-primary z-30"
        aria-label="Manage alarms"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      {isAlarmManagerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
        >
          <div 
            className="bg-[#1C1C1E] h-full w-full max-w-lg flex flex-col"
          >
             {alarmModalView === 'list' && (
                <AlarmList 
                    alarms={alarms} 
                    onToggle={toggleAlarm} 
                    onDelete={deleteAlarm} 
                    onEdit={handleStartEdit} 
                    onAdd={handleStartAdd}
                    onClose={() => setIsAlarmManagerOpen(false)}
                />
             )}
             {alarmModalView === 'form' && (
                <SetAlarmForm 
                    onSave={handleSaveAlarm}
                    onCancel={handleCancelEdit}
                    alarmToEdit={editingAlarm}
                />
             )}
          </div>
        </div>
      )}
      
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 backdrop-blur-sm"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg p-6 shadow-2xl border border-gray-800 w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-heading-primary tracking-wide">
                    {settingsView === 'main' && 'Settings'}
                    {settingsView === 'themes' && 'Themes'}
                    {settingsView === 'install' && 'Install App'}
                    {settingsView === 'about' && 'About'}
                  </h2>
                  <button 
                      onClick={() => setIsSettingsOpen(false)} 
                      className="text-gray-400 hover:text-white"
                      aria-label="Close"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>
            
            <div className="overflow-y-auto pr-2 space-y-1">
            {settingsView === 'main' && (
              <>
                <button
                  onClick={() => setSettingsView('themes')}
                  className="group flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4H7zm0 0L11 21m-4-4h4m-4-4h4m-4-4h4m6.5-3a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM12 5a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  <span className="text-lg text-white">Themes</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {deferredInstallPrompt && (
                 <button
                  onClick={() => setSettingsView('install')}
                  className="group flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-lg text-white">Install App</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                )}
                <button
                  onClick={() => setSettingsView('about')}
                  className="group flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg text-white">About</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {settingsView === 'install' && (
               <div>
                 <button
                  onClick={() => setSettingsView('main')}
                  className="group flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors mb-4 w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-lg text-white">Back to Settings</span>
                </button>
                <div className="bg-gray-800 p-4 rounded-lg text-left">
                  {deferredInstallPrompt ? (
                    <>
                      <p className="text-gray-300 mb-4">
                        Install this app on your device for quick access and an offline experience.
                      </p>
                      <button 
                        onClick={handleInstallClick}
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg w-full transition-colors text-lg flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Install App
                      </button>
                      <div className="my-6 border-t border-gray-700"></div>
                      <p className="text-gray-300 mb-2 text-sm text-center">
                          Or share with another device:
                      </p>
                      <div className="mt-4 text-center">
                        <div className="flex justify-center mb-4 p-2 bg-white rounded-lg">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.href)}`}
                            alt="QR Code"
                            width="160"
                            height="160"
                          />
                        </div>
                        <button 
                          onClick={handleCopyLink}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-300">
                        This app has already been installed or cannot be installed from this browser. You can continue to use it here.
                    </p>
                  )}
                </div>
               </div>
            )}

            {settingsView === 'about' && (
               <div>
                 <button
                  onClick={() => setSettingsView('main')}
                  className="group flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors mb-4 w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-lg text-white">Back to Settings</span>
                </button>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                  <p className="text-xl text-white font-semibold">Modern Alarm Clock</p>
                  <p className="text-gray-400 mt-1">Version 1.0.0</p>
                  <div className="my-4 border-t border-gray-700"></div>
                  <p className="text-gray-300">fully coded by Justin Emker</p>
                </div>
               </div>
            )}

            {settingsView === 'themes' && (
              <div>
                <button
                  onClick={() => setSettingsView('main')}
                  className="group flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors mb-4 w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-lg text-white">Back to Settings</span>
                </button>
                <div className="flex flex-col space-y-2">
                  {/* Digital Blue Theme Button */}
                  <button
                    onClick={() => setTheme('blue')}
                    disabled={theme === 'blue'}
                    className={`group flex items-center p-3 rounded-lg transition-colors w-full text-left ${
                      theme === 'blue' ? 'bg-blue-900/50 ring-2 ring-cyan-500 cursor-default' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-cyan-500 mr-4 border-2 border-white/50"></div>
                    <span className="text-lg text-white">Digital Blue</span>
                    {theme === 'blue' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Digital Red Theme Button */}
                  <button
                    onClick={() => setTheme('red')}
                    disabled={theme === 'red'}
                    className={`group flex items-center p-3 rounded-lg transition-colors w-full text-left ${
                      theme === 'red' ? 'bg-red-900/50 ring-2 ring-red-500 cursor-default' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500 mr-4 border-2 border-white/50"></div>
                    <span className="text-lg text-white">Digital Red</span>
                    {theme === 'red' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Digital Green Theme Button */}
                  <button
                    onClick={() => setTheme('green')}
                    disabled={theme === 'green'}
                    className={`group flex items-center p-3 rounded-lg transition-colors w-full text-left ${
                      theme === 'green' ? 'bg-green-900/50 ring-2 ring-green-500 cursor-default' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500 mr-4 border-2 border-white/50"></div>
                    <span className="text-lg text-white">Digital Green</span>
                    {theme === 'green' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Digital White Theme Button */}
                  <button
                    onClick={() => setTheme('white')}
                    disabled={theme === 'white'}
                    className={`group flex items-center p-3 rounded-lg transition-colors w-full text-left ${
                      theme === 'white' ? 'bg-gray-700 ring-2 ring-gray-400 cursor-default' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white mr-4 border-2 border-white/50"></div>
                    <span className="text-lg text-white">Digital White</span>
                    {theme === 'white' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} src={ALARM_SOUND_URL} loop />
      {ringingAlarm && <AlarmModal alarm={ringingAlarm} onDismiss={handleDismiss} onSnooze={handleSnooze} time={currentTime} />}
    </div>
  );
};

export default App;