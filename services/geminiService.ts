
import { GoogleGenAI } from "@google/genai";
import { Quote } from "../types";

// Always use a named parameter for apiKey and directly use process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendation = async (quote: Partial<Quote>): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
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
