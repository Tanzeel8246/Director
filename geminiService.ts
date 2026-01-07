
import { GoogleGenAI, Type } from "@google/genai";
import { DynamicOption, CommercialClip } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are "CGI Director Pro." A dynamic, context-aware automation wizard. 

# CRITICAL RULES (FROZEN)
1. ONE QUESTION ONLY: Ask exactly one question and STOP. Wait for input.
2. NUMBERING SYSTEM: Use numbers (1, 2, 3...) for all options instead of letters.
3. DYNAMIC OPTIONS: Based on the Product/Service in Step 1, intelligently generate 4-6 specific options for Style, Audience, and Tone.
4. SHARIAH COMPLIANCE: No real female human figures. Use Full-Body Mannequins (ڈمی) for female-oriented products.
5. CONSISTENCY: Use one Global_Seed and one consistent Male Voice ID for all clips.
6. LANGUAGE LOGIC: On-screen text: English Only. VO Script: Urdu Script (اردو رسم الخط).

# FINAL DELIVERABLE FORMAT
Deliver separate clip blocks. Each clip must include:
- Sequence
- Global_Seed (8-digit random)
- Technical_Prompt (English CGI instructions, Male only, Mannequins for female products)
- VO_Script_Segment (Urdu)
- Transition (Style name)`;

export const getDynamicOptions = async (
  product: string, 
  step: 'styles' | 'audience' | 'tone', 
  imageData?: string
): Promise<DynamicOption[]> => {
  const prompt = `Product/Service: "${product}" ${imageData ? '(Analyzing provided visual context image)' : ''}.
  Requirement: Generate 5 context-specific ${step} options based on this input. Use the NUMBERING SYSTEM (1, 2, 3...).`;

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
            label: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["id", "label", "description"]
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
  imageData?: string
): Promise<CommercialClip[]> => {
  const prompt = `Generate 3-6 CGI Director blocks for:
  Product: ${product}
  Selected Style: ${style}
  Target Audience: ${audience}
  Male VO Tone: ${tone}
  ${imageData ? 'Incorporate mood, lighting, and visual elements from the provided image reference into the Technical_Prompt.' : ''}

  Ensure Technical_Prompt is English, Optimized, Male-only (or Mannequins if female niche).
  Ensure VO_Script_Segment is Urdu Script.`;

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
    model: "gemini-3-pro-preview",
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
            visualDescription: { type: Type.STRING },
            visualTextEnglish: { type: Type.STRING },
            voScriptUrdu: { type: Type.STRING },
            durationSeconds: { type: Type.INTEGER },
            transition: { type: Type.STRING }
          },
          required: ["clipNumber", "globalSeed", "visualDescription", "visualTextEnglish", "voScriptUrdu", "durationSeconds", "transition"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};
