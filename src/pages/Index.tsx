"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast"; // Importando as funções de toast

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("urban-ceo");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
    }
  };

  const generateImage = () => {
    if (!selectedImage) {
      showError("Por favor, envie uma foto primeiro.");
      return;
    }

    setIsLoading(true);
    const loadingToastId = showLoading("Gerando sua imagem de rico...");

    // Simulate image generation based on scenario
    let imageUrl = "";
    switch (selectedScenario) {
      case "urban-ceo":
        imageUrl = "https://picsum.photos/seed/urban-ceo/800/600"; // Placeholder para CEO Urbano
        break;
      case "silent-elite":
        imageUrl = "https://picsum.photos/seed/silent-elite/800/600"; // Placeholder para Elite Silenciosa
        break;
      case "international-freedom":
        imageUrl = "https://picsum.photos/seed/international-freedom/800/600"; // Placeholder para Liberdade Internacional
        break;
      default:
        imageUrl = "https://picsum.photos/seed/default/800/600";
    }

    // Simulate API call delay
    setTimeout(() => {
      setGeneratedImageUrl(imageUrl);
      setIsDialogOpen(true);
      dismissToast(loadingToastId);
      showSuccess("Imagem gerada com sucesso!");
      setIsLoading(false);
    }, 2000); // 2 seconds delay
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
              disabled={isLoading}
              className="w-full md:w-auto px-8 py-3 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? "Gerando..." : "Gerar Imagem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0 border-none bg-transparent">
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