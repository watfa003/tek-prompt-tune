import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Sparkles, Star, Users, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateCreationDialog } from "@/components/templates/TemplateCreationDialog";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplatesData } from "@/context/TemplatesDataContext";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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
  const {
    templates,
    featuredTemplates,
    favoriteTemplates,
    profileMap,
    loading,
    refresh,
    updateFavoriteLocally,
    removeTemplateLocally
  } = useTemplatesData();
  const [activeTab, setActiveTab] = useState("featured");
  const applyFilters = (templateList: Template[]) => {
    return templateList.filter(template => {
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      const matchesFilter = templateFilter === "all" || templateFilter === "official" && template.is_official === true || templateFilter === "community" && template.is_official !== true;
      const username = profileMap[template.user_id] || "";
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || template.description?.toLowerCase().includes(searchQuery.toLowerCase()) || username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesFilter && matchesSearch;
    });
  };
  const filteredTemplates = applyFilters(templates);
  const filteredFeaturedTemplates = applyFilters(featuredTemplates);
  const filteredFavoriteTemplates = applyFilters(favoriteTemplates);
  const handleUseTemplate = (template: string, outputType: string) => {
    navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(template)}&selectedType=template`);
  };
  const handleFavoriteChange = (id: string, favorited: boolean, updatedCount?: number) => {
    updateFavoriteLocally(id, favorited, updatedCount);
  };
  const handleDelete = (id: string) => {
    removeTemplateLocally(id);
  };
  if (loading) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold gradient-text">Template Library</h2>
        </div>
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>;
  }
  return <div className="w-full max-w-full space-y-6 pb-8 relative overflow-hidden box-border">
      {/* Floating Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" animate={{
        y: [0, 30, 0],
        x: [0, 20, 0]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" animate={{
        y: [0, -30, 0],
        x: [0, -20, 0]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10 w-full">
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5
      }} className="w-full lg:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text truncate">Template Library</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Discover and share professional prompt templates
          </p>
        </motion.div>
        <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5,
        delay: 0.1
      }} className="w-full lg:w-auto flex-shrink-0">
          <TemplateCreationDialog onTemplateCreated={() => window.location.reload()} />
        </motion.div>
      </div>

      {/* Sticky Filter Bar */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.2
    }} className="sticky top-0 z-40 glass-panel border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-xl w-full max-w-full overflow-hidden box-border">
        {/* Search Bar */}
        <div className="relative mb-3 md:mb-4 w-full">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <Input placeholder="Search templates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 md:pl-12 pr-10 md:pr-12 h-10 md:h-12 glass-panel border-white/10 focus:border-primary/50 focus:neon-border text-sm md:text-base w-full" />
          {searchQuery && <Button variant="ghost" size="icon" className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 md:h-8 md:w-8 hover:bg-white/10 flex-shrink-0" onClick={() => setSearchQuery("")}>
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </Button>}
        </div>

        {/* Template Type Filter */}
        <div className="flex items-center gap-2 mb-3 md:mb-4 overflow-x-auto pb-2 scrollbar-hide w-full">
          <Filter className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-2 flex-nowrap">
            <Button variant={templateFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTemplateFilter("all")} className={`text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${templateFilter === "all" ? "bg-gradient-to-r from-primary to-accent shadow-glow" : "glass-panel border-white/10 hover:border-primary/50"}`}>
              All Templates
            </Button>
            <Button variant={templateFilter === "official" ? "default" : "outline"} size="sm" onClick={() => setTemplateFilter("official")} className={`text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${templateFilter === "official" ? "bg-gradient-to-r from-primary to-accent shadow-glow" : "glass-panel border-white/10 hover:border-primary/50"}`}>
              <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
              <span>Official</span>
            </Button>
            <Button variant={templateFilter === "community" ? "default" : "outline"} size="sm" onClick={() => setTemplateFilter("community")} className={`text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${templateFilter === "community" ? "bg-gradient-to-r from-primary to-accent shadow-glow" : "glass-panel border-white/10 hover:border-primary/50"}`}>
              <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
              <span>Community</span>
            </Button>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex-shrink-0">Category:</span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px] glass-panel border-white/10 focus:border-primary/50">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 z-50">
              {categories.map(category => <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Tabs with Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10 w-full max-w-full">
        <TabsList className="glass-panel border border-white/10 p-1 w-full sm:w-auto flex flex-wrap sm:flex-nowrap">
          <TabsTrigger value="featured" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:shadow-glow flex-1 sm:flex-initial text-xs sm:text-sm">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Most Used</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:shadow-glow flex-1 sm:flex-initial text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">All Templates</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:shadow-glow flex-1 sm:flex-initial text-xs sm:text-sm">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">My Favorites</span>
          </TabsTrigger>
        </TabsList>

        {/* Most Used by Community */}
        <TabsContent value="featured" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                Most Used by Community
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Top performing templates loved by the community
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {filteredFeaturedTemplates.length} templates
            </Badge>
          </div>
          
          {filteredFeaturedTemplates.length === 0 ? <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No featured templates yet</h3>
                <p className="text-muted-foreground">Check back soon for community favorites</p>
              </CardContent>
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFeaturedTemplates.map((template, index) => <motion.div key={template.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05,
            duration: 0.4
          }}>
                  <TemplateCard template={template} username={profileMap[template.user_id] || (template.is_official ? 'PrompTek' : 'Unknown')} onUseTemplate={t => handleUseTemplate(t, template.output_type || 'text')} onFavoriteChange={handleFavoriteChange} onDelete={handleDelete} />
                </motion.div>)}
            </div>}
        </TabsContent>

        {/* All Templates */}
        <TabsContent value="all" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                All Templates
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Browse our complete collection
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {filteredTemplates.length} templates
            </Badge>
          </div>

          {filteredTemplates.length === 0 ? <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setTemplateFilter("all");
            }} className="glass-panel border-white/10">
                  Clear Filters
                </Button>
              </CardContent>
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template, index) => <motion.div key={template.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05,
            duration: 0.4
          }}>
                  <TemplateCard template={template} username={profileMap[template.user_id] || (template.is_official ? 'PrompTek' : 'Unknown')} onUseTemplate={t => handleUseTemplate(t, template.output_type || 'text')} onFavoriteChange={handleFavoriteChange} onDelete={handleDelete} />
                </motion.div>)}
            </div>}
        </TabsContent>

        {/* My Favorites */}
        <TabsContent value="favorites" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                My Favorites
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your personally curated collection
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {filteredFavoriteTemplates.length} templates
            </Badge>
          </div>

          {filteredFavoriteTemplates.length === 0 ? <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring and favoriting templates you love
                </p>
                <Button onClick={() => setActiveTab("all")} className="btn-sheen bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow">
                  Browse Templates
                </Button>
              </CardContent>
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFavoriteTemplates.map((template, index) => <motion.div key={template.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05,
            duration: 0.4
          }}>
                  <TemplateCard template={template} username={profileMap[template.user_id] || (template.is_official ? 'PrompTek' : 'Unknown')} onUseTemplate={t => handleUseTemplate(t, template.output_type || 'text')} onFavoriteChange={handleFavoriteChange} onDelete={handleDelete} />
                </motion.div>)}
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
};