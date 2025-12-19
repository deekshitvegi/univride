
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Safely retrieve API Key to prevent "process is not defined" crashes in Vite/Browser envs
const getApiKey = () => {
  try {
    // Check standard process.env (Create React App / Node)
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
    // Check Vite specific env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) {
        return (import.meta as any).env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore reference errors
  }
  return '';
};

// Lazy initialization to prevent app crash on load if key is invalid
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const key = getApiKey();
    // Allow empty key init, but methods will fail later or we handle them
    if (key) {
        aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
};

export const parseRideRequest = async (input: string) => {
  const ai = getAiClient();
  if (!ai) {
    console.warn("Gemini API Key missing. Returning mock parse.");
    // Mock fallback for demo purposes if no key
    return {
        type: input.toLowerCase().includes('offer') || input.toLowerCase().includes('driving') ? 'OFFER' : 'REQUEST',
        from: 'Unknown',
        to: 'Unknown',
        time: 'Now',
        estimatedPrice: 15,
        description: input
    };
  }
  
  try {
    const modelId = 'gemini-2.5-flash';
    
    const prompt = `Extract the ride details from this text: "${input}". 
    Infer if it is an OFFER (user has a car) or REQUEST (user needs a ride). 
    If price is mentioned, extract it, otherwise estimate a fair student price based on distance context (usually $5-$20).
    Locations should be simple city/campus names.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["OFFER", "REQUEST"] },
            from: { type: Type.STRING },
            to: { type: Type.STRING },
            time: { type: Type.STRING },
            estimatedPrice: { type: Type.NUMBER },
            description: { type: Type.STRING }
          },
          required: ["type", "from", "to", "time"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

export const getChatSuggestion = async (context: string, messageHistory: string[]) => {
  const ai = getAiClient();
  const fallback = ["Hi there!", "Is this ride still available?", "What is the pickup spot?"];
  
  if (!ai) return fallback;

  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
      Context: ${context}
      History: ${messageHistory.slice(-3).join('\n')}
      
      Suggest 3 short, friendly, and safe replies for the student user.
      Return as a JSON array of strings.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Chat Suggestion Error:", error);
    return fallback;
  }
};
