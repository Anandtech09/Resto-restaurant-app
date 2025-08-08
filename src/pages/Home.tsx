import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, MenuCategory, Offer } from '@/types';
import { MenuCard } from '@/components/menu/MenuCard';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface BannerSettings {
  id: string;
  image_url?: string;
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
  const [loading, setLoading] = useState(true);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading delicious menu...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onSearchChange={setSearchQuery} searchQuery={searchQuery} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center min-h-[60vh] text-black overflow-hidden">
          {bannerSettings?.image_url && (
            <div className="absolute inset-0">
              <img
                src={bannerSettings.image_url}
                alt={bannerSettings.title || "Delicious food background"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
            </div>
          )}
          {/* FIX 1: Wrapped content in a single container div for proper centering. */}
          <div className="relative z-10 text-center container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg text-primary-foreground">
              {bannerSettings?.title || 'Delicious Food, Delivered.'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-secondary-foreground drop-shadow-md max-w-3xl mx-auto">
              {bannerSettings?.subtitle || 'Experience restaurant-quality meals delivered straight to your door.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={bannerSettings?.button_link || "/menu"}>
                <Button size="lg" className="btn-food px-8 py-4 text-lg">
                  {bannerSettings?.button_text || 'Order Now'}
                </Button>
              </Link>
              <Link to="/menu">
                <Button size="lg" variant="outline" className="border-primary-foreground text-secondary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg">
                  View Menu
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* Current Offers */}
        {offers.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Special Offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {offers.map((offer) => (
                  <Card key={offer.id} className="gradient-food text-white overflow-hidden">
                    <CardContent className="p-6 text-center flex flex-col items-center">
                      <Badge className="bg-white/20 text-white mb-4">
                        {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `$${offer.discount_value} OFF`}
                      </Badge>
                      <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                      <p className="text-white/90 mb-4">{offer.description}</p>
                      <p className="text-sm text-white/80">Min order: ${offer.min_order_amount}</p>
                      <Button className="mt-4 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/30">
                        Use Code: {offer.code}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Today's Specials */}
        {specialItems.length > 0 && (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Today's Specials</h2>
                <p className="text-muted-foreground text-lg">Chef's recommended dishes made with the finest ingredients.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {specialItems.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/menu">
                  <Button size="lg" className="btn-food">View Full Menu</Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Browse Menu */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Browse Our Menu</h2>
              <p className="text-muted-foreground text-lg">Discover delicious dishes across all categories.</p>
            </div>

            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {filteredItems.slice(0, 8).map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>

            {filteredItems.length > 8 && (
              <div className="text-center mt-8">
                <Link to="/menu">
                  <Button size="lg" variant="outline">View All {filteredItems.length} Items</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};