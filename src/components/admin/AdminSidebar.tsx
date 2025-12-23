import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  FlaskConical, 
  TrendingUp, 
  FileText, 
  Layers, 
  CheckCircle, 
  History, 
  Settings,
  Shield,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { path: '/admin/data-collection', icon: Database, label: 'Data Collection' },
  { path: '/admin/lab-analytics', icon: FlaskConical, label: 'Lab Analytics' },
  { path: '/admin/strategy-performance', icon: TrendingUp, label: 'Strategy Performance' },
  { path: '/admin/change-requests', icon: Sparkles, label: 'Weekly Change Requests' },
  { path: '/admin/master-prompt', icon: FileText, label: 'Master Prompt Manager' },
  { path: '/admin/strategy-definitions', icon: Layers, label: 'Strategy Definitions' },
  { path: '/admin/approvals', icon: CheckCircle, label: 'Approvals & Deployments' },
  { path: '/admin/audit-log', icon: History, label: 'Audit Log' },
  { path: '/admin/settings', icon: Settings, label: 'Admin Settings' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">Admin Panel</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("h-8 w-8", isCollapsed && "mx-auto")}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Owner Session Active</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
