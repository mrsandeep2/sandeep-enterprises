import { useState, useEffect, useRef, useCallback } from 'react';
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

// NLP keyword mappings for smart suggestions
const NLP_SYNONYMS: Record<string, string[]> = {
  'rice': ['chawal', 'basmati', 'biryani', 'pulao', 'parmal', 'sona', 'katarani'],
  'chawal': ['rice', 'basmati', 'biryani', 'pulao'],
  'biryani': ['rice', 'chawal', 'basmati', 'aromatic'],
  'pulao': ['rice', 'basmati', 'aromatic'],
  'cattle': ['kapila', 'feed', 'dairy', 'animal'],
  'feed': ['kapila', 'cattle', 'dairy', 'animal'],
  'kapila': ['cattle', 'feed', 'dairy'],
  'flour': ['atta', 'wheat', 'chapati', 'roti'],
  'atta': ['flour', 'wheat', 'chapati', 'roti'],
  'wheat': ['atta', 'flour', 'chokar', 'bran'],
  'bran': ['chokar', 'wheat'],
  'chokar': ['bran', 'wheat'],
  'cheap': ['affordable', 'budget', 'low price'],
  'premium': ['quality', 'best', 'aromatic'],
  'best': ['premium', 'quality', 'top'],
};

export const AISearch = ({ onResults, onClear }: AISearchProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch all products on mount for local suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) setAllProducts(data);
    };
    fetchProducts();
  }, []);

  // Smart NLP-based matching function
  const getSmartSuggestions = useCallback((searchTerm: string): Product[] => {
    if (!searchTerm.trim() || allProducts.length === 0) return [];

    const term = searchTerm.toLowerCase().trim();
    const words = term.split(/\s+/);
    
    // Get related keywords from NLP synonyms
    const expandedTerms = new Set<string>();
    words.forEach(word => {
      expandedTerms.add(word);
      // Add synonyms
      Object.entries(NLP_SYNONYMS).forEach(([key, synonyms]) => {
        if (key.startsWith(word) || word.startsWith(key)) {
          expandedTerms.add(key);
          synonyms.forEach(s => expandedTerms.add(s));
        }
      });
    });

    // Score each product based on relevance
    const scoredProducts = allProducts.map(product => {
      let score = 0;
      const name = product.name.toLowerCase();
      const category = (product.category || '').toLowerCase();
      const description = (product.description || '').toLowerCase();

      // Exact prefix match (highest priority)
      if (name.startsWith(term)) score += 100;
      
      // Word starts with search term
      const nameWords = name.split(/\s+/);
      nameWords.forEach(nameWord => {
        words.forEach(searchWord => {
          if (nameWord.startsWith(searchWord)) score += 50;
          if (nameWord.includes(searchWord)) score += 20;
        });
      });

      // Category match
      if (category.startsWith(term)) score += 40;
      words.forEach(word => {
        if (category.includes(word)) score += 15;
      });

      // NLP expanded terms match
      expandedTerms.forEach(expandedTerm => {
        if (name.includes(expandedTerm)) score += 10;
        if (category.includes(expandedTerm)) score += 8;
        if (description.includes(expandedTerm)) score += 5;
      });

      // Fuzzy matching for typos (Levenshtein-like)
      nameWords.forEach(nameWord => {
        words.forEach(searchWord => {
          if (searchWord.length >= 3) {
            const similarity = calculateSimilarity(nameWord, searchWord);
            if (similarity > 0.6) score += Math.floor(similarity * 15);
          }
        });
      });

      return { product, score };
    });

    // Filter and sort by score
    return scoredProducts
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.product);
  }, [allProducts]);

  // Simple similarity calculation for fuzzy matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1;
    if (str1.length < 2 || str2.length < 2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    
    return matches / longer.length;
  };

  // Update suggestions as user types
  useEffect(() => {
    if (query.length >= 1) {
      const results = getSmartSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, getSmartSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
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

  const handleSuggestionClick = (product: Product) => {
    setQuery(product.name);
    setShowSuggestions(false);
    onResults([product]);
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleSearch();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const words = query.toLowerCase().split(/\s+/);
    let result = text;
    
    words.forEach(word => {
      if (word.length >= 1) {
        const regex = new RegExp(`(${word})`, 'gi');
        result = result.replace(regex, '<mark class="bg-primary/30 text-foreground rounded px-0.5">$1</mark>');
      }
    });
    
    return result;
  };

  return (
    <div className="max-w-2xl mx-auto mb-8 relative">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-primary">AI-Powered Search</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Try: 'basmati' or 'cattle feed' or 'atta'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pl-10 pr-10 h-12 rounded-full border-2 border-primary/20 focus:border-primary"
            autoComplete="off"
          />
          {hasSearched && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium text-foreground truncate"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(product.name, query) }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {product.category} • ₹{product.price}
                    </p>
                  </div>
                </button>
              ))}
              <div className="px-4 py-2 bg-muted/50 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Press Enter for AI-powered deep search
                </p>
              </div>
            </div>
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
        Type to see suggestions • Press Enter for AI deep search
      </p>
    </div>
  );
};
