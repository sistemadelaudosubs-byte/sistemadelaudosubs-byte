import React, { useState } from 'react';
import { Header } from './components/Header';
import { translateToLibras, generateIllustration } from './services/geminiService';
import { LoadingState, TranslationResult } from './types';
import { FileText, Wand2, Download, AlertCircle, Loader2, HeartHandshake, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { jsPDF } from "jspdf";

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setStatus(LoadingState.TRANSLATING_TEXT);
    setErrorMsg(null);
    setResult(null);

    try {
      // 1. Translate Text to Gloss
      const textResult = await translateToLibras(inputText);
      
      // 2. Generate Illustration based on the explanation
      setStatus(LoadingState.GENERATING_IMAGE);
      const imageUrl = await generateIllustration(textResult.explanation);

      const newResult: TranslationResult = {
        originalText: inputText,
        librasGloss: textResult.gloss,
        explanation: textResult.explanation,
        imageUrl: imageUrl || undefined
      };

      setResult(newResult);
      setStatus(LoadingState.SUCCESS);

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Ocorreu um erro desconhecido.");
      setStatus(LoadingState.ERROR);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPos = 15;

    // --- Header ---
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.setFont("helvetica", "bold");
    doc.text("LibrasMed - Orientação Médica", margin, yPos);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${dateStr}`, pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // --- 1. Original Text ---
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Prescrição Original:", margin, yPos);
    yPos += 5;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const originalLines = doc.splitTextToSize(result.originalText, contentWidth);
    doc.text(originalLines, margin, yPos);
    // Calculate height used by original text (approx 4mm per line)
    yPos += (originalLines.length * 4) + 6;

    // --- 2. Gloss Box (Priority Content) ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 80, 0); // Dark Green
    doc.text("Tradução em Libras (Glossa):", margin, yPos);
    yPos += 5;

    doc.setFontSize(11);
    doc.setFont("courier", "bold");
    const glossLines = doc.splitTextToSize(result.librasGloss, contentWidth - 6);
    const glossHeight = (glossLines.length * 5) + 6;

    // Draw background for gloss
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.rect(margin, yPos, contentWidth, glossHeight, 'F');
    
    doc.setTextColor(0, 100, 0);
    doc.text(glossLines, margin + 3, yPos + 5);
    yPos += glossHeight + 8;

    // --- 3. Explanation ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Instruções ao Paciente:", margin, yPos);
    yPos += 5;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const explLines = doc.splitTextToSize(result.explanation, contentWidth);
    doc.text(explLines, margin, yPos);
    yPos += (explLines.length * 4) + 8;

    // --- 4. Image (Dynamic Fit) ---
    // Calculate remaining vertical space before the footer area
    const footerHeight = 15;
    const availableHeight = pageHeight - yPos - footerHeight - margin;

    if (result.imageUrl && availableHeight > 30) {
      // Check if we have a decent amount of space (at least 30mm)
      try {
        const aspect = 1; // Assuming square-ish generation
        let imgHeight = availableHeight;
        let imgWidth = imgHeight * aspect;

        // Constraint max width to content width
        if (imgWidth > contentWidth) {
          imgWidth = contentWidth;
          imgHeight = imgWidth / aspect;
        }

        // Cap max height for aesthetics if there is too much empty space
        if (imgHeight > 100) {
           imgHeight = 100;
           imgWidth = 100;
        }

        const xImg = (pageWidth - imgWidth) / 2;
        doc.addImage(result.imageUrl, 'PNG', xImg, yPos, imgWidth, imgHeight);
      } catch (e) {
        console.error("Error embedding image:", e);
      }
    }

    // --- Footer ---
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Este documento é um auxílio gerado por IA. Consulte sempre um profissional de saúde ou intérprete.",
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    doc.save("prescricao-libras.pdf");
  };

  const isProcessing = status === LoadingState.TRANSLATING_TEXT || status === LoadingState.GENERATING_IMAGE;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col">
      <Header />
      
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* INPUT SECTION */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Orientação Médica
              </h2>
              <textarea
                className="w-full h-48 p-4 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-base"
                placeholder="Digite aqui a prescrição ou orientação médica (ex: Tomar 1 comprimido de dipirona a cada 6 horas se houver dor)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
              />
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  onClick={handleTranslate}
                  disabled={!inputText.trim() || isProcessing}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wand2 className="w-5 h-5" />
                  )}
                  {status === LoadingState.GENERATING_IMAGE ? "Gerando Imagem..." : "Traduzir e Gerar Visual"}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {status === LoadingState.TRANSLATING_TEXT && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                Traduzindo texto e convertendo para estrutura gramatical de Libras...
              </div>
            )}
            
            {status === LoadingState.GENERATING_IMAGE && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando ilustração explicativa para o paciente...
              </div>
            )}

            {status === LoadingState.ERROR && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* OUTPUT SECTION */}
          <div className="space-y-6">
            {!result ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                <HeartHandshake className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center font-medium">A tradução aparecerá aqui</p>
                <p className="text-sm text-center opacity-70 mt-2 max-w-xs">
                  Insira o texto médico ao lado para gerar a Glossa e a ilustração visual.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Gloss Card */}
                <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-emerald-100">
                  <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-900">Tradução (Glossa)</h3>
                    <span className="text-xs bg-white text-emerald-700 px-2 py-1 rounded border border-emerald-200">Gramática Libras</span>
                  </div>
                  <div className="p-6">
                    <p className="text-lg font-mono font-bold text-gray-800 leading-relaxed mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {result.librasGloss}
                    </p>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Instrução ao Paciente:</h4>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {result.explanation}
                    </p>
                    
                    {result.imageUrl && (
                       <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
                         <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 flex items-center gap-2 border-b border-gray-100">
                           <ImageIcon size={14} />
                           Ilustração Gerada por IA
                         </div>
                         <div className="flex justify-center p-4 bg-white">
                            <img 
                              src={result.imageUrl} 
                              alt="Ilustração médica" 
                              className="max-h-64 rounded-lg object-contain shadow-sm border border-gray-100"
                            />
                         </div>
                       </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  Baixar PDF para o Paciente
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
           <div className="mb-2 sm:mb-0">
             © {new Date().getFullYear()} LibrasMed AI. Todos os direitos reservados.
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
              <span className="flex items-center gap-1">
                Desenvolvedor: <span className="font-semibold text-gray-700">Jaime Eduardo</span>
              </span>
              <a 
                href="https://wa.me/5551985502897"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors font-medium"
              >
                <MessageCircle size={14} />
                WhatsApp: (51) 98550-2897
              </a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;