import React, { createContext, useContext, useState, useMemo } from 'react';
import { ProcessEvent, DEMO_DATA } from '@/lib/demo-data';
import { ProcessAnalyzer } from '@/lib/analyzer';

interface DataContextType {
  events: ProcessEvent[];
  setEvents: (events: ProcessEvent[]) => void;
  analyzer: ProcessAnalyzer;
  loadDemoData: () => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<ProcessEvent[]>([]);

  const analyzer = useMemo(() => new ProcessAnalyzer(events), [events]);

  const loadDemoData = () => setEvents(DEMO_DATA);
  const clearData = () => setEvents([]);

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
