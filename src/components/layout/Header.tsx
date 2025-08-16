import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Coffee, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  children?: React.ReactNode;
}

export const Header = ({ onSearchChange, searchQuery, children }: HeaderProps) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const { cartItemCount } = useCartStore();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile('(max-width: 768px)');

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out.',
      });
      setIsMenuOpen(false);
      window.location.href = '/';
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/menu' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 nav-glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Coffee className="h-8 w-8 text-coffee group-hover:animate-bean-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full animate-pulse opacity-75" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-coffee">Resto</h1>
              <p className="font-script text-xs text-gold -mt-1">Premium Dining</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 relative group ${
                  isActive(item.href)
                    ? 'text-coffee'
                    : 'text-muted-foreground hover:text-coffee'
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gold transform origin-left transition-transform duration-300 ${
                    isActive(item.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {children}
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative hover:bg-accent/10">
                <ShoppingCart className="h-5 w-5 text-coffee" />
                {cartItemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gold text-coffee hover:bg-gold/90"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {!isMobile && (
                    <Button variant="ghost" size="sm" className="hover:bg-accent/10">
                      <User className="h-5 w-5 text-coffee" />
                    </Button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !isMobile && (
                <Link to="/auth">
                  <Button className="btn-coffee text-sm">Sign In</Button>
                </Link>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-accent/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-coffee" />
              ) : (
                <Menu className="h-5 w-5 text-coffee" />
              )}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-coffee bg-accent/10'
                      : 'text-muted-foreground hover:text-coffee hover:bg-accent/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-muted-foreground hover:text-coffee hover:bg-accent/5"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-muted-foreground hover:text-coffee hover:bg-accent/5"
                  >
                    Orders
                  </Link>
                  <Button
                    variant="ghost"
                    className="font-medium py-2 px-4 rounded-lg text-destructive hover:bg-accent/5 w-full text-left"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <Button className="btn-coffee w-full">Sign In</Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};