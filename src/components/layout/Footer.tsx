import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Restaurant Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-warm rounded-lg flex items-center justify-center">
                <span className="text-gold font-black font-extrabold text-3xl">R</span>
              </div>
              <span className="font-bold text-xl">Resto</span>
            </div>
            <p className="text-muted-foreground">
              Delicious food delivered fresh to your door. Experience the finest dining from the comfort of your home.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">123 Food Street, NY 10001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">info@resto.com</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Hours</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <div>Mon-Thu: 11AM-10PM</div>
                  <div>Fri-Sat: 11AM-11PM</div>
                  <div>Sunday: 12PM-9PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/menu" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Menu
              </Link>
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Resto. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};