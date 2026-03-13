import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PenLine, User, LogOut, LayoutDashboard, Search, Menu, X, Moon, Sun, Monitor } from 'lucide-react';
import { useState } from 'react';
import { SearchUsers } from '@/components/SearchUsers';
import { Logo } from '@/components/ui/Logo';

export const Header = () => {
  const { user, signOut, hasRole } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const canWrite = hasRole('author') || hasRole('admin');
  const isAdmin = hasRole('admin');
  const isAuthor = hasRole('author');

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <Logo />
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Explore
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex"
              onClick={() => setSearchOpen(true)}
              title="Search users"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : theme === 'light' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                  {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                  {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                  {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                {canWrite && (
                  <Button asChild variant="default" size="sm" className="hidden md:flex gap-2 btn-glow">
                    <Link to="/write">
                      <PenLine className="h-4 w-4" />
                      Write
                    </Link>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {hasRole('admin') ? 'Admin' : hasRole('author') ? 'Author' : 'Reader'}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {canWrite && (
                      <DropdownMenuItem asChild>
                        <Link to="/my-blogs" className="flex items-center gap-2 cursor-pointer">
                          <PenLine className="h-4 w-4" />
                          My Blogs
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {hasRole('admin') && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="btn-glow">
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 animate-slide-up">
            <nav className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSearchOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Search className="h-4 w-4" />
                Search Users
              </Button>
              <Link to="/" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/explore" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Explore
              </Link>
              {user ? (
                <>
                  {canWrite && (
                    <Link to="/write" className="text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                      ✏️ Write Blog
                    </Link>
                  )}
                  <Link to="/profile" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  {canWrite && (
                    <Link to="/my-blogs" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      My Blogs
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="text-sm font-medium text-destructive" onClick={() => setMobileMenuOpen(false)}>
                      🔧 Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm font-medium text-destructive text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/auth?mode=signup" className="text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <SearchUsers isOpen={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};
