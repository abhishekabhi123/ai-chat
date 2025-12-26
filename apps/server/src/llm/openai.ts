import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

export const llmClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
