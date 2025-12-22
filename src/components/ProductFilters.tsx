import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [isOpen, setIsOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);

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

  return (
    <div className="mb-6">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between rounded-full border-primary/20"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <FilterContent
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              localPriceRange={localPriceRange}
              maxPrice={maxPrice}
              handlePriceChange={handlePriceChange}
              applyPriceFilter={applyPriceFilter}
              formatPrice={formatPrice}
              onReset={onReset}
              hasActiveFilters={hasActiveFilters}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          localPriceRange={localPriceRange}
          maxPrice={maxPrice}
          handlePriceChange={handlePriceChange}
          applyPriceFilter={applyPriceFilter}
          formatPrice={formatPrice}
          onReset={onReset}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </div>
  );
};

interface FilterContentProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  localPriceRange: [number, number];
  maxPrice: number;
  handlePriceChange: (values: number[]) => void;
  applyPriceFilter: () => void;
  formatPrice: (price: number) => string;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const FilterContent = ({
  categories,
  selectedCategory,
  onCategoryChange,
  localPriceRange,
  maxPrice,
  handlePriceChange,
  applyPriceFilter,
  formatPrice,
  onReset,
  hasActiveFilters,
}: FilterContentProps) => {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Price Range</h4>
        <div className="px-2">
          <Slider
            value={localPriceRange}
            onValueChange={handlePriceChange}
            min={0}
            max={maxPrice}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-foreground font-medium">{formatPrice(localPriceRange[0])}</span>
            <span className="text-muted-foreground">to</span>
            <span className="text-foreground font-medium">{formatPrice(localPriceRange[1])}</span>
          </div>
        </div>
        <Button
          onClick={applyPriceFilter}
          variant="outline"
          size="sm"
          className="w-full rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground"
        >
          Apply Price Filter
        </Button>
      </div>

      {/* Quick Price Ranges */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Quick Select</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              handlePriceChange([0, 500]);
              setTimeout(applyPriceFilter, 0);
            }}
            className="px-3 py-2 text-xs rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Under ₹500
          </button>
          <button
            onClick={() => {
              handlePriceChange([500, 1000]);
              setTimeout(applyPriceFilter, 0);
            }}
            className="px-3 py-2 text-xs rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            ₹500 - ₹1,000
          </button>
          <button
            onClick={() => {
              handlePriceChange([1000, 2000]);
              setTimeout(applyPriceFilter, 0);
            }}
            className="px-3 py-2 text-xs rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            ₹1,000 - ₹2,000
          </button>
          <button
            onClick={() => {
              handlePriceChange([2000, maxPrice]);
              setTimeout(applyPriceFilter, 0);
            }}
            className="px-3 py-2 text-xs rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Above ₹2,000
          </button>
        </div>
      </div>
    </div>
  );
};
