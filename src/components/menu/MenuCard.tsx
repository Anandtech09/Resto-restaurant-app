import { useState } from 'react';
import { Plus, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/types';
import { useCart } from '@/hooks/useCart';

interface MenuCardProps {
  item: MenuItem;
  variant?: 'default' | 'featured';
  className?: string;
}

export const MenuCard = ({ item, variant = 'default', className }: MenuCardProps) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(item);
    setIsAdding(false);
  };

  return (
    <Card
      className={`bg-gradient-card text-coffee shadow-coffee min-h-[400px] flex flex-col justify-between overflow-hidden 
        ${variant === 'featured' ? 'border-gold/30' : ''} 
        ${item.is_special ? 'special-float ring-2 ring-accent/20' : ''} 
        ${className}`}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-grow">
          {/* Image */}
          <div className="relative">
            {(item.image_url || item.image_upload_url) ? (
              <img
                src={item.image_upload_url || item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover rounded-md mb-4"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-4xl opacity-20 rounded-md mb-4">
                🍽️
              </div>
            )}

            {/* Special Badge */}
            {item.is_special && (
              <Badge className="special-badge absolute top-2 left-2">
                <Star className="h-3 w-3 mr-1" />
                Special
              </Badge>
            )}

            {/* Prep Time */}
            {item.prep_time && (
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {item.prep_time}m
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="font-display text-xl font-bold mb-2">{item.name}</h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {item.description || 'No description available.'}
          </p>

          {/* Price */}
          <p className="font-inter text-lg font-semibold text-gold mb-2">
            ${item.price.toFixed(2)}
          </p>

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.allergens.map((allergen, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {allergen}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          size="sm"
          className="btn-coffee w-full mt-4 animate-gold-shimmer transition-smooth"
          onClick={handleAddToCart}
          disabled={!item.is_available || isAdding}
        >
          <Plus className="h-4 w-4 mr-2" />
          {!item.is_available ? 'Unavailable' : isAdding ? 'Adding...' : 'Add to Cart'}
        </Button>
      </CardContent>
    </Card>
  );
};
