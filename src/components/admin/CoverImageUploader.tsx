import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link as LinkIcon, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CoverImageUploaderProps {
  imageUrl: string;
  altText: string;
  slug: string;
  onImageChange: (url: string) => void;
  onAltTextChange: (alt: string) => void;
}

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 630;
const MAX_FILE_SIZE = 500 * 1024; // 500KB target
const QUALITY_STEP = 0.05;

async function compressAndResize(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Resize to fit 1200x630 maintaining aspect ratio
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, reduce quality until under max size
      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            if (blob.size <= MAX_FILE_SIZE || quality <= 0.3) {
              resolve(blob);
            } else {
              quality -= QUALITY_STEP;
              tryCompress();
            }
          },
          'image/webp',
          quality
        );
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function CoverImageUploader({
  imageUrl,
  altText,
  slug,
  onImageChange,
  onAltTextChange,
}: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState(imageUrl.startsWith('http') && !imageUrl.includes('supabase') ? imageUrl : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const optimized = await compressAndResize(file);
      const fileName = `${slug || 'cover'}-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, optimized, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast.success('Image uploaded & optimized!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [slug, onImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleUrlApply = useCallback(() => {
    if (!urlInput.trim()) return;
    onImageChange(urlInput.trim());
    toast.success('Image URL applied');
  }, [urlInput, onImageChange]);

  const handleRemove = useCallback(() => {
    onImageChange('');
    setUrlInput('');
  }, [onImageChange]);

  return (
    <div className="space-y-3">
      <Label>Cover Image</Label>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-1 text-xs">
            <Upload className="w-3 h-3" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-1 text-xs">
            <LinkIcon className="w-3 h-3" /> URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-2">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Optimizing & uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop or <span className="text-primary font-medium">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">Auto-optimized to 1200×630 WebP</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-2 space-y-2">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.webp"
            />
            <Button size="sm" onClick={handleUrlApply} disabled={!urlInput.trim()}>
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            For best performance, use optimized WebP images under 500KB
          </p>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {imageUrl && (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={altText || 'Cover preview'}
            className="w-full rounded-lg max-h-40 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Alt Text */}
      <div>
        <Label htmlFor="coverAlt">Alt Text <span className="text-xs text-muted-foreground">(SEO + Accessibility)</span></Label>
        <Input
          id="coverAlt"
          value={altText}
          onChange={(e) => onAltTextChange(e.target.value)}
          placeholder="Describe the image for search engines"
        />
        {imageUrl && !altText && (
          <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Missing alt text — important for SEO
          </p>
        )}
      </div>
    </div>
  );
}
