import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Mail,
  MessagesSquare,
  Map,
  Briefcase,
  User,
  Settings as SettingsIcon,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/cover-letters', label: 'Cover Letters', icon: Mail },
  { to: '/interviews', label: 'Interview Prep', icon: MessagesSquare },
  { to: '/roadmaps', label: 'Learning Roadmap', icon: Map },
  { to: '/applications', label: 'Applications', icon: Briefcase },
];

const bottomItems = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-surface border-r border-border">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ember/15 text-ember">
          <Flame className="h-4.5 w-4.5" />
        </div>
        <span className="font-display font-semibold text-base tracking-tight">CareerForge</span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ember/12 text-ember'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4 space-y-0.5">
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ember/12 text-ember'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
