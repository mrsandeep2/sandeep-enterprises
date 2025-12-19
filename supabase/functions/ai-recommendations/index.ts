import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentProductId, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get all products from database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data: products, error } = await supabase.from("products").select("*");
    
    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch products");
    }

    const currentProduct = products?.find(p => p.id === currentProductId);
    
    console.log("Getting recommendations for:", currentProduct?.name || category);

    // Use AI to recommend products
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are a product recommendation AI for a rice and grain store. Suggest complementary or similar products based on what the customer is viewing.

Available products:
${products?.map(p => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: ₹${p.price}`).join('\n')}

Rules:
1. If viewing rice, suggest other rice types or complementary items (atta for rotis)
2. If viewing atta, suggest rice varieties that go well with rotis
3. If viewing cattle feed, suggest other feed varieties
4. Don't recommend the same product being viewed
5. Return 3-4 recommendations maximum

Return ONLY a JSON array of product IDs, nothing else. Example: ["id1", "id2", "id3"]`
          },
          { 
            role: "user", 
            content: currentProduct 
              ? `Customer is viewing: ${currentProduct.name} (${currentProduct.category}) priced at ₹${currentProduct.price}. What products would complement this or serve as alternatives?`
              : `Customer is browsing ${category || 'all'} products. What would you recommend?`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", errorText);
      throw new Error("AI recommendation failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the AI response to get product IDs
    let recommendedIds: string[] = [];
    try {
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        recommendedIds = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      recommendedIds = [];
    }

    // Filter out the current product and get recommended products
    const recommendedProducts = products
      ?.filter(p => recommendedIds.includes(p.id) && p.id !== currentProductId)
      .slice(0, 4) || [];
    
    console.log("Recommended products:", recommendedProducts.length);

    return new Response(JSON.stringify({ 
      recommendations: recommendedProducts,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Recommendations failed",
      recommendations: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
