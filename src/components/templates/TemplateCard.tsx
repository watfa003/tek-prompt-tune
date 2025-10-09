import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Copy, TrendingUp, User, Eye, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTemplatesData } from "@/context/TemplatesDataContext";
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
  onDelete?: (id: string) => void;
}

export function TemplateCard({ template, username, onUseTemplate, onFavoriteChange, onDelete }: TemplateCardProps) {
  const { setTemplateFavoritesCount } = useTemplatesData();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favCount, setFavCount] = useState(template.favorites_count);
  const [useCount, setUseCount] = useState(template.uses_count);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    checkIfFavorited();
    getCurrentUser();
  }, [template.id]);

  // Sync local favCount with prop changes
  useEffect(() => {
    setFavCount(template.favorites_count);
  }, [template.favorites_count]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

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
        const [deleteRes, decRes] = await Promise.all([
          supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('item_id', template.id)
            .eq('item_type', 'template'),
          supabase.rpc('decrement_template_favorites', { template_id: template.id })
        ]);
        if (deleteRes.error) throw deleteRes.error;
        if ((decRes as any).error) throw (decRes as any).error;
        toast.success("Removed from favorites");
      } else {
        const [insertRes, incRes] = await Promise.all([
          supabase
            .from('user_favorites')
            .insert({
              user_id: userId,
              item_id: template.id,
              item_type: 'template'
            }),
          supabase.rpc('increment_template_favorites', { template_id: template.id })
        ]);
        if (insertRes.error) throw insertRes.error;
        if ((incRes as any).error) throw (incRes as any).error;
        toast.success("Added to favorites");
      }

      // Final reconcile: fetch authoritative count to avoid drift
      const { data: refreshed } = await supabase
        .from('prompt_templates')
        .select('favorites_count')
        .eq('id', template.id)
        .maybeSingle();
      if (typeof refreshed?.favorites_count === 'number') {
        setFavCount(refreshed.favorites_count);
        setTemplateFavoritesCount(template.id, refreshed.favorites_count);
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
    // Optimistic update
    const previousCount = useCount;
    setUseCount(prev => prev + 1);
    
    try {
      // Call the increment in the background
      const incrementPromise = supabase.rpc('increment_template_uses', { template_id: template.id });
      
      // Immediately use the template (don't wait for DB)
      if (onUseTemplate) {
        onUseTemplate(template.template);
      }
      
      toast.success("Template added to your workspace!");
      
      // Wait for DB confirmation
      const { error } = await incrementPromise;
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing template uses:', error);
      // Revert optimistic update on error
      setUseCount(previousCount);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(template.template);
    toast.success("Template copied to clipboard!");
  };

  const handleDelete = async () => {
    if (!currentUserId || currentUserId !== template.user_id) {
      toast.error("You can only delete your own templates");
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', template.id)
        .eq('user_id', currentUserId);

      if (error) throw error;

      toast.success("Template deleted successfully");
      setDeleteDialogOpen(false);
      onDelete?.(template.id);
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.message || "Failed to delete template");
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = currentUserId && currentUserId === template.user_id;

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
          {isOwner && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
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
              {isOwner && (
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button onClick={() => { handleUse(); setPreviewOpen(false); }}>
                Use This Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}