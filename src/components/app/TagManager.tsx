import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTags } from '@/hooks/useTags';
import { TAG_COLORS } from '@/types/pdf';
import type { Tag as TagType } from '@/types/pdf';

// Dialog for creating a new tag
interface TagCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color: string) => void;
}

export function TagCreateDialog({ open, onOpenChange, onSubmit }: TagCreateDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    if (open) { setName(''); setColor(TAG_COLORS[0]); }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), color);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tag-Name" autoFocus />
          <div className="flex gap-2 flex-wrap">
            {TAG_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform',
                  color === c ? 'border-foreground scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>Erstellen</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Popover for assigning tags to a document
interface TagAssignProps {
  documentTagIds: string[];
  onToggleTag: (tagId: string) => void;
  children: React.ReactNode;
}

export function TagAssignPopover({ documentTagIds, onToggleTag, children }: TagAssignProps) {
  const { data: tags = [] } = useTags();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Tags zuweisen</p>
        {tags.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-1">Noch keine Tags erstellt.</p>
        )}
        {tags.map(t => (
          <button
            key={t.id}
            onClick={() => onToggleTag(t.id)}
            className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
            <span className="flex-1 text-left">{t.name}</span>
            {documentTagIds.includes(t.id) && <span className="text-primary text-xs">✓</span>}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
