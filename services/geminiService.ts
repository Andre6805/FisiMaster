import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lernfeld, QuizQuestion, GeneratedContent } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize without erroring immediately to allow UI to show "Key Missing" state if needed
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = "gemini-3-flash-preview";

export const checkApiKey = (): boolean => {
  return !!apiKey;
};

export const generateStudyContent = async (lernfeld: Lernfeld): Promise<GeneratedContent> => {
  if (!ai) throw new Error("API Key missing");

  const prompt = `
    Du bist ein Experte für die Ausbildung zum Fachinformatiker Systemintegration (Deutschland).
    Erstelle detaillierte Lerninhalte für das Lernfeld ${lernfeld.id}: "${lernfeld.title}".
    
    Inhaltlicher Fokus: ${lernfeld.description}
    
    Bitte antworte im JSON-Format mit folgenden Feldern:
    - summary: Eine ausführliche, gut strukturierte Zusammenfassung der wichtigsten Themen (nutze Markdown für Formatierung, Fettgedrucktes, Listen).
    - keyConcepts: Ein Array von 5-7 Schlüsselbegriffen, die man kennen muss.
    - practiceTask: Eine konkrete, praxisnahe Übungsaufgabe, die ein Azubi durchdenken oder durchführen kann.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
      practiceTask: { type: Type.STRING }
    },
    required: ["summary", "keyConcepts", "practiceTask"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.error("Content generation error:", error);
    throw new Error("Fehler beim Generieren der Lerninhalte.");
  }
};

export const generateQuizQuestions = async (lernfeld: Lernfeld): Promise<QuizQuestion[]> => {
  if (!ai) throw new Error("API Key missing");

  const prompt = `
    Erstelle 5 Multiple-Choice-Fragen für Fachinformatiker Systemintegration zum Thema Lernfeld ${lernfeld.id}: "${lernfeld.title}".
    Niveau: Prüfungsrelevant (IHK).
    
    Format: JSON Array.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "4 Antwortmöglichkeiten"
        },
        correctIndex: { 
          type: Type.INTEGER,
          description: "Index der korrekten Antwort (0-3)" 
        },
        explanation: { type: Type.STRING, description: "Kurze Erklärung warum die Antwort richtig ist" }
      },
      required: ["question", "options", "correctIndex", "explanation"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as QuizQuestion[];
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw new Error("Fehler beim Erstellen des Quiz.");
  }
};

export const chatWithTutor = async (history: {role: 'user' | 'model', text: string}[], message: string, lernfeld: Lernfeld): Promise<string> => {
  if (!ai) throw new Error("API Key missing");

  const systemInstruction = `
    Du bist ein geduldiger und fachkundiger IT-Ausbilder für Fachinformatiker Systemintegration.
    Der Schüler lernt gerade Lernfeld ${lernfeld.id}: "${lernfeld.title}".
    Antworte präzise, technisch korrekt, aber verständlich. 
    Verwende Beispiele aus der IT-Praxis (Netzwerktechnik, Serveradministration, Coding).
    Halte dich kurz, es sei denn, der Nutzer bittet um Details.
  `;

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction,
        temperature: 0.7
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Ich konnte keine Antwort generieren.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Entschuldigung, ich habe gerade Verbindungsprobleme.";
  }
};

export const chatGeneral = async (history: {role: 'user' | 'model', text: string}[], message: string): Promise<string> => {
  if (!ai) throw new Error("API Key missing");

  const systemInstruction = `
    Du bist ein universeller KI-Assistent für Auszubildende zum Fachinformatiker Systemintegration.
    Du hilfst bei allgemeinen Fragen zur IT, Netzwerktechnik, Cloud, Sicherheit, Hardware und IHK-Prüfungsvorbereitung.
    Deine Antworten sind fundiert, professionell und motivierend.
    Nutze Markdown für Struktur.
  `;

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction,
        temperature: 0.8
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Ich konnte keine Antwort generieren.";
  } catch (error) {
    console.error("General Chat error:", error);
    return "Ein Fehler ist aufgetreten. Bitte versuche es gleich nochmal.";
  }
};