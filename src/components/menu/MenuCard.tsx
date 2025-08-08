import { useState } from 'react';
import { Plus, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/types';
import { useCart } from '@/hooks/useCart';

interface MenuCardProps {
  item: MenuItem;
  className?: string;
}

export const MenuCard = ({ item, className }: MenuCardProps) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(item);
    setIsAdding(false);
  };

  return (
    <Card className={`food-item group overflow-hidden ${item.is_special ? 'special-float ring-2 ring-accent/20' : ''} ${className}`}>
      <div className="relative">
        {/* Food Image */}
        <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          {(item.image_url || item.image_upload_url) ? (
            <img 
              src={item.image_upload_url || item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const nextElement = target.nextElementSibling as HTMLElement;
                if (nextElement) nextElement.style.display = 'flex';
              }}
            />
          ) : null}
          {!(item.image_url || item.image_upload_url) && (
            <div className="text-4xl opacity-20">🍽️</div>
          )}
        </div>

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

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Name and Price */}
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
            <span className="price-tag text-lg font-bold">${item.price.toFixed(2)}</span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.allergens.map((allergen, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {allergen}
                </Badge>
              ))}
            </div>
          )}

          {/* Add to Cart Button */}
          <Button 
            onClick={handleAddToCart}
            disabled={!item.is_available || isAdding}
            className="btn-food w-full mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            {!item.is_available ? 'Unavailable' : isAdding ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};