import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Copy, TrendingUp, User, Eye, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
    is_official?: boolean;
  };
  username: string;
  onUseTemplate?: (template: string) => void;
  onFavoriteChange?: (id: string, favorited: boolean) => void;
}

export function TemplateCard({ template, username, onUseTemplate, onFavoriteChange }: TemplateCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favCount, setFavCount] = useState(template.favorites_count);
  const [useCount, setUseCount] = useState(template.uses_count);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    checkIfFavorited();
  }, [template.id]);

  const checkIfFavorited = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', template.id)
      .eq('item_type', 'template')
      .maybeSingle();

    setIsFavorited(!!data);
  };

  const toggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      toast.error("Please sign in to favorite templates");
      return;
    }

    setLoading(true);

    const previousFavorited = isFavorited;
    const previousCount = favCount;
    setIsFavorited(!isFavorited);
    setFavCount(prev => isFavorited ? Math.max(0, prev - 1) : prev + 1);
    
    try {
      if (isFavorited) {
        const { error: deleteError } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', template.id)
          .eq('item_type', 'template');

        if (deleteError) throw deleteError;

        const { error: rpcError } = await supabase.rpc('decrement_template_favorites', { template_id: template.id });
        if (rpcError) throw rpcError;

        toast.success("Removed from favorites");
      } else {
        const { error: insertError } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            item_id: template.id,
            item_type: 'template'
          });

        if (insertError) throw insertError;

        const { error: rpcError } = await supabase.rpc('increment_template_favorites', { template_id: template.id });
        if (rpcError) throw rpcError;

        toast.success("Added to favorites");
      }
      // Notify parent on success
      const newStatus = !previousFavorited;
      (typeof onFavoriteChange === 'function') && onFavoriteChange(template.id, newStatus);
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFavorited(previousFavorited);
      setFavCount(previousCount);
      console.error('Error toggling favorite:', error);
      toast.error(error.message || "Failed to update favorite");
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
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 animate-fade-in">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 cursor-pointer" onClick={() => setPreviewOpen(true)}>
              <CardTitle className="text-lg hover:text-primary transition-colors">
                {template.title}
              </CardTitle>
              <CardDescription className="mt-1">{template.description}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => toggleFavorite(e)}
              disabled={loading}
              className="shrink-0 transition-all duration-200 hover:scale-110"
            >
              <Heart 
                className={`w-5 h-5 transition-all duration-300 ${
                  isFavorited 
                    ? 'fill-red-500 text-red-500 scale-110' 
                    : 'text-muted-foreground hover:text-red-500 hover:scale-105'
                }`} 
              />
            </Button>
          </div>
        </CardHeader>
      
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center flex-wrap">
            {template.is_official && (
              <Badge variant="default" className="gap-1 bg-gradient-to-r from-primary to-primary/80">
                <ShieldCheck className="w-3 h-3" />
                Official
              </Badge>
            )}
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
          <Button onClick={() => setPreviewOpen(true)} variant="outline" className="flex-1 gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button onClick={handleUse} className="flex-1">
            Use Template
          </Button>
          <Button variant="outline" size="icon" onClick={copyTemplate}>
            <Copy className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{template.title}</DialogTitle>
                <DialogDescription>
                  {template.description}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => toggleFavorite(e)}
                disabled={loading}
                className="shrink-0 transition-all duration-200 hover:scale-110"
              >
                <Heart 
                  className={`w-5 h-5 transition-all duration-300 ${
                    isFavorited 
                      ? 'fill-red-500 text-red-500 scale-110' 
                      : 'text-muted-foreground hover:text-red-500 hover:scale-105'
                  }`} 
                />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              {template.is_official && (
                <Badge variant="default" className="gap-1 bg-gradient-to-r from-primary to-primary/80">
                  <ShieldCheck className="w-3 h-3" />
                  Official PromptEK
                </Badge>
              )}
              {template.category && (
                <Badge variant="secondary">{template.category}</Badge>
              )}
              <Link to={`/user/${username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-4 h-4" />
                <span>@{username}</span>
              </Link>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="w-3 h-3" />
                {favCount} favorites
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                {useCount} uses
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Template Content</h3>
              <Textarea
                value={template.template}
                readOnly
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={copyTemplate}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={() => { handleUse(); setPreviewOpen(false); }}>
                Use This Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}