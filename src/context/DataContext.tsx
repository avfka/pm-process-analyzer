import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ProcessEvent, DEMO_DATA } from '@/lib/demo-data';
import { ProcessAnalyzer } from '@/lib/analyzer';

const STORAGE_KEY = 'pm-analyzer-events';

interface DataContextType {
  events: ProcessEvent[];
  setEvents: (events: ProcessEvent[]) => void;
  analyzer: ProcessAnalyzer;
  loadDemoData: () => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEventsState] = useState<ProcessEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      if (events.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [events]);

  const analyzer = useMemo(() => new ProcessAnalyzer(events), [events]);

  const setEvents = (e: ProcessEvent[]) => setEventsState(e);
  const loadDemoData = () => setEventsState(DEMO_DATA);
  const clearData = () => setEventsState([]);

  return (
    <DataContext.Provider value={{ events, setEvents, analyzer, loadDemoData, clearData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
