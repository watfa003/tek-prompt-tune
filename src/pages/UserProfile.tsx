import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Heart, FileText, ArrowLeft } from "lucide-react";
import { TemplateCard } from "@/components/templates/TemplateCard";

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  template: string;
  favorites_count: number;
  uses_count: number;
  user_id: string;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState({ totalTemplates: 0, totalFavorites: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: templatesData, error: templatesError } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('user_id', profileData.user_id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      const totalFavorites = templatesData?.reduce((sum, t) => sum + t.favorites_count, 0) || 0;
      setStats({
        totalTemplates: templatesData?.length || 0,
        totalFavorites
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>The profile you're looking for doesn't exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl">@{profile.username}</CardTitle>
              {profile.bio && (
                <CardDescription className="mt-2 text-base">{profile.bio}</CardDescription>
              )}
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{stats.totalTemplates}</strong> templates
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{stats.totalFavorites}</strong> total favorites
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Templates by @{profile.username}</h2>
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No public templates yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                username={profile.username}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}