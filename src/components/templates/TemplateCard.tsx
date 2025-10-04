import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Copy, TrendingUp, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    template: string;
    favorites_count: number;
    uses_count: number;
    user_id: string;
  };
  username: string;
  onUseTemplate?: (template: string) => void;
}

export function TemplateCard({ template, username, onUseTemplate }: TemplateCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favCount, setFavCount] = useState(template.favorites_count);
  const [useCount, setUseCount] = useState(template.uses_count);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfFavorited();
  }, [template.id]);

  const checkIfFavorited = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', template.id)
      .eq('item_type', 'template')
      .single();

    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to favorite templates");
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', template.id)
          .eq('item_type', 'template');

        await supabase.rpc('decrement_template_favorites', { template_id: template.id });
        setFavCount(prev => Math.max(0, prev - 1));
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            item_id: template.id,
            item_type: 'template'
          });

        await supabase.rpc('increment_template_favorites', { template_id: template.id });
        setFavCount(prev => prev + 1);
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite");
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async () => {
    try {
      await supabase.rpc('increment_template_uses', { template_id: template.id });
      setUseCount(prev => prev + 1);
      
      if (onUseTemplate) {
        onUseTemplate(template.template);
      }
      toast.success("Template added to your workspace!");
    } catch (error) {
      console.error('Error using template:', error);
      toast.error("Failed to use template");
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(template.template);
    toast.success("Template copied to clipboard!");
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <CardDescription className="mt-1">{template.description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            disabled={loading}
            className="shrink-0"
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-center flex-wrap">
          {template.category && (
            <Badge variant="secondary">{template.category}</Badge>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Heart className="w-3 h-3" />
            {favCount}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            {useCount} uses
          </div>
        </div>

        <Link to={`/user/${username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <User className="w-4 h-4" />
          <span>@{username}</span>
        </Link>
      </CardContent>

      <CardFooter className="gap-2">
        <Button onClick={handleUse} className="flex-1">
          Use Template
        </Button>
        <Button variant="outline" size="icon" onClick={copyTemplate}>
          <Copy className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}