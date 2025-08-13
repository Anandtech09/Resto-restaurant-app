import { ChefHat, Heart, Star, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl text-coffee font-bold mb-6">About Our Restaurant</h1>
            <p className="text-xl md:text-2xl text-gold">
              Passionate about delivering exceptional culinary experiences since 2015
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="text-lg leading-relaxed mb-6">
                Founded in 2015 by Chef Maria Rodriguez, our restaurant began as a small family kitchen with a big dream: 
                to bring authentic, fresh, and delicious meals directly to our community's doorstep. What started as a 
                humble operation with just three team members has grown into a beloved local institution.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                Our commitment to quality has never wavered. We source our ingredients from local farms and suppliers, 
                ensuring that every dish is prepared with the freshest, highest-quality ingredients available. Our team 
                of experienced chefs brings passion and creativity to every meal, crafting dishes that not only satisfy 
                hunger but create memorable dining experiences.
              </p>
              <p className="text-lg leading-relaxed">
                Today, we're proud to serve thousands of satisfied customers throughout the city, maintaining the same 
                family values and dedication to excellence that inspired our founding. Every order is prepared with care, 
                love, and the commitment to delivering restaurant-quality meals to your home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-coffee" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quality First</h3>
                <p className="text-muted-foreground">
                  We never compromise on quality, using only the finest ingredients and time-tested recipes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-coffee" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Made with Love</h3>
                <p className="text-muted-foreground">
                  Every dish is prepared with passion and care, just like a home-cooked meal from family.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-coffee" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Customer First</h3>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. We go above and beyond to exceed your expectations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-coffee" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Excellence</h3>
                <p className="text-muted-foreground">
                  We strive for excellence in every aspect, from ingredients to delivery and customer service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 bg-gradient-warm rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ChefHat className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chef Maria Rodriguez</h3>
                <p className="text-muted-foreground mb-3">Founder & Head Chef</p>
                <p className="text-sm text-muted-foreground">
                  With over 20 years of culinary experience, Chef Maria brings authentic flavors and innovative techniques to every dish.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 bg-gradient-warm rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sarah Johnson</h3>
                <p className="text-muted-foreground mb-3">Operations Manager</p>
                <p className="text-sm text-muted-foreground">
                  Sarah ensures every order is perfect and every customer is satisfied, managing our daily operations with precision.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 bg-gradient-warm rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Star className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Michael Chen</h3>
                <p className="text-muted-foreground mb-3">Customer Experience Lead</p>
                <p className="text-sm text-muted-foreground">
                  Michael leads our customer service team, ensuring every interaction exceeds expectations and builds lasting relationships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">50,000+</h3>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">100+</h3>
              <p className="text-muted-foreground">Menu Items</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">8</h3>
              <p className="text-muted-foreground">Years of Excellence</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">30min</h3>
              <p className="text-muted-foreground">Average Delivery Time</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};