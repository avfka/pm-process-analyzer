import React from 'react';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-7xl mx-auto p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
