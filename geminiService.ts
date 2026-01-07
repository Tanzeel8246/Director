
import { GoogleGenAI, Type } from "@google/genai";
import { DynamicOption, CommercialClip } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are "CGI Director Pro." An advanced multimodal AI assistant for CGI directors.

# LANGUAGE PROTOCOL
1. DETECT UI LANGUAGE: If the user inputs Urdu (اردو), provide the 'label' and 'description' fields in Urdu. If English, use English.
2. TECHNICAL PROMPT (ALWAYS ENGLISH): The 'visualDescription' field MUST be in high-quality Technical English for CGI software (e.g., Unreal Engine, Octane).
3. ON-SCREEN TEXT (ALWAYS ENGLISH): The 'visualTextEnglish' field must be English Only.
4. VO SCRIPT: Use the language requested by the user in the 'selectedLanguage' parameter. If they select Roman Urdu, use Roman script. If Urdu, use Urdu script.

# PRODUCTION STANDARDS
- DURATION: Every clip MUST be between 8 to 10 seconds. Do not generate short 5-second clips.
- AI RECOMMENDATION: Mark exactly one option per step as 'isRecommended: true'.
- SHARIAH COMPLIANCE: No real female human figures; use mannequins (ڈمی) for female products.
- Deliver structured JSON blocks for high-speed production.`;

export const getDynamicOptions = async (
  product: string, 
  step: 'styles' | 'audience' | 'tone', 
  imageData?: string
): Promise<DynamicOption[]> => {
  const prompt = `User Input: "${product}". 
  Task: Generate 5 options for "${step}". 
  Language Rule: Respond in the SAME language as the input for 'label' and 'description'.
  Recommendation Rule: Mark the best one for this product as isRecommended: true.`;

  const parts: any[] = [{ text: prompt }];
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            label: { type: Type.STRING, description: "Option name in user's detected language" },
            description: { type: Type.STRING, description: "Brief detail in user's detected language" },
            isRecommended: { type: Type.BOOLEAN }
          },
          required: ["id", "label", "description", "isRecommended"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateDirectorScript = async (
  product: string, 
  style: string, 
  audience: string, 
  tone: string,
  language: string,
  imageData?: string
): Promise<CommercialClip[]> => {
  const prompt = `Product: ${product}. Style: ${style}, Audience: ${audience}, Tone: ${tone}. 
  Target VO Language: ${language}.
  Mandatory Rule: Ensure each clip duration is exactly between 8 and 10 seconds.
  Reminder: visualDescription is Technical English. voScriptUrdu is the script in the requested language. visualTextEnglish is English.`;

  const parts: any[] = [{ text: prompt }];
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clipNumber: { type: Type.INTEGER },
            globalSeed: { type: Type.STRING },
            visualDescription: { type: Type.STRING, description: "Technical English CGI Prompt" },
            visualTextEnglish: { type: Type.STRING, description: "On-screen English text graphics" },
            voScriptUrdu: { type: Type.STRING, description: "Spoken script in user's requested language" },
            durationSeconds: { type: Type.INTEGER, description: "Must be 8, 9, or 10" },
            transition: { type: Type.STRING }
          },
          required: ["clipNumber", "globalSeed", "visualDescription", "visualTextEnglish", "voScriptUrdu", "durationSeconds", "transition"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};
