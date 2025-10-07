import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TemplateCreationDialog } from "@/components/templates/TemplateCreationDialog";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  template: string;
  favorites_count: number;
  uses_count: number;
  user_id: string;
  output_type: string | null;
  is_official?: boolean;
}

interface ProfileMap {
  [userId: string]: string;
}

const categories = ["All", "Productivity", "Writing", "Code", "Marketing", "Analytics", "Creative", "Business", "Education", "Custom"];

interface PromptTemplatesProps {
  onUseTemplate: (template: string, outputType: string) => void;
}

export const PromptTemplates = ({ onUseTemplate }: PromptTemplatesProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<"all" | "official" | "community">("all");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSelectingForInfluence = searchParams.get('selectForInfluence') === 'true';
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<Template[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("featured");

  useEffect(() => {
    loadTemplates();
    loadFavorites();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: templatesData, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('is_public', true)
        .order('uses_count', { ascending: false });

      if (error) throw error;

      const featured = templatesData?.slice(0, 20) || [];
      setFeaturedTemplates(featured);
      setTemplates(templatesData || []);

      // Load profiles for all template creators
      const userIds = [...new Set(templatesData?.map(t => t.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const map: ProfileMap = {};
      profiles?.forEach(p => {
        map[p.user_id] = p.username;
      });
      setProfileMap(map);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'template');

      if (!favorites) return;

      const favoriteIds = favorites.map(f => f.item_id);
      if (favoriteIds.length === 0) return;

      const { data: templatesData } = await supabase
        .from('prompt_templates')
        .select('*')
        .in('id', favoriteIds);

      setFavoriteTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesFilter = templateFilter === "all" || 
      (templateFilter === "official" && template.is_official === true) ||
      (templateFilter === "community" && template.is_official !== true);
    const username = profileMap[template.user_id] || "";
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesFilter && matchesSearch;
  });

  const handleUseTemplate = (template: string, outputType: string) => {
    if (isSelectingForInfluence) {
      navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(template)}&selectedType=template`);
    } else {
      // Set template as both the initial prompt AND as influence guidance
      onUseTemplate(template, outputType || 'text');
      // Also navigate to the optimizer with template pre-filled as influence
      navigate(`/app?influence=${encodeURIComponent(template)}&influenceType=template&prompt=${encodeURIComponent(template)}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Templates</h2>
        </div>
        <div className="text-center py-12">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSelectingForInfluence && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-medium text-primary mb-1">Select a Template for Influence</h3>
          <p className="text-sm text-muted-foreground">
            Choose a template to influence your AI optimization process.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Templates</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isSelectingForInfluence ? "Select a template to influence optimization" : "Discover and share prompt templates"}
          </p>
        </div>
        <TemplateCreationDialog />
      </div>

      {/* Template Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          <Button
            variant={templateFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTemplateFilter("all")}
          >
            All Templates
          </Button>
          <Button
            variant={templateFilter === "official" ? "default" : "outline"}
            size="sm"
            onClick={() => setTemplateFilter("official")}
          >
            PromptEK Official
          </Button>
          <Button
            variant={templateFilter === "community" ? "default" : "outline"}
            size="sm"
            onClick={() => setTemplateFilter("community")}
          >
            Community
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by title, description, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="favorites">My Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          <p className="text-sm text-muted-foreground">Most used templates by the community</p>
          {featuredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No featured templates yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  username={profileMap[template.user_id] || (template.is_official ? 'PromptEK' : 'Unknown')}
                  onUseTemplate={(t) => handleUseTemplate(t, template.output_type || 'text')}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No templates found. Try adjusting your search or filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  username={profileMap[template.user_id] || (template.is_official ? 'PromptEK' : 'Unknown')}
                  onUseTemplate={(t) => handleUseTemplate(t, template.output_type || 'text')}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <p className="text-sm text-muted-foreground">Your favorited templates</p>
          {favoriteTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No favorites yet. Start exploring and favoriting templates!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  username={profileMap[template.user_id] || (template.is_official ? 'PromptEK' : 'Unknown')}
                  onUseTemplate={(t) => handleUseTemplate(t, template.output_type || 'text')}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
