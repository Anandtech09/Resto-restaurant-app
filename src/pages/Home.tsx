import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Clock, Truck, Search, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, MenuCategory, Offer } from '@/types';
import { MenuCard } from '@/components/menu/MenuCard';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScratchCard } from '@/components/scratchcard/ScratchCard';

interface BannerSettings {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
}

export const Home = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to "Browse Our Menu" when search is opened or searchQuery changes
  useEffect(() => {
    if (isSearchOpen) {
      const browseMenuSection = document.getElementById('browse-menu');
      if (browseMenuSection) {
        browseMenuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [isSearchOpen, searchQuery]);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes, offersRes, bannerRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('menu_items').select('*').eq('is_available', true),
        supabase.from('offers').select('*').eq('is_active', true).limit(3),
        supabase.from('banner_settings').select('*').eq('is_active', true).limit(1).maybeSingle()
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setMenuItems(itemsRes.data);
      if (offersRes.data) setOffers(offersRes.data as Offer[]);
      if (bannerRes.data) setBannerSettings(bannerRes.data);
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

  const specialItems = menuItems.filter(item => item.is_special).slice(0, 4);

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
        {/* Hero Section */}
        {!isSearchOpen && (
          <section
            className="relative h-[calc(100vh-1rem)] flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: "url('https://plus.unsplash.com/premium_photo-1661883237884-263e8de8869b?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 hero-gradient opacity-90" />
            <div className="relative z-10 text-center container mx-auto px-4">
              <div className="animate-fade-up">
                <p className="font-script text-2xl md:text-3xl text-gold mb-4">Welcome to</p>
                <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-6">
                  {bannerSettings?.title || 'Delicious Food'}
                  <br />
                  <span className="text-gold">Delivered</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                  {bannerSettings?.subtitle || 'Experience restaurant-quality meals delivered straight to your door.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to={bannerSettings?.button_link || "/menu"}>
                    <Button size="lg" className="btn-gold group">
                      {bannerSettings?.button_text || 'Order Now'}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/menu">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary-foreground/30 text-white bg-coffee"
                    >
                      View Menu
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse" />
              </div>
            </div>
          </section>
        )}

        {/* Current Offers */}
        {!isSearchOpen && offers.length > 0 && (
          <section className="py-20 coffee-texture">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <p className="font-script text-2xl text-gold mb-4">Limited Time</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-coffee mb-6">Special Offers</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Take advantage of our exclusive deals crafted just for you.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {offers.map((offer) => (
                  <Card
                    key={offer.id}
                    className="bg-gradient-warm text-coffee overflow-hidden shadow-coffee relative w-full max-w-sm mx-auto transform transition-all duration-300 hover:scale-105"
                  >
                    <CardContent className="p-6 text-center flex flex-col items-center relative z-10">
                      {/* Ticket Top Section (Logo/Brand Placeholder) */}
                      <div className="absolute top-2 left-2 text-sm text-white font-inter bg-coffee-light/80 px-2 py-1 rounded-md">
                        Resto.
                      </div>

                      {/* Main Offer Value */}
                      <h2 className="font-display text-3xl font-bold text-coffee-dark mb-2 mt-6">
                        {offer.discount_type === 'percentage'
                          ? `${offer.discount_value}% OFF`
                          : `$${offer.discount_value} OFF`}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-4">
                        When you spend ${offer.min_order_amount}
                      </p>

                      {/* Ticket Body (Perforated Effect) */}
                      <div className="w-full h-px bg-coffee/20 my-4 relative">
                        <div className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-coffee-light/50 to-transparent opacity-50" />
                      </div>

                      {/* Ticket Details */}
                      <div className="bg-coffee/20 p-4 rounded-lg shadow-inner w-full">
                        <h3 className="font-display text-lg font-semibold mb-2">{offer.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{offer.description}</p>
                        <p className="text-sm text-muted-foreground">Min order: ${offer.min_order_amount}</p>
                      </div>

                      {/* Scratch Card Section */}
                      <div className="w-full flex justify-center">
                        <ScratchCard code={offer.code} />
                      </div>

                      {/* Ticket Bottom Section */}
                      <div className="w-full text-left mt-4 text-sm text-muted-foreground">
                        Free offer for you!
                      </div>
                    </CardContent>

                    {/* Ticket Shape with Clipped Corners and Perforated Edges */}
                    <div className="absolute inset-0 border-2 border-coffee-dark/20 rounded-lg overflow-hidden">
                      <div className="absolute top-0 left-0 w-4 h-4 bg-gradient-warm clip-path-polygon(0 0, 100% 0, 0 100%)" />
                      <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-warm clip-path-polygon(0 0, 100% 0, 100% 100%)" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-warm clip-path-polygon(0 0, 100% 0, 0 100%)" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-warm clip-path-polygon(0 0, 100% 0, 100% 100%)" />
                      <div className="absolute top-1/2 left-0 w-2 h-8 bg-coffee-dark/10 clip-path-polygon(0 0, 100% 50%, 0 100%)" />
                      <div className="absolute top-1/2 right-0 w-2 h-8 bg-coffee-dark/10 clip-path-polygon(0 50%, 100% 0, 100% 100%) transform -scale-x-100" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Today's Specials */}
        {!isSearchOpen && specialItems.length > 0 && (
          <section className="py-20 bg-gradient-warm">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <p className="font-script text-2xl text-white mb-4">Chef's Picks</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-coffee mb-6">Today's Specials</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Chef's recommended dishes made with the finest ingredients.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {specialItems.map((item) => (
                  <MenuCard key={item.id} item={item} variant="featured" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Browse Our Menu (Always Visible, Scrolls to Top When Search is Open) */}
        <section id="browse-menu" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="font-script text-2xl text-gold mb-4">Explore</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-coffee mb-6">Browse Our Menu</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Discover delicious dishes across all categories.
              </p>
            </div>

            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
              {filteredItems.slice(0, 4).map((item) => (
                <MenuCard key={item.id} item={item} variant="featured" />
              ))}
            </div>

            {filteredItems.length > 3 && (
              <div className="text-center mt-12">
                <Link to="/menu">
                  <Button size="lg" className="btn-coffee group">
                    View All {filteredItems.length} Items
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        {!isSearchOpen && (
          <section className="py-20 hero-gradient text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                  Ready for the Perfect
                  <br />
                  <span className="text-gold">Dining Experience?</span>
                </h2>
                <p className="text-xl text-primary-foreground/90 mb-8">
                  Join thousands of food lovers who enjoy our exceptional dishes. Your perfect meal awaits.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/menu">
                    <Button size="lg" className="btn-gold">
                      Order Now
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-primary-foreground/30 text-white bg-coffee"
                  >
                    Find Our Location
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
