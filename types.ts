
export interface Alarm {
  id: string;
  time: string; // "HH:mm" format
  name: string;
  isActive: boolean;
  snooze: boolean;
}