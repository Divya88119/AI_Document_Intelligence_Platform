import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  BarChart3,
  Users,
  BrainCircuit,
  ExternalLink,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents Hub', icon: Files },
    { to: '/analysis', label: 'Data Analytics Studio', icon: BarChart3 },
    { to: '/upload', label: 'Upload & Process', icon: UploadCloud },
  ];

  if (isAdmin) {
    navItems.push({ to: '/users', label: 'User Management', icon: Users });
  }

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/30 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            AI Engine
          </div>
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/40 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Multi-Engine Ready</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Equipped with OCR, OpenXML & PDF extraction, automated classification, and semantic Q&A.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/60">
        <a
          href="http://localhost:5000/swagger"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
        >
          <span>Swagger API Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <div className="text-[10px] text-slate-600 text-center mt-3">
          Document Intelligence v1.0
        </div>
      </div>
    </aside>
  );
};

