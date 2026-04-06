import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminArticles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug, status, created_at, updated_at')
      .order('created_at', { ascending: false });
    setArticles((data as Article[]) || []);
    setLoading(false);
  };

  const deleteArticle = async (id: string) => {
    if (!window.confirm('Delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Article deleted');
    fetchArticles();
  };

  if (!isAdminEmail(user?.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Manage Articles | KAMYAAB" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Articles</h1>
          </div>
          <Button onClick={() => navigate('/admin/create-article')} className="gap-1">
            <Plus className="w-4 h-4" /> New Article
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No articles yet.</p>
        ) : (
          <div className="space-y-3">
            {articles.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{a.title}</h3>
                    <Badge variant={a.status === 'published' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">/learn/{a.slug} · {new Date(a.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {a.status === 'published' && (
                    <Button variant="ghost" size="icon" onClick={() => window.open(`/learn/${a.slug}`, '_blank')} className="h-8 w-8">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/create-article?edit=${a.id}`)} className="h-8 w-8">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteArticle(a.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
