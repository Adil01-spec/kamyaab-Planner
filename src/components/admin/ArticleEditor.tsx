import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, Quote, Minus, Code,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useEffect, useCallback, useMemo } from 'react';

interface ArticleEditorProps {
  content: string;
  onChange: (html: string) => void;
  onPreview?: () => void;
}

/** Normalize pasted/typed URLs so stored HTML has a proper href (internal paths, https, mailto). */
function normalizeArticleHref(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^(mailto:|tel:|#)/i.test(t)) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/')) return t;
  if (/^[a-z0-9][a-z0-9_-]*\//i.test(t)) return `/${t}`;
  return `/${t}`;
}

function isExternalHttpHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).origin !== window.location.origin;
  } catch {
    return true;
  }
}

export function ArticleEditor({ content, onChange, onPreview }: ArticleEditorProps) {
  // Stable extension list — new array every render makes TipTap compareOptions fail and setOptions() re-apply options, resetting the document.
  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your article…' }),
    ],
    []
  );

  // Do not pass parent `content` here — it updates every keystroke and forces setOptions/setContent, undoing marks. Sync from props in useEffect instead.
  const editor = useEditor(
    {
      extensions,
      content: '<p></p>',
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none',
        },
      },
    },
    []
  );

  // Sync external content changes (load article, reset). emitUpdate: false avoids re-entrant onChange loops.
  useEffect(() => {
    if (!editor) return;
    const next = content || '<p></p>';
    if (next === editor.getHTML()) return;
    editor.commands.setContent(next, false);
  }, [editor, content]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL (e.g. /learn/my-post or https://…):');
    if (url == null || !url.trim()) return;
    const href = normalizeArticleHref(url);
    if (!href) return;
    const external = isExternalHttpHref(href);
    const linkAttrs = external
      ? { href, target: '_blank', rel: 'noopener noreferrer' as const }
      : { href };

    const { empty } = editor.state.selection;
    if (empty) {
      const defaultLabel = href.replace(/^https?:\/\//i, '').slice(0, 80) || href;
      const label = window.prompt('Link text (shown to readers):', defaultLabel);
      const text = (label ?? defaultLabel).trim() || defaultLabel;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: linkAttrs }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink(linkAttrs).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      const alt = window.prompt('Enter alt text (for SEO):') || '';
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 overflow-x-auto">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button variant="ghost" size="sm" onClick={addLink} className="h-8 px-2">
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={addImage} className="h-8 px-2">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('codeBlock')} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="w-4 h-4" />
        </Toggle>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="h-8 px-2">
          <Minus className="w-4 h-4" />
        </Button>

        {onPreview && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="sm" onClick={onPreview} className="h-8 px-2 gap-1">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Preview</span>
            </Button>
          </>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
