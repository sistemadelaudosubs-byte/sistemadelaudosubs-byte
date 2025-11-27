import React, { useEffect, useState } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface ApiKeyCheckerProps {
  onReady: () => void;
}

export const ApiKeyChecker: React.FC<ApiKeyCheckerProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);

  const checkKey = async () => {
    // Access aistudio via type assertion to avoid conflicts with global types
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      if (selected) {
        setHasKey(true);
        onReady();
      }
    } else {
      // Fallback for dev environments without the specific extension wrapper
      onReady(); 
      setHasKey(true);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      await aiStudio.openSelectKey();
      // Assume success after interaction and re-check/proceed
      await checkKey();
    }
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração Necessária</h2>
        <p className="text-gray-600 mb-6">
          Para utilizar os recursos de vídeo (Veo) e tradução avançada, você precisa selecionar uma chave de API válida com faturamento ativado.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleSelectKey}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-200"
          >
            Selecionar Chave de API
          </button>
          
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Sobre faturamento e chaves <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};