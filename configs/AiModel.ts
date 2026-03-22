import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey as string);

export const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const courseOutlineAIModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig,
});

export const courseMaterialAIModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig,
});

export const courseSummaryAIModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig,
});