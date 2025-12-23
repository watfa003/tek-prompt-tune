import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Bot,
  History,
  FileText,
  Home,
  Star,
  Search,
  LogOut,
  Clock,
  Bookmark,
  Settings,
  Zap,
  RefreshCw,
  Code,
  Key,
  BookOpen,
  FlaskConical,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePromptData } from "@/context/PromptDataContext";
import { useSettings } from "@/hooks/use-settings";
import { useAppMode } from "@/context/AppModeContext";

const optimizerNavigationItems = [
  { title: "Dashboard", url: "/app", icon: Home, id: "dashboard-tab" },
  { title: "AI Agent", url: "/app/ai-agent", icon: Bot, id: "optimizer-tab" },
  { title: "Lab", url: "/app/lab", icon: FlaskConical, id: "lab-tab" },
  { title: "History", url: "/app/history", icon: History, id: "history-tab" },
  { title: "Templates", url: "/app/templates", icon: FileText, id: "templates-tab" },
  { title: "Settings", url: "/app/settings", icon: Settings, id: "settings-tab" },
];

const apiNavigationItems = [
  { title: "Agents", section: "agents", icon: Bot },
  { title: "Create Agent", section: "create", icon: Zap },
  { title: "API Keys", section: "keys", icon: Key },
  { title: "Logs", section: "logs", icon: FileText },
  { title: "Documentation", section: "docs", icon: BookOpen },
];

// Real saved prompts will be loaded from Supabase

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { historyItems } = usePromptData();
  const { mode, apiSection, setApiSection } = useAppMode();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState<{ email: string; displayName: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  const OWNER_EMAIL = 'watfa003@gmail.com';
  
  // Get favorite items from history
  const favoriteItems = historyItems.filter(item => item.isFavorite);

  // Load user information
  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const displayName = user.user_metadata?.username || user.user_metadata?.full_name || settings?.name || user.email?.split('@')[0] || 'User';
          setUserInfo({
            email: user.email || '',
            displayName: displayName
          });
          setIsOwner(user.email === OWNER_EMAIL);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
  }, [settings]);

  const isCollapsed = state === "collapsed";
  const handleLogout = async () => {
    try {
      // Clear all localStorage data before signing out
      const keysToRemove = [
        'promptOptimizer_originalPrompt',
        'promptOptimizer_taskDescription',
        'promptOptimizer_result',
        'promptOptimizer_speedResult',
        'promptOptimizer_payload',
        'promptOptimizer_isOptimizing',
        'promptOptimizer_startTime',
        'aiAgent_activeTab'
      ];
      
      // Remove all promptOptimizer keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Remove all user-specific cache keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('prompt_cache_') || key.startsWith('promptOptimizer_result_')) {
          localStorage.removeItem(key);
        }
      });

      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => currentPath === path;
  const isApiSectionActive = (section: string) => mode === 'api' && apiSection === section;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  const filteredFavorites = favoriteItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigationItems = mode === 'api' ? apiNavigationItems : optimizerNavigationItems;

  return (
    <Sidebar
      className="glass-panel border-r border-white/10"
      collapsible="icon"
    >
      <SidebarContent className="p-3" style={{ overflowX: "hidden" }}>
        {/* User Info */}
        {userInfo && (
          <SidebarGroup>
          <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
              <div className="flex items-center space-x-3 p-4 rounded-[18px] glass-card neon-border mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-semibold flex items-center justify-center text-sm shadow-glow flex-shrink-0">
                  {userInfo.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                  <p className="text-sm font-semibold truncate">{userInfo.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userInfo.email}</p>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-sm px-2">
            {mode === 'api' ? 'API Management' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      id={'id' in item ? item.id : undefined}
                      variant="ghost"
                      onClick={() => {
                        if (mode === 'api' && 'section' in item) {
                          setApiSection(item.section);
                        } else if ('url' in item && currentPath !== item.url) {
                          navigate(item.url);
                        }
                      }}
                      className={`relative w-full justify-start group-data-[collapsible=icon]:justify-center rounded-xl group overflow-hidden ${
                        mode === 'api' && 'section' in item
                          ? isApiSectionActive(item.section) 
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-2 border-primary/40 shadow-[0_0_15px_rgba(110,231,255,0.25)]' 
                            : 'hover:bg-white/5 hover:border-primary/20 border-2 border-transparent transition-[background-color,border-color] duration-200'
                          : 'url' in item && isActive(item.url) 
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-2 border-primary/40 shadow-[0_0_15px_rgba(110,231,255,0.25)]' 
                            : 'hover:bg-white/5 hover:border-primary/20 border-2 border-transparent transition-[background-color,border-color] duration-200'
                      }`}
                      style={{ 
                        transform: 'translate3d(0, 0, 0)',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 transition-[filter] duration-200 text-primary ${
                        (mode === 'api' && 'section' in item && isApiSectionActive(item.section)) || 
                        ('url' in item && isActive(item.url)) 
                          ? 'drop-shadow-[0_0_4px_rgba(110,231,255,0.6)]' 
                          : 'drop-shadow-[0_0_3px_rgba(110,231,255,0.4)]'
                      }`} />
                      <span className="text-sm truncate font-medium tracking-tight transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{item.title}</span>
                      {((mode === 'api' && 'section' in item && isApiSectionActive(item.section)) || 
                        ('url' in item && isActive(item.url))) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent rounded-r-full" />
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Favorites - Only show in optimizer mode */}
        {mode === 'optimizer' && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="flex items-center justify-between transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
              <span className="text-muted-foreground">Favorites</span>
              <Badge variant="secondary" className="text-xs">
                {favoriteItems.length}
              </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search favorites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                {/* Prompt List */}
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {filteredFavorites.map((item) => (
                    <Card 
                      key={item.id} 
                      className="p-2 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate('/app/history?tab=favorites')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1">
                            <Bookmark className="h-3 w-3 text-primary" />
                            <p className="text-sm font-medium truncate">
                              {item.title}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.provider}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.outputType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-primary">
                            {Math.round((item.score || 0) * 10)}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredFavorites.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No favorites found" : "No favorites yet"}
                    </p>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Access - Owner Only */}
        {isOwner && (
          <SidebarGroup className="mt-4">
            <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/admin')}
                      className={`w-full justify-start rounded-xl border-2 ${
                        currentPath.startsWith('/admin')
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'border-transparent hover:bg-amber-500/10 hover:border-amber-500/20 text-amber-500'
                      }`}
                    >
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">Admin Panel</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {/* Logout */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">Sign Out</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}