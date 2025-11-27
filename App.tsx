import React, { useState } from 'react';
import { Header } from './components/Header';
import { translateToLibras, generateIllustration, generateSymptomIllustration } from './services/geminiService';
import { LoadingState, TranslationResult } from './types';
import { FileText, Wand2, Download, AlertCircle, Loader2, HeartHandshake, Image as ImageIcon, MessageCircle, Activity, CheckSquare, RefreshCw, AlertTriangle } from 'lucide-react';
import { jsPDF } from "jspdf";

// --- DADOS DOS SINTOMAS (Configuração) ---
interface Symptom {
  id: string;
  label: string;
  librasDescription: string;
  placeholderUrl: string;
  warning?: string; // Campo opcional para avisos (ex: Somente por consulta agendada)
}

const SYMPTOMS_DATA: Symptom[] = [
  // --- SINTOMAS GERAIS ---
  { 
    id: 'dor_cabeca', 
    label: 'Dor de cabeça', 
    librasDescription: 'Mão com dedos indicador e polegar estendidos (configuração em L) tocando a têmpora repetidamente, com expressão de dor.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Dor+de+Cabeca'
  },
  { 
    id: 'febre', 
    label: 'Febre', 
    librasDescription: 'Dorso da mão tocando a testa, com expressão de desconforto/calor.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Febre'
  },
  { 
    id: 'tosse', 
    label: 'Tosse', 
    librasDescription: 'Mão em configuração de "C" ou mão aberta batendo levemente no peito/esôfago algumas vezes.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Tosse'
  },
  { 
    id: 'falta_ar', 
    label: 'Falta de ar', 
    librasDescription: 'Mãos abertas no peito movendo-se para cima e para baixo, com expressão de respiração ofegante.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Falta+de+Ar'
  },
  { 
    id: 'nausea', 
    label: 'Náusea/Enjoo', 
    librasDescription: 'Mão em garra girando na região do estômago, expressão de asco.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Nausea'
  },
  { 
    id: 'vomito', 
    label: 'Vômito', 
    librasDescription: 'Mãos saindo da boca para frente, dedos se abrindo, simulando o ato de vomitar.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Vomito'
  },
  { 
    id: 'dor_abdominal', 
    label: 'Dor abdominal', 
    librasDescription: 'Mão tocando a barriga com expressão de dor, podendo fazer movimento circular.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Dor+Abdominal'
  },
  { 
    id: 'tontura', 
    label: 'Tontura', 
    librasDescription: 'Mão em garra sobre a testa fazendo movimento giratório ou mão girando ao redor da cabeça.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Tontura'
  },
  { 
    id: 'dor_peito', 
    label: 'Dor no peito', 
    librasDescription: 'Mão fechada ou aberta tocando o centro do peito com força, expressão de dor intensa.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Dor+no+Peito'
  },
  { 
    id: 'coriza', 
    label: 'Coriza', 
    librasDescription: 'Dedos indicador e polegar descendo pelo nariz, simulando escorrer.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Coriza'
  },
  // --- NOVOS SINTOMAS ---
  {
    id: 'alergia',
    label: 'Alergias',
    librasDescription: 'Mão coçando o dorso da outra mão ou o braço repetidamente, ou sinal de espirro se for respiratória.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Alergia'
  },
  {
    id: 'lesoes_pele',
    label: 'Lesões na pele',
    librasDescription: 'Apontar para o local da lesão na pele e fazer movimento circular indicando a mancha ou ferida.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Lesoes+Pele'
  },
  {
    id: 'dor_ocular',
    label: 'Dor ocular',
    librasDescription: 'Mão em configuração de "C" próxima ao olho (sem tocar) com expressão facial de dor.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Dor+no+Olho'
  },
  {
    id: 'dor_face',
    label: 'Dor na face',
    librasDescription: 'Mão aberta passando suavemente ou tocando a região do rosto afetada com expressão de dor.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Dor+na+Face'
  },
  {
    id: 'dor_corpo',
    label: 'Dor no corpo',
    librasDescription: 'Mãos passando pelos braços e tronco, com expressão corporal de cansaço e dor generalizada.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Dor+no+Corpo'
  },
  // --- PROCEDIMENTOS / ADMINISTRATIVO ---
  {
    id: 'solicitacao_exames',
    label: 'Solicitação de Exames',
    librasDescription: 'Mão base aberta (papel) + mão dominante tocando a palma (escrever/pedir) seguido do sinal de EXAMINAR/INVESTIGAR.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Pedir+Exames',
    warning: 'Somente por consulta agendada'
  },
  {
    id: 'receitas',
    label: 'Receitas Médicas',
    librasDescription: 'Mão base aberta (papel) + mão dominante simulando assinar ou carimbar o papel.',
    placeholderUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Sinal:+Receita',
    warning: 'Somente por consulta agendada'
  }
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State for Checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  // Store generated base64 images for symptoms to ensure they are visible and printable
  const [symptomImages, setSymptomImages] = useState<Record<string, string>>({});
  const [loadingSymptoms, setLoadingSymptoms] = useState<Record<string, boolean>>({});

  const generateSymptomImageIfNeeded = async (symptomId: string) => {
    // If we already have the image or are loading it, do nothing
    if (symptomImages[symptomId] || loadingSymptoms[symptomId]) return;

    const symptom = SYMPTOMS_DATA.find(s => s.id === symptomId);
    if (!symptom) return;

    setLoadingSymptoms(prev => ({ ...prev, [symptomId]: true }));
    try {
      const base64Image = await generateSymptomIllustration(symptom.label, symptom.librasDescription);
      if (base64Image) {
        setSymptomImages(prev => ({ ...prev, [symptomId]: base64Image }));
      }
    } catch (err) {
      console.error("Erro ao gerar imagem do sintoma:", err);
    } finally {
      setLoadingSymptoms(prev => ({ ...prev, [symptomId]: false }));
    }
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => {
      const isSelected = prev.includes(id);
      if (!isSelected) {
        // Just added, trigger generation
        generateSymptomImageIfNeeded(id);
        return [...prev, id];
      } else {
        return prev.filter(item => item !== id);
      }
    });
  };

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

    // --- 1. Original Text (Only if exists) ---
    if (result) {
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("Prescrição Original:", margin, yPos);
      yPos += 5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const originalLines = doc.splitTextToSize(result.originalText, contentWidth);
      doc.text(originalLines, margin, yPos);
      yPos += (originalLines.length * 4) + 6;

      // --- 2. Gloss Box ---
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 80, 0); // Dark Green
      doc.text("Tradução em Libras (Glossa):", margin, yPos);
      yPos += 5;

      doc.setFontSize(11);
      doc.setFont("courier", "bold");
      const glossLines = doc.splitTextToSize(result.librasGloss, contentWidth - 6);
      const glossHeight = (glossLines.length * 5) + 6;

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

      // --- 4. Main Image ---
      if (result.imageUrl) {
        // Simple logic for main image space
        const spaceLeft = 60; // Reserve some space
        if (pageHeight - yPos > spaceLeft) {
           try {
             const imgSize = 50; 
             doc.addImage(result.imageUrl, 'PNG', margin, yPos, imgSize, imgSize);
             yPos += imgSize + 10;
           } catch (e) {}
        }
      }
    }

    // --- 5. Selected Symptoms ---
    if (selectedSymptoms.length > 0) {
      // Check for page break
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Sintomas e Solicitações:", margin, yPos);
      yPos += 10;

      const activeSymptoms = SYMPTOMS_DATA.filter(s => selectedSymptoms.includes(s.id));
      
      activeSymptoms.forEach((sym) => {
         const imgHeight = 35; // Size of symptom image
         const imgWidth = 35;
         
         // Calculate total height needed for this item (including potential warning)
         let itemTotalHeight = imgHeight + 8;
         
         // Check if we need a new page
         if (yPos + itemTotalHeight > pageHeight - 15) {
           doc.addPage();
           yPos = 15;
         }

         // Try to add image if available
         const symImage = symptomImages[sym.id];
         let hasImage = false;
         if (symImage) {
           try {
             doc.addImage(symImage, 'PNG', margin, yPos, imgWidth, imgHeight);
             hasImage = true;
           } catch (e) {
             console.error("Error adding symptom image to PDF", e);
           }
         } else {
             // Draw a placeholder box if image not loaded to keep layout structure
             doc.setDrawColor(200);
             doc.setFillColor(245);
             doc.rect(margin, yPos, imgWidth, imgHeight, 'FD');
             doc.setFontSize(8);
             doc.setTextColor(150);
             doc.text("Sem imagem", margin + 5, yPos + 20);
         }

         const textStartX = margin + imgWidth + 5;
         const textWidth = contentWidth - imgWidth - 5;

         doc.setFontSize(10);
         doc.setTextColor(0);
         doc.setFont("helvetica", "bold");
         doc.text(sym.label, textStartX, yPos + 5);
         
         doc.setFont("helvetica", "normal");
         doc.setFontSize(9);
         doc.setTextColor(50);
         const descLines = doc.splitTextToSize(sym.librasDescription, textWidth);
         doc.text(descLines, textStartX, yPos + 12);
         
         // Add Warning if exists
         if (sym.warning) {
             const warningY = yPos + 12 + (descLines.length * 4);
             doc.setFont("helvetica", "bold");
             doc.setTextColor(220, 38, 38); // Red
             doc.text(`OBS: ${sym.warning}`, textStartX, warningY);
         }
         
         yPos += imgHeight + 8; // Advance by image height + gap
      });
    }

    // --- Footer ---
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Este documento é um auxílio gerado por IA. Consulte sempre um profissional de saúde.",
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
          
          {/* LEFT COLUMN: Inputs */}
          <div className="space-y-6">
            
            {/* 1. Text Input Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Orientação Médica
              </h2>
              <textarea
                className="w-full h-32 p-4 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-base"
                placeholder="Digite a prescrição..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
              />
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleTranslate}
                  disabled={!inputText.trim() || isProcessing}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Traduzir
                </button>
              </div>
            </div>

            {/* 2. Symptoms Checklist Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <Activity className="w-5 h-5 text-emerald-600" />
                Identificação e Solicitações
              </h2>
              <p className="text-sm text-gray-500 mb-4">Selecione os sintomas, exames ou receitas para incluir no PDF.</p>
              
              <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {SYMPTOMS_DATA.map((symptom) => (
                  <label 
                    key={symptom.id} 
                    className={`
                      flex flex-col p-3 rounded-lg border cursor-pointer transition-all relative
                      ${selectedSymptoms.includes(symptom.id) 
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-slate-50 border-gray-200 hover:border-emerald-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex items-center mt-0.5">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                          checked={selectedSymptoms.includes(symptom.id)}
                          onChange={() => toggleSymptom(symptom.id)}
                        />
                      </div>
                      <span className={`text-sm font-medium ${selectedSymptoms.includes(symptom.id) ? 'text-emerald-900' : 'text-gray-700'}`}>
                        {symptom.label}
                      </span>
                    </div>
                    {symptom.warning && (
                      <span className="ml-7 mt-1 text-[10px] font-bold text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Requer Agendamento
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Status Messages */}
            {status === LoadingState.TRANSLATING_TEXT && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando tradução...
              </div>
            )}
            {status === LoadingState.GENERATING_IMAGE && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando ilustração...
              </div>
            )}
            {status === LoadingState.ERROR && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Outputs */}
          <div className="space-y-6">
            
            {/* Symptoms Output Cards */}
            {selectedSymptoms.length > 0 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">Sinais de Libras (Selecionados)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SYMPTOMS_DATA.filter(s => selectedSymptoms.includes(s.id)).map(symptom => {
                      const isLoading = loadingSymptoms[symptom.id];
                      const hasImage = !!symptomImages[symptom.id];
                      
                      return (
                        <div key={symptom.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                           <div className="aspect-video bg-gray-100 relative group">
                              {isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-emerald-600">
                                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                  <span className="text-xs font-medium">Gerando sinal...</span>
                                </div>
                              ) : (
                                <>
                                  <img 
                                    src={hasImage ? symptomImages[symptom.id] : symptom.placeholderUrl} 
                                    alt={`Sinal de ${symptom.label}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {!hasImage && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => generateSymptomImageIfNeeded(symptom.id)}
                                        className="bg-white text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-emerald-50"
                                      >
                                        <RefreshCw size={12} /> Tentar Gerar
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 flex justify-between items-center">
                                <span>{hasImage ? 'Imagem IA' : 'Ilustração'}</span>
                                {hasImage && <span className="text-emerald-300">✓ Pronto para PDF</span>}
                              </div>
                           </div>
                           <div className="p-4 flex flex-col flex-grow">
                              <h4 className="font-bold text-gray-900 mb-1">{symptom.label}</h4>
                              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded">
                                 {symptom.librasDescription}
                              </p>
                              {symptom.warning && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs font-bold flex items-start gap-1">
                                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                  {symptom.warning}
                                </div>
                              )}
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            )}

            {/* Translation Output Card (Main Feature) */}
            {result ? (
              <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-emerald-100">
                <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-900">Tradução da Prescrição</h3>
                  <span className="text-xs bg-white text-emerald-700 px-2 py-1 rounded border border-emerald-200">Gramática Libras</span>
                </div>
                <div className="p-6">
                  <p className="text-lg font-mono font-bold text-gray-800 leading-relaxed mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {result.librasGloss}
                  </p>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Explicação:</h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {result.explanation}
                  </p>
                  
                  {result.imageUrl && (
                      <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
                        <div className="flex justify-center p-4 bg-white">
                          <img 
                            src={result.imageUrl} 
                            alt="Ilustração médica" 
                            className="max-h-64 rounded-lg object-contain"
                          />
                        </div>
                      </div>
                  )}
                  
                  <div className="mt-6">
                    <button
                      onClick={handleDownloadPDF}
                      className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Baixar PDF Completo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Empty State (only shows if no translation AND no symptoms selected to avoid empty column look)
              selectedSymptoms.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                  <HeartHandshake className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm text-center opacity-70">
                    A tradução e os cards de sintomas aparecerão aqui.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
           <div className="mb-2 sm:mb-0">
             © {new Date().getFullYear()} LibrasMed AI.
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