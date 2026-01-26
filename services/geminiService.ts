
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeIncidentUrgency(description: string, type: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this ${type} incident report from a forest in Bosnia: "${description}". Determine its urgency (low, medium, or high) based on potential spread and risk to life. Return ONLY a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: { type: Type.STRING, description: "low, medium, or high" },
            reason: { type: Type.STRING, description: "Short reason for classification" }
          },
          required: ["urgency", "reason"]
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis failed:", error);
    return { urgency: 'medium', reason: 'Automated fallback due to API error' };
  }
}

export async function getForestRiskAssessment(regionName: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a hypothetical current wildfire risk assessment for ${regionName} in Bosnia and Herzegovina. Mention factors like vegetation type and seasonality. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.NUMBER, description: "0 to 1 scale" },
            summary: { type: Type.STRING }
          },
          required: ["riskLevel", "summary"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { riskLevel: 0.5, summary: "Standard seasonal monitoring required." };
  }
}
