import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface AIRecommendationsProps {
  currentProductId: string;
  category?: string | null;
}

export const AIRecommendations = ({ currentProductId, category }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-recommendations', {
          body: { currentProductId, category }
        });

        if (error) throw error;

        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, category]);

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">AI Recommendations</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">You might also like</h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">AI Powered</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Link key={product.id} to={`/product/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer h-full">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h4>
                <p className="text-primary font-semibold mt-1">₹{product.price}</p>
                {product.category && (
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
