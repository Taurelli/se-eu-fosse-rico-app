import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.15.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client using the Service Role Key for server-side operations (like storage upload)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    },
  }
);

// Initialize Gemini client
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY secret not set.");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Scenario mapping for detailed prompting
const scenarioDetails: { [key: string]: string } = {
  "urban-ceo": "Cenário: Escritório de alto padrão em arranha-céu com vista panorâmica da cidade ao anoitecer.",
  "silent-elite": "Cenário: Interior de uma mansão minimalista e moderna, com obras de arte discretas e luz natural suave.",
  "international-freedom": "Cenário: Deck de um iate de luxo no Mediterrâneo, com montanhas e mar azul ao fundo.",
};

// Helper function to convert base64 to Part object for Gemini
function base64ToGenerativePart(base64Data: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { base64Image, scenario } = await req.json();

    if (!base64Image) {
      return new Response(JSON.stringify({ error: "Imagem base64 não fornecida." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const selectedScenarioDetail = scenarioDetails[scenario] || scenarioDetails["urban-ceo"];

    const prompt = `
      Crie um retrato ultra-realista da mesma pessoa da foto enviada, mantendo fielmente o rosto.
      Estilo: fotografia editorial de luxo, estética cinematográfica.
      ${selectedScenarioDetail}
      Roupa elegante, expressão confiante, iluminação profissional.
      Sem caricatura, sem distorção.
      A saída deve ser APENAS a imagem gerada, sem texto adicional.
    `;

    // Assuming the input image is JPEG for simplicity, but ideally, we'd pass the mimeType from the client.
    const imagePart = base64ToGenerativePart(base64Image, "image/jpeg");

    // Call Gemini to generate the image
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Supports multimodal input
      contents: [imagePart, prompt],
    });

    // Check if the response contains image data (which is usually base64 encoded in the response)
    const generatedImageBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!generatedImageBase64) {
      console.error("Gemini did not return a valid image part:", response);
      return new Response(JSON.stringify({ error: "Falha ao gerar imagem. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Upload to Supabase Storage ---
    const imageFileName = `rich-image-${Date.now()}.jpeg`;
    const imageBuffer = Uint8Array.from(atob(generatedImageBase64), c => c.charCodeAt(0));

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rich-images')
      .upload(imageFileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw new Error(`Falha ao salvar imagem: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('rich-images')
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    const responseData = { 
      status: "success", 
      message: "Sua imagem de rico foi gerada com sucesso!",
      imageUrl: imageUrl
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});