import { Button } from '@/components/ui/button';
import { MenuCategory } from '@/types';

interface CategoryFilterProps {
  categories: MenuCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export const CategoryFilter = ({ categories, selectedCategory, onCategorySelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-secondary/30 rounded-lg">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onCategorySelect(null)}
        className={selectedCategory === null ? "btn-food" : ""}
      >
        All Items
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onCategorySelect(category.id)}
          className={selectedCategory === category.id ? "btn-food" : ""}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};