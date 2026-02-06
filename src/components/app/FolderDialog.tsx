import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  title: string;
}

export function FolderDialog({ open, onOpenChange, onSubmit, initialName, title }: FolderDialogProps) {
  const [name, setName] = useState(initialName ?? '');

  useEffect(() => {
    if (open) setName(initialName ?? '');
  }, [open, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ordnername"
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={!name.trim()}>Speichern</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
