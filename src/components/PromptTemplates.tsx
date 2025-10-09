import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { TemplateCreationDialog } from "@/components/templates/TemplateCreationDialog";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplatesData } from "@/context/TemplatesDataContext";

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

export const PromptTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<"all" | "official" | "community">("all");
  const navigate = useNavigate();
  
  const { templates, featuredTemplates, favoriteTemplates, profileMap, loading, refresh, updateFavoriteLocally, removeTemplateLocally } = useTemplatesData();
  const [activeTab, setActiveTab] = useState("featured");

  const applyFilters = (templateList: Template[]) => {
    return templateList.filter(template => {
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
  };

  const filteredTemplates = applyFilters(templates);
  const filteredFeaturedTemplates = applyFilters(featuredTemplates);
  const filteredFavoriteTemplates = applyFilters(favoriteTemplates);

  const handleUseTemplate = (template: string, outputType: string) => {
    // Always navigate to AI Agent with template as influence
    navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(template)}&selectedType=template`);
  };

  const handleFavoriteChange = (id: string, favorited: boolean, updatedCount?: number) => {
    updateFavoriteLocally(id, favorited, updatedCount);
  };

  const handleDelete = (id: string) => {
    removeTemplateLocally(id);
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Templates</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Discover and share prompt templates
          </p>
        </div>
        <TemplateCreationDialog onTemplateCreated={() => window.location.reload()} />
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
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
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
          {filteredFeaturedTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No featured templates yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeaturedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  username={profileMap[template.user_id] || (template.is_official ? 'Promptek' : 'Unknown')}
                  onUseTemplate={(t) => handleUseTemplate(t, template.output_type || 'text')}
                  onFavoriteChange={handleFavoriteChange}
                  onDelete={handleDelete}
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
                  username={profileMap[template.user_id] || (template.is_official ? 'Promptek' : 'Unknown')}
                  onUseTemplate={(t) => handleUseTemplate(t, template.output_type || 'text')}
                  onFavoriteChange={handleFavoriteChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <p className="text-sm text-muted-foreground">Your favorited templates</p>
          {filteredFavoriteTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No favorites yet. Start exploring and favoriting templates!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavoriteTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  username={profileMap[template.user_id] || (template.is_official ? 'Promptek' : 'Unknown')}
                  onUseTemplate={(t) => handleUseTemplate(t, template.output_type || 'text')}
                  onFavoriteChange={handleFavoriteChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
