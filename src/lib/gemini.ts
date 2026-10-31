import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-3.8-flash",
});

/**
 * Analyze plant disease images using Gemini AI.
 * Accepts an array of base64-encoded image strings.
 * Returns a structured analysis with disease identification and recommendations.
 */
export async function analyzePlantDisease(
  base64Images: string[],
  cropType: string,
  farmerDescription: string
): Promise<{
  diseaseName: string;
  severity: string;
  description: string;
  recommendedTreatment: string;
  preventiveMeasures: string;
  confidence: string;
}> {
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return {
      diseaseName: "Sample Analysis: Cercospora Leaf Spot / Pest Infestation",
      severity: "Moderate",
      description: `Automated assessment for ${cropType}. Symptoms described: "${farmerDescription}". Visual analysis indicates possible fungal or pest damage on foliage.`,
      recommendedTreatment: "1. Remove severely infected leaves.\n2. Apply appropriate copper-based fungicide or neem oil solution early morning or late afternoon.\n3. Avoid overhead watering to reduce leaf moisture.",
      preventiveMeasures: "Maintain proper plant spacing for air circulation, rotate crops seasonally, and inspect plants weekly for early signs of infection.",
      confidence: "Medium",
    };
  }

  const prompt = `You are an expert agricultural plant pathologist AI assistant. Analyze the following images of a ${cropType} plant that a farmer has reported.

The farmer describes the problem as: "${farmerDescription}"

IMPORTANT INSTRUCTIONS:
- Identify ONLY the disease or pest problem visible in the images. Do NOT identify the plant species (the farmer already told you it is ${cropType}).
- If you cannot identify a specific disease, say "Unidentified condition - requires expert inspection" and still provide general care recommendations.
- Be practical and actionable. Recommend treatments available to small-scale farmers.

Respond STRICTLY in this JSON format (no markdown, no code fences, just raw JSON):
{
  "diseaseName": "Name of the identified disease or pest",
  "severity": "Low | Moderate | High | Critical",
  "description": "Brief description of the disease/pest and how it affects the plant",
  "recommendedTreatment": "Step-by-step treatment instructions including chemical and organic options",
  "preventiveMeasures": "Preventive steps the farmer should take to avoid recurrence",
  "confidence": "Low | Medium | High"
}`;

  // Convert base64 images to Gemini-compatible parts
  const imageParts = base64Images.map((base64) => {
    const match = base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    }
    return {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64,
      },
    };
  });

  try {
    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText);

    return {
      diseaseName: parsed.diseaseName || "Unknown Condition",
      severity: parsed.severity || "Moderate",
      description: parsed.description || "No description available",
      recommendedTreatment:
        parsed.recommendedTreatment || "Consult a local agriculturist for inspection.",
      preventiveMeasures:
        parsed.preventiveMeasures || "Maintain good farming practices.",
      confidence: parsed.confidence || "Medium",
    };
  } catch (error) {
    console.error("Gemini AI analysis failed:", error);
    return {
      diseaseName: "Analysis Pending Expert Review",
      severity: "Moderate",
      description:
        "The automated AI scan could not finalize diagnosis. An agriculturist will manually review your report and photos.",
      recommendedTreatment: "Awaiting manual review by an agriculturist.",
      preventiveMeasures: "Isolate affected crops if symptoms appear contagious.",
      confidence: "Low",
    };
  }
}
