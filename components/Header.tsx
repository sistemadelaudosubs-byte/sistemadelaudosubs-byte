import React from 'react';
import { HeartHandshake } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LibrasMed AI</h1>
            <p className="text-xs text-emerald-600 font-medium">Assistente de Acessibilidade Médica</p>
          </div>
        </div>
        <div className="hidden md:block">
           <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
             Powered by Gemini 2.5 & Veo
           </span>
        </div>
      </div>
    </header>
  );
};