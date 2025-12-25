"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

// Hardcoded values from Supabase context for explicit fetch
const SUPABASE_URL = "https://hilblatimkqacigwnqbm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbGJsYXRpbWtxYWNpZ3ducWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODgwMzAsImV4cCI6MjA4MjI2NDAzMH0.8OP4EugeH2lB25x1eJ9EXE1_2w340glrNlRBOc2rhJ4";
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-rich-image`;

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("urban-ceo");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // States for displaying response/error explicitly
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError("Por favor, envie um arquivo de imagem válido.");
        setSelectedImage(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
    }
  };

  const generateImage = async () => {
    if (!selectedImage) {
      showError("Por favor, envie uma foto primeiro.");
      return;
    }

    setIsLoading(true);
    setResponseMessage(null);
    setErrorMessage(null);
    const loadingToastId = showLoading("Criando sua versão de alto nível…");

    try {
      // Extract raw base64 data (remove prefix like 'data:image/jpeg;base64,')
      const base64Image = selectedImage.split(',')[1];
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          image: base64Image,
          scenario: selectedScenario,
        }),
      });

      // Check for network/HTTP errors (e.g., 404, 500, or CORS failure)
      if (!response.ok) {
        let errorBody = {};
        try {
          errorBody = await response.json();
        } catch (e) {
          // If response is not JSON (e.g., HTML error page or CORS issue)
          const text = await response.text();
          errorBody = { message: text.substring(0, 200) + '...', raw_response: text };
        }
        
        const detailedError = `Erro HTTP ${response.status} (${response.statusText}): ${JSON.stringify(errorBody, null, 2)}`;
        console.error("Generation failed (HTTP Error):", detailedError);
        setErrorMessage(detailedError);
        throw new Error(`Falha na chamada da função: Status ${response.status}`);
      }

      const data = await response.json();
      
      // Check for application-level errors returned in the JSON body from the Edge Function
      if (data && data.error) {
        const detailedError = `Erro da Edge Function: ${data.error}`;
        console.error("Generation failed (Edge Function Error):", data.error);
        setErrorMessage(detailedError);
        throw new Error(detailedError); 
      }

      if (data && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setIsDialogOpen(true);
        
        // Display full JSON response on screen
        setResponseMessage(JSON.stringify(data, null, 2)); 
        showSuccess(data.message);
      } else {
        const detailedError = "Resposta inválida da função de geração de imagem.";
        setErrorMessage(detailedError);
        throw new Error(detailedError);
      }

    } catch (e) {
      // If errorMessage was set in specific blocks, use it. Otherwise, use generic error.
      const finalErrorMessage = errorMessage || (e instanceof Error ? e.message : 'Erro desconhecido durante a geração.');
      
      // Ensure error message is set for permanent display if it wasn't set in specific error blocks
      if (!errorMessage) {
          setErrorMessage(finalErrorMessage);
          console.error("Generation failed (Catch Block):", e);
      }
      
      // Show toast for immediate feedback
      showError(`Falha na geração: ${finalErrorMessage}`);
      
    } finally {
      dismissToast(loadingToastId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-white p-4">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Se Eu Fosse Rico
          </CardTitle>
          <p className="text-gray-400 text-lg">Visualize-se em um mundo de luxo e status.</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Photo Upload */}
          <div className="space-y-4">
            <Label htmlFor="picture" className="text-lg font-semibold text-gray-300">
              1. Envie sua foto
            </Label>
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
            />
            {selectedImage && (
              <div className="mt-4 flex justify-center">
                <img src={selectedImage} alt="Uploaded Preview" className="max-w-xs max-h-48 rounded-lg shadow-md object-cover" />
              </div>
            )}
          </div>

          {/* Scenario Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-300">
              2. Escolha um cenário de alto status
            </Label>
            <RadioGroup
              defaultValue="urban-ceo"
              onValueChange={setSelectedScenario}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <RadioGroupItem value="urban-ceo" id="urban-ceo" className="text-purple-400" />
                <Label htmlFor="urban-ceo" className="text-gray-300 text-base cursor-pointer">
                  CEO Urbano
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <RadioGroupItem value="silent-elite" id="silent-elite" className="text-purple-400" />
                <Label htmlFor="silent-elite" className="text-gray-300 text-base cursor-pointer">
                  Elite Silenciosa
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <RadioGroupItem value="international-freedom" id="international-freedom" className="text-purple-400" />
                <Label htmlFor="international-freedom" className="text-gray-300 text-base cursor-pointer">
                  Liberdade Internacional
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <Button
              onClick={generateImage}
              disabled={isLoading || !selectedImage}
              className="w-full md:w-auto px-8 py-3 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? "Gerando..." : "Gerar Imagem"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Display Response/Error Card */}
      {(responseMessage || errorMessage) && (
        <Card className="w-full max-w-2xl mt-6 bg-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className={`text-xl ${errorMessage ? 'text-red-400' : 'text-green-400'}`}>
              {errorMessage ? "Detalhes do Erro da Edge Function" : "Resposta da Edge Function (Sucesso)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className={`whitespace-pre-wrap bg-gray-900 p-3 rounded-md overflow-auto text-sm ${errorMessage ? 'text-red-400' : 'text-gray-300'}`}>
              {errorMessage || responseMessage}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Generated Image Dialog (Full Screen) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full w-full h-full p-0 border-none bg-transparent flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Sua Imagem de Rico</DialogTitle>
          </DialogHeader>
          {generatedImageUrl && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={generatedImageUrl}
                alt="Generated Rich Image"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              <Button
                onClick={() => {
                  // Em um aplicativo real, você forneceria um link de download ou funcionalidade de compartilhamento
                  showSuccess("Funcionalidade de compartilhamento/download em breve!");
                }}
                className="absolute bottom-4 right-4 bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-full shadow-md"
              >
                Compartilhar / Baixar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MadeWithDyad />
    </div>
  );
};

export default Index;