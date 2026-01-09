import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdentityStatementEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const IdentityStatementEditor = ({
  value,
  onChange,
  className,
  placeholder = "This plan exists to help me..."
}: IdentityStatementEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    onChange(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={200}
          className="flex-1 bg-transparent border-b border-primary/30 text-sm text-muted-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 py-1 transition-colors"
        />
        <button
          onClick={handleSave}
          className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("group flex items-center gap-2", className)}>
      {value ? (
        <p className="text-sm text-muted-foreground/70 italic">
          "{value}"
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/50">
          Add a purpose statement...
        </p>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
        title="Edit identity statement"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
