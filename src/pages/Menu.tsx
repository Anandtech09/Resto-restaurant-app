import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, MenuCategory } from '@/types';
import { MenuCard } from '@/components/menu/MenuCard';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Close search on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('menu_items').select('*').eq('is_available', true)
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setMenuItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header>
          <Button
            variant="ghost"
            size="icon"
            className="text-coffee hover:bg-coffee/10"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </Header>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading delicious menu...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header>
        <Button
          variant="ghost"
          size="icon"
          className="text-coffee hover:bg-coffee/10"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search className="h-5 w-5" />
        </Button>
      </Header>

      {/* Search Box Centered on Screen */}
      {isSearchOpen && (
        <div className="fixed inset-x-0 top-20 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md relative">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full px-10 py-2 rounded-full border border-coffee/30 bg-white shadow-coffee text-coffee focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee h-4 w-4" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-coffee hover:bg-coffee/10"
              onClick={() => setIsSearchOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8 animate-fade-up">
            <p className="font-script text-2xl text-gold mb-4">Explore</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-coffee mb-4">Our Menu</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover our delicious selection of dishes
            </p>
          </div>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            className="animate-scale-in"
          />

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} variant="featured" className="animate-scale-in" />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 animate-fade-up">
              <p className="text-muted-foreground text-lg">No items found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};