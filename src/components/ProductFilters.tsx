import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Filter, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface ProductFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  maxPrice: number;
  onPriceRangeChange: (range: [number, number]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  maxPrice,
  onPriceRangeChange,
  onReset,
  hasActiveFilters,
}: ProductFiltersProps) => {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const handlePriceChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setLocalPriceRange(newRange);
  };

  const applyPriceFilter = () => {
    onPriceRangeChange(localPriceRange);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleQuickPrice = (min: number, max: number) => {
    setLocalPriceRange([min, max]);
    onPriceRangeChange([min, max]);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Category Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-primary/20 gap-2"
          >
            <Filter className="h-4 w-4" />
            {selectedCategory === "All" ? "Category" : selectedCategory}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card border border-border shadow-lg z-50 min-w-[180px]">
          <DropdownMenuLabel className="text-muted-foreground text-xs">Select Category</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto p-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onCategoryChange(category);
                }}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Price Range Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-primary/20 gap-2"
          >
            Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card border border-border shadow-lg z-50 w-[280px] p-4" align="start">
          <DropdownMenuLabel className="text-muted-foreground text-xs px-0 mb-3">Price Range</DropdownMenuLabel>
          
          {/* Slider */}
          <div className="mb-4">
            <Slider
              value={localPriceRange}
              onValueChange={handlePriceChange}
              min={0}
              max={maxPrice}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-foreground font-medium">{formatPrice(localPriceRange[0])}</span>
              <span className="text-muted-foreground">to</span>
              <span className="text-foreground font-medium">{formatPrice(localPriceRange[1])}</span>
            </div>
          </div>

          {/* Quick Select */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => handleQuickPrice(0, 500)}
              className="px-2 py-1.5 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Under ₹500
            </button>
            <button
              onClick={() => handleQuickPrice(500, 1000)}
              className="px-2 py-1.5 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              ₹500 - ₹1,000
            </button>
            <button
              onClick={() => handleQuickPrice(1000, 2000)}
              className="px-2 py-1.5 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              ₹1,000 - ₹2,000
            </button>
            <button
              onClick={() => handleQuickPrice(2000, maxPrice)}
              className="px-2 py-1.5 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Above ₹2,000
            </button>
          </div>

          <Button
            onClick={() => {
              applyPriceFilter();
              setIsOpen(false);
            }}
            size="sm"
            className="w-full rounded-full"
          >
            Apply
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground rounded-full gap-1"
        >
          <X className="h-3 w-3" />
          Reset
        </Button>
      )}
    </div>
  );
};
