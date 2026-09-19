/**
 * LLM Client — single integration point for Google Gemini API.
 * All AI generation across the app routes through this module.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
let model;

function getModel() {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });
  }
  return model;
}

/**
 * Generate content from a prompt string.
 * Always returns parsed JSON, throws on failure.
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function generateJSON(prompt) {
  const m = getModel();
  const result = await m.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from the response if it has extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`LLM returned non-JSON response: ${text.substring(0, 200)}`);
  }
}

module.exports = { generateJSON };
