import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authAPI } from '@/lib/api';
import { Loader2, Search as SearchIcon } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
}

interface SearchUsersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchUsers = ({ isOpen, onOpenChange }: SearchUsersProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await authAPI.searchUsers(query);
      console.log('Search results:', data);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (userId: string, username?: string) => {
    // Prefer clean username URL when available, fallback to id
    const target = username && username.trim() ? `/author/${encodeURIComponent(username)}` : `/profile/${userId}`;
    navigate(target);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, username or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user._id, user.username)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.username || user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          )}

          {!query.trim() && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Start typing to search users</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
