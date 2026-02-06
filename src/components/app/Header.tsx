import { Search, LayoutGrid, List, Plus, Menu, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ViewMode, SortOption } from '@/types/pdf';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onUpload: () => void;
  onMenuToggle?: () => void;
  showMenu?: boolean;
}

export function Header({
  searchQuery, onSearchChange, viewMode, onViewModeChange,
  sortBy, onSortChange, onUpload, onMenuToggle, showMenu,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-4 py-3">
      {showMenu && (
        <Button variant="ghost" size="icon" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Dokumente durchsuchen…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Sort">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortChange('date')} className={sortBy === 'date' ? 'font-bold' : ''}>
            Datum
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('name')} className={sortBy === 'name' ? 'font-bold' : ''}>
            Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('lastOpened')} className={sortBy === 'lastOpened' ? 'font-bold' : ''}>
            Zuletzt geöffnet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}>
        {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
      </Button>

      <ThemeToggle />

      <Button onClick={onUpload} size="sm" className="gap-1.5">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Hochladen</span>
      </Button>
    </header>
  );
}
