import { Router } from 'express';
import { openai, OPENAI_TEXT_MODEL, OPENAI_IMAGE_MODEL } from '../openai.js';

const router = Router();

// Test status endpoint
router.get('/status', async (req, res) => {
  try {
    const isConfigured = Boolean(process.env.OPENAI_API_KEY);
    res.json({ configured: isConfigured });
  } catch (err) {
    res.status(500).json({ error: "Failed to check status" });
  }
});

// Generate Script
router.post('/generate-script', async (req, res) => {
  try {
    const { topic, tone, audience, language } = req.body;
    
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    const prompt = `Write a high-retention YouTube Shorts script for a ${audience || 'Global'} audience in a ${tone || 'Documentary'} storytelling style.
The script MUST be written in ${language || 'English'}.

Topic: ${topic}

CRITICAL RULES for a TOTALLY HUMAN-LIKE output:
- Write exactly as a passionate human storyteller speaking directly to a friend. It must NOT sound like an AI.
- ABSOLUTELY NO generic AI phrases like "Buckle up", "Did you know", "Imagine a world", "In this video", "Let's dive in", "Welcome back", or "The truth is".
- Start with a punchy, conversational hook. No formal or robotic introductions.
- Use highly varied sentence structures: mix short, punchy fragments with longer, flowing sentences to create a natural rhythm.
- Incorporate natural idioms, everyday conversational phrasing, and contractions (e.g., don't, can't, it's, wouldn't).
- Embed subtle emotional cues and resonance. Focus on the "why" and the "feeling" to genuinely connect with the viewer.
- Use natural pauses, rhetorical questions, and emotional beats.
- Keep the language accessible but the storytelling sophisticated and surprising.
- End with a question that actually sparks debate or genuine curiosity.
- Tone: ${tone || 'Documentary'}
- Target Audience: ${audience || 'Global'}
- No hashtags, no emojis, no intros, no outro music cues.

Provide the response in the following JSON structure exactly:
{
  "hook": "...",
  "mainScript": "...",
  "endingQuestion": "..."
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response content");
    
    const data = JSON.parse(content);
    res.json(data);
  } catch (err: any) {
    console.error("Generate script error:", err);
    res.status(500).json({ error: "Failed to generate script. Please check your configuration and try again." });
  }
});

// Generate Trending Topics
router.post('/generate-trending-topics', async (req, res) => {
  try {
    const { niche } = req.body;
    
    const prompt = `Suggest 4 trending or popular YouTube Shorts topics for the ${niche || 'Technology'} niche. 
For each topic, provide a short 1-sentence description that gives context on why it's trending or what the video should cover.
Return a JSON object containing a "topics" array. Each object in the array should have exactly these properties:
"title" (string)
"niche" (string)
"description" (string)

Format exactly like this:
{
  "topics": [
    { "title": "...", "niche": "...", "description": "..." }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response content");
    
    const data = JSON.parse(content);
    res.json(data.topics || []);
  } catch (err: any) {
    console.error("Trending topics error:", err);
    res.status(500).json({ error: "Failed to fetch trending topics." });
  }
});

// Translate Script
router.post('/translate-script', async (req, res) => {
  try {
    const { script, targetLanguage } = req.body;
    
    if (!script || !targetLanguage) {
      return res.status(400).json({ error: "Script and targetLanguage are required" });
    }

    const prompt = `Translate the following YouTube Shorts script into ${targetLanguage}. 
Keep the same format and tone. 
The output MUST be in ${targetLanguage}.

Script to translate:
Hook: ${script.hook}
Main Script: ${script.mainScript}
Ending Question: ${script.endingQuestion}

Return a JSON object with exactly these properties:
{
  "hook": "...",
  "mainScript": "...",
  "endingQuestion": "..."
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response content");
    
    const data = JSON.parse(content);
    res.json(data);
  } catch (err: any) {
    console.error("Translate script error:", err);
    res.status(500).json({ error: "Failed to translate script." });
  }
});

// Generate Image
router.post('/generate-image', async (req, res) => {
  try {
    const { topic, hook, aspectRatio } = req.body;
    
    if (!topic || !hook) {
      return res.status(400).json({ error: "Topic and hook are required" });
    }

    let size: "1024x1024" | "1024x1536" | "1536x1024" = "1024x1024";
    if (aspectRatio === "9:16" || aspectRatio === "3:4") {
      size = "1024x1536"; // Closest supported portrait format
    } else if (aspectRatio === "16:9" || aspectRatio === "4:3") {
      size = "1536x1024"; // Closest supported landscape format
    }

    const prompt = `A cinematic, high-quality documentary-style thumbnail image for a video about: ${topic}. 
Visual style: Professional photography, dramatic lighting, high detail. 
Context: ${hook}`;

    const response = await openai.images.generate({
      model: OPENAI_IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: size
    });

    console.log("Raw Image Response:", JSON.stringify(response, null, 2));

    let url = response.data?.[0]?.url || response.data?.[0]?.b64_json;
    if (!url) throw new Error("No image data returned in response: " + JSON.stringify(response));

    // Ensure raw base64 strings have the correct data URI scheme for the browser
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      url = `data:image/png;base64,${url}`;
    }

    res.json({ imageUrl: url });
  } catch (err: any) {
    console.error("Generate image error:", err);
    
    // Provide a safe error response without exposing internal stack traces or keys
    const details = err?.error?.message || err?.message || "Unknown error occurred";
    res.status(500).json({ 
      error: "Failed to generate image.",
      details: details 
    });
  }
});

const VOICE_MAP: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
  "Zephyr": "alloy",
  "Charon": "onyx",
  "Puck": "echo",
  "Kore": "nova",
  "Fenrir": "fable"
};

// Generate Audio / Voiceover
router.post('/generate-audio', async (req, res) => {
  try {
    const { text, voice, language, tone } = req.body;
    
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Map UI voice prefix to OpenAI voice
    const voicePrefix = voice ? voice.split('-')[0] : "Zephyr";
    const mappedVoice = VOICE_MAP[voicePrefix] || "alloy";

    let instructions = `Speak naturally in ${language || 'English'} with clear pronunciation and an engaging narration style.`;
    if (tone) {
      instructions += ` Tone: ${tone}.`;
    }

    // OpenAI TTS API currently accepts max 4096 characters per request
    // If the text is longer, we might need chunking. Assuming client or simple use case is within limit.
    const safeText = text.length > 4096 ? text.substring(0, 4096) : text;

    const response = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: mappedVoice,
      input: safeText,
      // instructions is not a standard param for `openai.audio.speech.create`, OpenAI TTS infers from input text.
      // We will prepend instructions/language context only if it's crucial, but actually OpenAI TTS model
      // just reads the input string natively. It doesn't take instructions.
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (err: any) {
    console.error("Generate audio error:", err);
    res.status(500).json({ error: "Failed to generate audio." });
  }
});

export default router;
