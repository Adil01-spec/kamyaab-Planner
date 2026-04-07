import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/lib/adminAuth';
import { slugify } from '@/lib/slugify';
import { ArticleEditor } from '@/components/admin/ArticleEditor';
import { CoverImageUploader } from '@/components/admin/CoverImageUploader';
import { SeoAssistant } from '@/components/admin/SeoAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';

export default function AdminCreateArticle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-save draft
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  // Auto meta
  useEffect(() => {
    if (!metaTitle && title) setMetaTitle(`${title} | Kamyaab`);
  }, [title]);

  // Auto-suggest alt text from title
  useEffect(() => {
    if (!coverImageAlt && title && coverImage) setCoverImageAlt(title);
  }, [title, coverImage]);

  useEffect(() => {
    if (!metaDescription && description) setMetaDescription(description.slice(0, 160));
  }, [description]);

  // Load article for editing
  useEffect(() => {
    if (editId) {
      supabase
        .from('articles')
        .select('*')
        .eq('id', editId)
        .single()
        .then(({ data }) => {
          if (data) {
            setTitle(data.title);
            setSlug(data.slug);
            setDescription(data.description || '');
            setCoverImage(data.cover_image || '');
            setCoverImageAlt((data as any).cover_image_alt || '');
            setContent(data.content || '');
            setTags((data.tags as string[] || []).join(', '));
            setMetaTitle(data.meta_title || '');
            setMetaDescription(data.meta_description || '');
            setAutoSlug(false);
          }
        });
    }
  }, [editId]);

  // Auto-save every 30s
  useEffect(() => {
    if (!title || !content) return;
    const timer = setInterval(() => {
      handleSave('draft', true);
    }, 30000);
    return () => clearInterval(timer);
  }, [title, content, slug, description]);

  const handleSave = useCallback(async (status: 'draft' | 'published', silent = false) => {
    if (!title.trim() || !slug.trim()) {
      if (!silent) toast.error('Title and slug are required');
      return;
    }
    setSaving(true);
    const articleData = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      content,
      cover_image: coverImage.trim() || null,
      cover_image_alt: coverImageAlt.trim() || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status,
      author_id: user?.id,
      meta_title: metaTitle.trim() || `${title} | Kamyaab`,
      meta_description: metaDescription.trim() || description.slice(0, 160),
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('articles').update(articleData).eq('id', editId));
    } else {
      ({ error } = await supabase.from('articles').insert(articleData));
    }

    setSaving(false);
    if (error) {
      if (!silent) toast.error(error.message);
      return;
    }
    setLastSaved(new Date());
    if (!silent) {
      toast.success(status === 'published' ? 'Article published!' : 'Draft saved!');
      if (status === 'published') navigate('/learn');
    }
  }, [title, slug, description, content, coverImage, tags, metaTitle, metaDescription, user, editId, navigate]);

  if (!isAdminEmail(user?.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setShowPreview(false)} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Editor
          </Button>
          {coverImage && <img src={coverImage} alt={title} className="w-full rounded-xl mb-6 max-h-80 object-cover" />}
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          {tags && (
            <div className="flex flex-wrap gap-2 mt-6">
              {tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={editId ? 'Edit Article | KAMYAAB' : 'Create Article | KAMYAAB'} />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </Button>
            <Button onClick={() => handleSave('published')} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main editor */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title" className="text-lg font-semibold" />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2 items-center">
                <Input id="slug" value={slug} onChange={e => { setAutoSlug(false); setSlug(e.target.value); }} placeholder="url-slug" className="font-mono text-sm" />
                <Button variant="ghost" size="sm" onClick={() => { setAutoSlug(true); setSlug(slugify(title)); }}>Auto</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">/learn/{slug}</p>
            </div>
            <div>
              <Label htmlFor="desc">Short Description</Label>
              <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description for SEO and listing" rows={2} />
            </div>
            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input id="cover" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." />
              {coverImage && <img src={coverImage} alt="Cover preview" className="mt-2 rounded-lg max-h-40 object-cover" />}
            </div>
            <div>
              <Label>Content</Label>
              <ArticleEditor content={content} onChange={setContent} onPreview={() => setShowPreview(true)} />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="execution, productivity, goals" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO title" />
              <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/60 chars</p>
            </div>
            <div>
              <Label htmlFor="metaDesc">Meta Description</Label>
              <Textarea id="metaDesc" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO description" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 chars</p>
            </div>
            <div>
              <Label htmlFor="keyword">Primary Keyword</Label>
              <Input id="keyword" value={primaryKeyword} onChange={e => setPrimaryKeyword(e.target.value)} placeholder="e.g. goal execution" />
            </div>
            <SeoAssistant
              title={title}
              content={content}
              primaryKeyword={primaryKeyword}
              onKeywordSelect={setPrimaryKeyword}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
