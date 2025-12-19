import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number | null;
  category: string | null;
}

interface AISearchProps {
  onResults: (products: Product[] | null) => void;
  onClear: () => void;
}

export const AISearch = ({ onResults, onClear }: AISearchProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query: query.trim() }
      });

      if (error) throw error;

      if (data.products && data.products.length > 0) {
        onResults(data.products);
        toast({
          title: "AI Search Complete",
          description: `Found ${data.products.length} product${data.products.length > 1 ? 's' : ''} matching your query`,
        });
      } else {
        onResults([]);
        toast({
          title: "No matches found",
          description: "Try a different search query",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    onClear();
  };

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-primary">AI-Powered Search</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Try: 'best rice for biryani' or 'something for cattle'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-10 h-12 rounded-full border-2 border-primary/20 focus:border-primary"
          />
          {hasSearched && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="h-12 px-6 rounded-full"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Ask in natural language - I understand context like "cheap option" or "for making pulao"
      </p>
    </div>
  );
};
