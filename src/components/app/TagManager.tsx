import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTags } from '@/hooks/useTags';
import { TAG_COLORS } from '@/types/pdf';

interface TagCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color: string) => void;
}

export function TagCreateDialog({ open, onOpenChange, onSubmit }: TagCreateDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    if (open) {
      setName('');
      setColor(TAG_COLORS[0]);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), color);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tag-Name"
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className="h-7 w-7 rounded-full border border-border flex items-center justify-center"
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`Farbe ${c}`}
              >
                {color === c && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
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

interface TagAssignPopoverProps {
  children: React.ReactNode;
  documentTagIds: string[];
  onToggleTag: (tagId: string) => void;
}

export function TagAssignPopover({ children, documentTagIds, onToggleTag }: TagAssignPopoverProps) {
  const { data: tags = [] } = useTags();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-1">Keine Tags vorhanden</p>
        ) : (
          <div className="space-y-1">
            {tags.map(tag => {
              const selected = documentTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => onToggleTag(tag.id)}
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  {selected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
