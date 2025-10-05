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
  Sparkles,
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
  { title: "AutoPilot", url: "/app/autopilot", icon: Sparkles },
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
      className={isCollapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="p-2">
        {/* User Info */}
        {!isCollapsed && userInfo && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                  {userInfo.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userInfo.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userInfo.email}</p>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            {mode === 'api' ? 'API Management' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
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
                      className={`w-full justify-start transition-all duration-200 hover:scale-[1.02] ${
                        mode === 'api' && 'section' in item
                          ? isApiSectionActive(item.section) ? getNavCls({ isActive: true }) : getNavCls({ isActive: false })
                          : 'url' in item && isActive(item.url) ? getNavCls({ isActive: true }) : getNavCls({ isActive: false })
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Favorites - Only show in optimizer mode */}
        {!isCollapsed && mode === 'optimizer' && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="flex items-center justify-between">
              <span className="text-muted-foreground">Favorites</span>
              <Badge variant="secondary" className="text-xs">
                {favoriteItems.length}
              </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
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
                <div className="space-y-1 max-h-48 overflow-y-auto">
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
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <LogOut className="h-4 w-4" />
                    {!isCollapsed && <span>Sign Out</span>}
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