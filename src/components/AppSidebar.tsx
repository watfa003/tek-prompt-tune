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
  { title: "Dashboard", url: "/app", icon: Home },
  { title: "AI Agent", url: "/app/ai-agent", icon: Bot },
  { title: "History", url: "/app/history", icon: History },
  { title: "Templates", url: "/app/templates", icon: FileText },
  { title: "Settings", url: "/app/settings", icon: Settings },
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
      <SidebarContent className="p-2 md:p-3 overflow-x-hidden">
        {/* User Info */}
        {userInfo && (
          <SidebarGroup>
          <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
              <div className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 rounded-[14px] md:rounded-[18px] glass-card neon-border mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-semibold flex items-center justify-center text-xs md:text-sm shadow-glow flex-shrink-0">
                  {userInfo.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                  <p className="text-xs md:text-sm font-semibold truncate">{userInfo.displayName}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground truncate">{userInfo.email}</p>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs md:text-sm px-2">
            {mode === 'api' ? 'API Management' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (mode === 'api' && 'section' in item) {
                          setApiSection(item.section);
                        } else if ('url' in item && currentPath !== item.url) {
                          navigate(item.url);
                        }
                      }}
                      className={`relative w-full justify-start group-data-[collapsible=icon]:justify-center transition-all duration-250 hover:-translate-y-0.5 rounded-xl group overflow-hidden ${
                        mode === 'api' && 'section' in item
                          ? isApiSectionActive(item.section) 
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-2 border-primary/40 shadow-[0_0_20px_rgba(110,231,255,0.2)] animate-border-glow' 
                            : 'hover:bg-white/5 hover:border-primary/20 border-2 border-transparent'
                          : 'url' in item && isActive(item.url) 
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-2 border-primary/40 shadow-[0_0_20px_rgba(110,231,255,0.2)] animate-border-glow' 
                            : 'hover:bg-white/5 hover:border-primary/20 border-2 border-transparent'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-250 ${
                        (mode === 'api' && 'section' in item && isApiSectionActive(item.section)) || 
                        ('url' in item && isActive(item.url)) 
                          ? 'text-primary drop-shadow-[0_0_8px_rgba(110,231,255,0.6)]' 
                          : 'group-hover:text-primary group-hover:drop-shadow-[0_0_6px_rgba(110,231,255,0.4)]'
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
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-primary">
                            {(item.score * 100).toFixed(0)}%
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