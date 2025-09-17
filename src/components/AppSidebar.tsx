import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Zap,
  History,
  FileText,
  Settings,
  Star,
  Search,
  Clock,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const navigationItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Generate", url: "/app/generate", icon: Zap },
  { title: "History", url: "/app/history", icon: History },
  { title: "Templates", url: "/app/templates", icon: FileText },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

// Mock saved prompts data
const savedPrompts = [
  {
    id: 1,
    title: "Python Merge Sort",
    provider: "OpenAI",
    score: 3,
    timestamp: "2 hours ago",
    type: "Code"
  },
  {
    id: 2,
    title: "API Documentation",
    provider: "Claude",
    score: 3,
    timestamp: "5 hours ago",
    type: "Essay"
  },
  {
    id: 3,
    title: "JSON Schema",
    provider: "Gemini",
    score: 2,
    timestamp: "1 day ago",
    type: "JSON"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  const filteredPrompts = savedPrompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-80"}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Saved Prompts */}
        {!isCollapsed && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="flex items-center justify-between">
              <span className="text-muted-foreground">Saved Prompts</span>
              <Badge variant="secondary" className="text-xs">
                {savedPrompts.length}
              </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>

                {/* Prompt List */}
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredPrompts.map((prompt) => (
                    <Card key={prompt.id} className="p-2 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1">
                            <Bookmark className="h-3 w-3 text-primary" />
                            <p className="text-sm font-medium truncate">
                              {prompt.title}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {prompt.provider}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {prompt.type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {prompt.timestamp}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: prompt.score }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredPrompts.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No prompts found" : "No saved prompts yet"}
                    </p>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}