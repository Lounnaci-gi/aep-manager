
import { GoogleGenAI } from "@google/genai";
import { Quote } from "../types";

// Lazy initialization to prevent crash on startup if API key is missing
let ai: GoogleGenAI | null = null;
const getAI = () => {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("GEMINI_API_KEY non défini dans l'environnement.");
        return null;
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const getAIRecommendation = async (quote: Partial<Quote>): Promise<string> => {
  try {
    const aiInstance = getAI();
    if (!aiInstance) return "Analyse technique indisponible (Clé API manquante).";
    
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse cette demande de travaux d'Alimentation en Eau Potable (AEP) en Algérie :
      Type de prestation : ${quote.serviceType}
      Client : ${quote.clientName}
      Description : ${quote.description}
      Montant estimé : ${quote.total} DA

      Génère une recommandation technique courte (max 3 phrases) en français pour le chef de chantier.
      Concentre-toi sur :
      - Les normes de pression (PN10/PN16).
      - La qualité des matériaux (PEHD, Fonte ductile).
      - Les points de vigilance spécifiques à la gestion de l'eau en Algérie (SEAAL, ADE, normes d'hygiène).`,
      config: {
        temperature: 0.7,
      }
    });

    // Directly access the .text property of GenerateContentResponse.
    return response.text || "Analyse technique indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de l'expertise IA.";
  }
};
