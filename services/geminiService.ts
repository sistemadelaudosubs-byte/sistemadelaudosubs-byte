import { GoogleGenAI, Type } from "@google/genai";

// We create the instance dynamically to ensure we catch the latest API Key if updated
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateToLibras = async (text: string): Promise<{ gloss: string; explanation: string }> => {
  try {
    const ai = getAIClient();
    
    const prompt = `
      Você é um intérprete especialista em Libras (Língua Brasileira de Sinais) focado na área médica.
      Sua tarefa é traduzir a seguinte orientação/prescrição médica para a GLOSSA (estrutura gramatical escrita) de Libras.
      
      Regras:
      1. A Glossa deve estar em Caixa Alta.
      2. Use estrutura Tópico-Comentário (Sujeito-Objeto-Verbo geralmente).
      3. Verbos no infinitivo.
      4. Remova artigos e preposições desnecessárias.
      5. Adicione expressões faciais ou modificadores entre parênteses se crítico para o contexto médico (ex: (expressão de dor), (negativo)).
      
      Texto Original: "${text}"

      Retorne APENAS um JSON com o seguinte formato:
      {
        "gloss": "A glossa traduzida",
        "explanation": "Uma breve explicação em português claro para o paciente sobre como realizar os sinais principais mencionados."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gloss: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["gloss", "explanation"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Falha ao gerar tradução.");
    
    return JSON.parse(jsonText);
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    throw new Error("Erro na tradução: " + (error.message || "Desconhecido"));
  }
};

export const generateIllustration = async (instruction: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            text: `Crie uma ilustração médica simples, estilo flat design e amigável, sobre fundo branco, que explique visualmente esta instrução para um paciente: "${instruction}". A imagem deve ser clara, educativa e fácil de entender.` 
          }
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e: any) {
    console.error("Failed to generate image:", e);
    if (e.message === "API_KEY_MISSING") throw e;
    return null;
  }
};

export const generateSymptomIllustration = async (symptomName: string, description: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            text: `Crie uma ilustração didática e clara de um sinal de LIBRAS (Língua Brasileira de Sinais) para o sintoma: "${symptomName}". O movimento é descrito como: "${description}". Use um estilo de desenho vetorial plano (flat vector), fundo branco, com setas indicando o movimento se necessário. Foco na clareza do gesto.` 
          }
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e: any) {
    console.error(`Failed to generate symptom image for ${symptomName}:`, e);
    if (e.message === "API_KEY_MISSING") throw e;
    return null;
  }
};