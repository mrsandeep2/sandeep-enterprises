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
    const { query } = await req.json();
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

    console.log("Processing AI search for:", query);

    // Use AI to understand the query and match products
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
            content: `You are a product search assistant for a rice and grain store. Given a user's natural language query, analyze it and return matching product IDs.

Available products:
${products?.map(p => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Description: ${p.description || 'N/A'}, Price: ₹${p.price}`).join('\n')}

Understand queries like:
- "best rice for biryani" → return biryani rice products
- "something for my cattle" → return Kapila cattle feed
- "cheap rice" → return lower priced rice options
- "flour for chapati" → return Atta products
- "I want to make pulao" → suggest aromatic rice like Basmati

Return ONLY a JSON array of matching product IDs, nothing else. Example: ["id1", "id2"]
If no matches, return empty array: []`
          },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", errorText);
      throw new Error("AI search failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the AI response to get product IDs
    let matchedIds: string[] = [];
    try {
      // Extract JSON array from response
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        matchedIds = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      matchedIds = [];
    }

    // Filter products by matched IDs
    const matchedProducts = products?.filter(p => matchedIds.includes(p.id)) || [];
    
    console.log("Matched products:", matchedProducts.length);

    return new Response(JSON.stringify({ 
      products: matchedProducts,
      query,
      matchedCount: matchedProducts.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Search failed",
      products: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
