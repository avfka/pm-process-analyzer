import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  ActivitySquare,
  BookOpen,
  FileSearch,
  LayoutDashboard,
  Lightbulb,
  Route,
  Star,
  UploadCloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Операционная нагрузка', href: '/', icon: LayoutDashboard },
  { name: 'Данные', href: '/upload', icon: UploadCloud },
  { name: 'AS-IS анализ', href: '/analysis', icon: FileSearch },
  { name: 'Ai рейтинг', href: '/rating', icon: Star },
  { name: 'Рекомендации', href: '/recommendations', icon: Lightbulb },
  { name: 'TO-BE модель', href: '/to-be', icon: Route },
  { name: 'Документация', href: '/research', icon: BookOpen },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl">
      <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-sidebar-border/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <ActivitySquare size={18} strokeWidth={2.5} />
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">PM Ops Optimizer</span>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-6">
        <div className="text-xs font-medium text-sidebar-foreground/50 mb-4 px-3 uppercase tracking-wider">
          PM automation
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className="outline-none">
                <div
                  className={cn(
                    "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-semibold text-xs">
            PM
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Продакт-менеджер</span>
            <span className="text-xs text-sidebar-foreground/60">Vercel версия</span>
          </div>
        </div>
      </div>
    </div>
  );
}
