import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSummary(content: string): Promise<string> {
  if (!content.trim()) return "No content to summarize.";

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a note summarization assistant. Summarize the following note content in 2-3 concise sentences. Focus on the key points and main ideas. Do not use markdown formatting in your response.

Note content:
${content}`,
  });

  return response.text?.trim() || "Unable to generate summary.";
}

export async function extractActionItems(content: string): Promise<string[]> {
  if (!content.trim()) return [];

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a task extraction assistant. Extract action items and tasks from the following note content. Return ONLY a JSON array of strings, with each string being one action item. If there are no action items, return an empty array []. Do not include any other text or formatting.

Note content:
${content}`,
  });

  try {
    const text = response.text?.trim() || "[]";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function suggestTitle(content: string): Promise<string> {
  if (!content.trim()) return "Untitled";

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a title suggestion assistant. Suggest a short, descriptive title (3-8 words) for the following note content. Return ONLY the title text, without quotes or any other formatting.

Note content:
${content}`,
  });

  return response.text?.trim() || "Untitled";
}
