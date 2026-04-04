import { useState, useEffect, useRef } from "react";
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Video, 
  FileText, 
  Send, 
  Loader2, 
  Download, 
  RefreshCw, 
  AlertCircle,
  Play,
  CheckCircle2,
  Key,
  TrendingUp,
  Image as ImageIcon,
  Mic2,
  Volume2,
  Layers,
  Maximize2,
  ChevronRight,
  History,
  Cpu,
  Coins,
  FlaskConical,
  Sun,
  Moon,
  Monitor
} from "lucide-react";

// Extend Window interface for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface ScriptOutput {
  hook: string;
  mainScript: string;
  endingQuestion: string;
}

interface TrendingTopic {
  title: string;
  niche: string;
  description: string;
}

const NICHES = [
  { id: "tech", name: "Technology", icon: Cpu },
  { id: "history", name: "History", icon: History },
  { id: "finance", name: "Finance", icon: Coins },
  { id: "science", name: "Science", icon: FlaskConical },
];

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];
const VIDEO_ASPECT_RATIOS = ["9:16", "16:9", "1:1"];

const VOICES = [
  { id: "Zephyr", name: "Zephyr (Classic)", description: "Professional & Calm" },
  { id: "Zephyr-Documentary", name: "Zephyr (Documentary)", description: "Informative & Engaging" },
  { id: "Zephyr-Cinematic", name: "Zephyr (Cinematic)", description: "Dramatic & Epic" },
  { id: "Zephyr-Nature", name: "Zephyr (Nature Doc)", description: "Calm & Atmospheric" },
  { id: "Zephyr-Hindi", name: "Zephyr (Hindi)", description: "Professional Hindi Narration" },
  { id: "Charon", name: "Charon (Classic)", description: "Deep & Authoritative" },
  { id: "Charon-Thriller", name: "Charon (Thriller)", description: "Mysterious & Intense" },
  { id: "Charon-Corporate", name: "Charon (Corporate)", description: "Strong & Trustworthy" },
  { id: "Charon-TrueCrime", name: "Charon (True Crime)", description: "Intense & Gripping" },
  { id: "Charon-Hindi", name: "Charon (Hindi)", description: "Deep Hindi Voice" },
  { id: "Puck", name: "Puck (Classic)", description: "Energetic & Youthful" },
  { id: "Puck-Storyteller", name: "Puck (Storyteller)", description: "Warm & Expressive" },
  { id: "Puck-Documentary", name: "Puck (Modern Doc)", description: "Engaging & Modern" },
  { id: "Kore", name: "Kore (Classic)", description: "Clear & Friendly" },
  { id: "Kore-Educational", name: "Kore (Educational)", description: "Patient & Helpful" },
  { id: "Kore-Documentary", name: "Kore (Documentary)", description: "Clear & Informative (Female)" },
  { id: "Kore-Hindi", name: "Kore (Hindi)", description: "Clear Hindi Narration (Female)" },
  { id: "Fenrir", name: "Fenrir (Classic)", description: "Strong & Commanding" },
  { id: "Fenrir-Action", name: "Fenrir (Action)", description: "Bold & Powerful" },
  { id: "Fenrir-Historical", name: "Fenrir (Historical Doc)", description: "Deep & Historical" },
];

const VOICE_SPEEDS = [
  { id: "0.8", name: "Slow", description: "0.8x Speed" },
  { id: "1.0", name: "Normal", description: "1.0x Speed" },
  { id: "1.2", name: "Fast", description: "1.2x Speed" },
  { id: "1.5", name: "Very Fast", description: "1.5x Speed" },
];

const LANGUAGES = [
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "hi", name: "Hindi", flag: "🇮🇳" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "it", name: "Italian", flag: "🇮🇹" },
  { id: "pt", name: "Portuguese", flag: "🇵🇹" },
  { id: "ja", name: "Japanese", flag: "🇯🇵" },
  { id: "ko", name: "Korean", flag: "🇰🇷" },
  { id: "ru", name: "Russian", flag: "🇷🇺" },
  { id: "ar", name: "Arabic", flag: "🇸🇦" },
  { id: "zh", name: "Chinese", flag: "🇨🇳" },
];

const TONES = [
  "Documentary", 
  "Humorous", 
  "Serious", 
  "Inspirational", 
  "Dramatic", 
  "Educational", 
  "Mysterious",
  "Sarcastic",
  "High-Energy",
  "Relaxing"
];

const AUDIENCES = [
  "Global", 
  "Gen Z", 
  "Millennials", 
  "Professionals", 
  "Kids", 
  "Gamers", 
  "Foodies", 
  "Travelers", 
  "Fitness Enthusiasts",
  "Tech Enthusiasts",
  "History Buffs"
];

// Helper function to encode PCM to WAV
function encodeWAV(samples: Int16Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return buffer;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string; description?: string; flag?: string }[] | string[];
  label?: string;
  icon?: any;
  className?: string;
  theme: "dark" | "light";
}

const CustomSelect = ({ value, onChange, options, label, icon: Icon, className, theme }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = Array.isArray(options) && typeof options[0] === 'object'
    ? (options as any[]).find(o => o.id === value)
    : value;

  const displayValue = typeof selectedOption === 'object' ? selectedOption.name : selectedOption;
  const displayFlag = typeof selectedOption === 'object' ? selectedOption.flag : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className={`text-xs font-bold uppercase tracking-widest ml-1 mb-2 block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          theme === 'dark' 
            ? 'bg-black/40 border-white/10 text-white hover:bg-white/5' 
            : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          {displayFlag && <span>{displayFlag}</span>}
          <span className="truncate font-medium">{displayValue}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute z-50 w-full mt-2 border rounded-xl shadow-2xl overflow-x-hidden max-h-60 overflow-y-auto custom-scrollbar ${
              theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            {options.map((opt: any) => {
              const id = typeof opt === 'object' ? opt.id : opt;
              const name = typeof opt === 'object' ? opt.name : opt;
              const desc = typeof opt === 'object' ? opt.description : null;
              const flag = typeof opt === 'object' ? opt.flag : null;
              const isSelected = id === value;

              return (
                <button
                  key={id}
                  onClick={() => {
                    onChange(id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex flex-col gap-0.5 ${
                    isSelected 
                      ? "bg-blue-600 text-white" 
                      : theme === 'dark' ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {flag && <span>{flag}</span>}
                    <span className="font-medium">{name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </div>
                  {desc && <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-gray-500"}`}>{desc}</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FALLBACK_TRENDING_TOPICS: Record<string, any[]> = {
  tech: [
    { title: "AI in 2026", niche: "Technology", description: "The latest breakthroughs in artificial intelligence and how they impact daily life." },
    { title: "Top 5 Gadgets", niche: "Technology", description: "A quick review of the most anticipated tech gadgets releasing this month." },
    { title: "Coding for Beginners", niche: "Technology", description: "A 60-second guide to starting your programming journey." },
    { title: "The Future of AR", niche: "Technology", description: "How augmented reality is changing gaming and productivity." }
  ],
  history: [
    { title: "Lost Cities", niche: "History", description: "Fascinating facts about ancient cities that disappeared without a trace." },
    { title: "WW2 Secrets", niche: "History", description: "Lesser-known stories and covert operations from World War II." },
    { title: "Ancient Inventions", niche: "History", description: "Technologies from ancient times that were surprisingly advanced." },
    { title: "Famous Rulers", niche: "History", description: "Quick biographies of history's most influential leaders." }
  ],
  finance: [
    { title: "Crypto Updates", niche: "Finance", description: "The latest trends and news in the cryptocurrency market." },
    { title: "Budgeting 101", niche: "Finance", description: "Simple and effective tips for managing personal finances." },
    { title: "Stock Market Basics", niche: "Finance", description: "A beginner's guide to understanding how the stock market works." },
    { title: "Passive Income Ideas", niche: "Finance", description: "Realistic ways to generate income without active work." }
  ],
  science: [
    { title: "Space Exploration", niche: "Science", description: "Recent discoveries and upcoming missions in space." },
    { title: "Quantum Physics", niche: "Science", description: "Mind-bending concepts of quantum mechanics explained simply." },
    { title: "Human Body Facts", niche: "Science", description: "Surprising and weird facts about human biology." },
    { title: "Climate Change", niche: "Science", description: "The science behind global warming and potential solutions." }
  ]
};

export default function App() {
  const [topic, setTopic] = useState("");
  const [selectedTone, setSelectedTone] = useState("Documentary");
  const [selectedAudience, setSelectedAudience] = useState("Global");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [script, setScript] = useState<ScriptOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Trending Topics State
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isFetchingTrending, setIsFetchingTrending] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState(NICHES[0].id);

  // Image Generation State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("9:16");

  // TTS State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [selectedSpeed, setSelectedSpeed] = useState("1.0");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [scriptLanguage, setScriptLanguage] = useState("en");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    checkApiKey();
    fetchTrendingTopics();
  }, [selectedNiche]);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const translateScript = async () => {
    if (!script) return;
    setIsGeneratingScript(true);
    setError(null);
    const targetLang = LANGUAGES.find(l => l.id === selectedLanguage)?.name || "English";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following YouTube Shorts script into ${targetLang}. 
Keep the same format and tone. 
The output MUST be in ${targetLang}.

Script to translate:
Hook: ${script.hook}
Main Script: ${script.mainScript}
Ending Question: ${script.endingQuestion}

Format:
Hook: [Translated hook]
Main Script: [Translated main script]
Ending Question: [Translated ending question]`,
      });

      const text = response.text || "";
      const hookMatch = text.match(/Hook:\s*(.*)/i);
      const mainScriptMatch = text.match(/Main Script:\s*([\s\S]*?)(?=Ending Question:|$)/i);
      const endingQuestionMatch = text.match(/Ending Question:\s*(.*)/i);

      if (hookMatch && mainScriptMatch && endingQuestionMatch) {
        setScript({
          hook: hookMatch[1].trim(),
          mainScript: mainScriptMatch[1].trim(),
          endingQuestion: endingQuestionMatch[1].trim(),
        });
        setScriptLanguage(selectedLanguage);
      } else {
        throw new Error("Failed to parse translation. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to translate script.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const checkApiKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const fetchTrendingTopics = async () => {
    setIsFetchingTrending(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const nicheName = NICHES.find(n => n.id === selectedNiche)?.name;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 4 trending or popular YouTube Shorts topics for the ${nicheName} niche. 
        For each topic, provide a short 1-sentence description that gives context on why it's trending or what the video should cover.
        Return only a JSON array of objects with "title", "niche", and "description" properties.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                niche: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "niche", "description"]
            }
          }
        }
      });
      const data = JSON.parse(response.text || "[]");
      setTrendingTopics(data);
    } catch (err) {
      console.error("Failed to fetch trending topics", err);
      // Fallback to hardcoded topics if API rate limit is hit
      setTrendingTopics(FALLBACK_TRENDING_TOPICS[selectedNiche] || FALLBACK_TRENDING_TOPICS.tech);
    } finally {
      setIsFetchingTrending(false);
    }
  };

  const generateScript = async (customTopic?: string) => {
    const targetTopic = customTopic || topic;
    if (!targetTopic.trim()) return;
    
    setTopic(targetTopic);
    setIsGeneratingScript(true);
    setError(null);
    setScript(null);
    setImageUrl(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const languageName = LANGUAGES.find(l => l.id === selectedLanguage)?.name || "English";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Write a high-retention YouTube Shorts script for a ${selectedAudience} audience in a ${selectedTone} storytelling style.
The script MUST be written in ${selectedLanguage}.

Topic: ${targetTopic}

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
- Tone: ${selectedTone}
- Target Audience: ${selectedAudience}
- No hashtags, no emojis, no intros, no outro music cues.

Format:
Hook: [The hook in ${selectedLanguage}]
Main Script: [The main script in ${selectedLanguage}]
Ending Question: [The ending question in ${selectedLanguage}]`,
      });

      const text = response.text || "";
      const hookMatch = text.match(/Hook:\s*(.*)/i);
      const mainScriptMatch = text.match(/Main Script:\s*([\s\S]*?)(?=Ending Question:|$)/i);
      const endingQuestionMatch = text.match(/Ending Question:\s*(.*)/i);

      if (hookMatch && mainScriptMatch && endingQuestionMatch) {
        setScript({
          hook: hookMatch[1].trim(),
          mainScript: mainScriptMatch[1].trim(),
          endingQuestion: endingQuestionMatch[1].trim(),
        });
        setScriptLanguage(selectedLanguage);
      } else {
        throw new Error("Failed to parse script format. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to generate script", err);
      const errorMessage = err.message || "";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        // Provide a fallback script if rate limited
        setScript({
          hook: `The secret behind ${targetTopic} will shock you.`,
          mainScript: `Most people think they understand ${targetTopic}, but the reality is completely different. When you look closely at the details, you realize that everything you've been told is just scratching the surface. This changes everything we know about the subject.`,
          endingQuestion: `Has your perspective on ${targetTopic} changed?`,
        });
        setScriptLanguage(selectedLanguage);
        setError("API rate limit reached. Using a fallback script. Please try again later.");
      } else {
        setError(errorMessage || "Failed to generate script.");
      }
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateImage = async () => {
    if (!script) return;
    
    setIsGeneratingImage(true);
    setError(null);
    try {
      // Use the environment key for free models
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `A cinematic, high-quality documentary-style thumbnail image for a video about: ${topic}. 
Visual style: Professional photography, dramatic lighting, high detail. 
Context: ${script.hook}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateAudio = async () => {
    if (!script) return;
    setIsGeneratingAudio(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const fullText = `${script.hook}. ${script.mainScript}. ${script.endingQuestion}`;
      const languageName = LANGUAGES.find(l => l.id === selectedLanguage)?.name || "English";
      
      const [voiceName, voiceStyle] = selectedVoice.split('-');
      const speedLabel = VOICE_SPEEDS.find(s => s.id === selectedSpeed)?.name || "Normal";
      
      const prompt = `Read the following script fluently in ${languageName}. 
CRITICAL: You must use the correct native accent, pronunciation, and intonation for ${languageName}. If the language is Hindi, ensure proper Hindi diction and emotional delivery.
Voice Style: ${voiceStyle || "Professional Narrator"}
Pacing: ${speedLabel} (${selectedSpeed}x speed)
Tone: ${selectedTone}
Target Audience: ${selectedAudience}

Script:
${fullText}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        // Convert to Int16Array for WAV encoding
        const samples = new Int16Array(bytes.buffer);
        const wavBuffer = encodeWAV(samples, 24000);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play().catch(e => console.log("Auto-play blocked", e));
          }
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate audio.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const downloadScript = () => {
    if (!script) return;
    const content = `TOPIC: ${topic}\n\nHOOK:\n${script.hook}\n\nMAIN SCRIPT:\n${script.mainScript}\n\nENDING QUESTION:\n${script.endingQuestion}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans selection:bg-blue-500/30 ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full border transition-all shadow-lg ${
            theme === "dark" 
              ? "bg-[#141414] border-white/10 text-yellow-400 hover:bg-white/5" 
              : "bg-white border-gray-200 text-blue-600 hover:bg-gray-50"
          }`}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            theme === "dark" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600 border border-blue-100"
          }`}>
            <Sparkles className="w-4 h-4" />
            <span>AI Documentary Studio</span>
          </div>
          <h1 className={`text-5xl font-bold tracking-tight mb-4 ${
            theme === "dark" ? "bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent" : "text-gray-900"
          }`}>
            Shorts Script & Media Creator
          </h1>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-lg max-w-xl mx-auto`}>
            Generate viral scripts, cinematic thumbnails, and professional voiceovers in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Trending Topics */}
          <div className="lg:col-span-3 space-y-6">
            <div className={`${theme === "dark" ? "bg-[#141414] border-white/5" : "bg-white border-gray-200 shadow-sm"} border rounded-2xl p-6`}>
              <div className="flex items-center gap-2 mb-6 text-blue-400">
                <TrendingUp className="w-5 h-5" />
                <h2 className="font-bold text-lg">Trending Topics</h2>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {NICHES.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => setSelectedNiche(niche.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedNiche === niche.id 
                        ? "bg-blue-600 text-white" 
                        : theme === "dark" ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <niche.icon className="w-3 h-3" />
                    {niche.name}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {isFetchingTrending ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className={`h-12 rounded-xl animate-pulse ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`} />
                  ))
                ) : (
                  trendingTopics.map((topicItem, i) => (
                    <button
                      key={i}
                      onClick={() => generateScript(topicItem.title)}
                      className={`w-full text-left p-3 rounded-xl border transition-all group ${
                        theme === "dark" 
                          ? "bg-white/5 border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5" 
                          : "bg-gray-50 border-gray-100 hover:border-blue-500/50 hover:bg-blue-50"
                      }`}
                    >
                      <p className={`text-sm font-medium group-hover:text-blue-500 line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        {topicItem.title}
                      </p>
                      <p className={`text-[11px] mt-1 line-clamp-2 group-hover:text-gray-600 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                        {topicItem.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">{topicItem.niche}</span>
                        <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-blue-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-8">
            {/* Input Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${theme === "dark" ? "bg-[#141414] border-white/5" : "bg-white border-gray-200 shadow-xl"} border rounded-2xl p-8`}
            >
              <div className="flex flex-col gap-4">
                <label htmlFor="topic" className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  What's your topic?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <CustomSelect
                    label="Tone"
                    value={selectedTone}
                    onChange={setSelectedTone}
                    options={TONES}
                    theme={theme}
                  />
                  <CustomSelect
                    label="Target Audience"
                    value={selectedAudience}
                    onChange={setSelectedAudience}
                    options={AUDIENCES}
                    theme={theme}
                  />
                  <CustomSelect
                    label="Language"
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    options={LANGUAGES}
                    theme={theme}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      id="topic"
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Why Americans Are Leaving California"
                      className={`w-full border rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white placeholder:text-gray-600" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      }`}
                      onKeyDown={(e) => e.key === "Enter" && generateScript()}
                    />
                  </div>
                  <button
                    onClick={() => generateScript()}
                    disabled={isGeneratingScript || !topic.trim()}
                    className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 min-w-[160px]"
                  >
                    {isGeneratingScript ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Generate</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Something went wrong</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                    {error.includes("API Key") && (
                      <button 
                        onClick={handleOpenKeySelector}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        Select Key
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {script && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 xl:grid-cols-2 gap-8"
                >
                  {/* Script & Audio Card */}
                  <div className={`${theme === "dark" ? "bg-[#141414] border-white/5" : "bg-white border-gray-200 shadow-xl"} border rounded-2xl p-8 flex flex-col gap-6`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-blue-400">
                        <FileText className="w-5 h-5" />
                        <h2 className="font-bold text-xl">Generated Script</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {scriptLanguage !== selectedLanguage && (
                          <button
                            onClick={translateScript}
                            disabled={isGeneratingScript}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-[10px] font-bold transition-all border border-blue-500/20"
                          >
                            <RefreshCw className={`w-3 h-3 ${isGeneratingScript ? 'animate-spin' : ''}`} />
                            Translate
                          </button>
                        )}
                        <CustomSelect
                          value={selectedLanguage}
                          onChange={setSelectedLanguage}
                          options={LANGUAGES}
                          className="w-28"
                          theme={theme}
                        />
                        <CustomSelect
                          value={selectedVoice}
                          onChange={setSelectedVoice}
                          options={VOICES}
                          className="w-36"
                          theme={theme}
                        />
                        <CustomSelect
                          value={selectedSpeed}
                          onChange={setSelectedSpeed}
                          options={VOICE_SPEEDS}
                          className="w-24"
                          theme={theme}
                        />
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 border-t pt-4 ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                      <button 
                        onClick={generateAudio}
                        disabled={isGeneratingAudio}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all border border-emerald-500/20 disabled:opacity-50"
                      >
                        {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic2 className="w-4 h-4" />}
                        Voiceover
                      </button>
                      <button 
                        onClick={downloadScript}
                        className={`p-2.5 rounded-xl transition-colors border ${theme === 'dark' ? 'hover:bg-white/5 text-blue-400 border-white/5' : 'hover:bg-gray-100 text-blue-600 border-gray-200'}`}
                        title="Download Script"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => generateScript()}
                        className={`p-2.5 rounded-xl transition-colors border ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400 border-white/5' : 'hover:bg-gray-100 text-gray-600 border-gray-200'}`}
                        title="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    {audioUrl && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Voiceover Ready</span>
                          </div>
                          <a 
                            href={audioUrl} 
                            download={`${topic.replace(/\s+/g, '_')}_audio.wav`}
                            className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400"
                            title="Download Audio"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                        <audio ref={audioRef} src={audioUrl} controls className="h-10 w-full" />
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-bold text-blue-500/80 uppercase tracking-widest block mb-2">Hook</span>
                        <p className={`text-lg font-medium leading-relaxed italic ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>"{script.hook}"</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-bold text-purple-500/80 uppercase tracking-widest block mb-2">Main Content</span>
                        <div className={`space-y-3 leading-relaxed max-h-[200px] overflow-y-auto pr-2 custom-scrollbar ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {script.mainScript.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest block mb-2">Ending Question</span>
                        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>"{script.endingQuestion}"</p>
                      </div>
                    </div>
                  </div>

                  {/* Media Preview Card */}
                  <div className={`${theme === "dark" ? "bg-[#141414] border-white/5" : "bg-white border-gray-200 shadow-xl"} border rounded-2xl p-8 flex flex-col gap-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-400">
                        <ImageIcon className="w-5 h-5" />
                        <h2 className="font-bold text-xl">Media Assets</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <CustomSelect
                          value={aspectRatio}
                          onChange={setAspectRatio}
                          options={ASPECT_RATIOS}
                          className="w-24"
                          theme={theme}
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
                      <AnimatePresence mode="wait">
                        {imageUrl ? (
                          <motion.div 
                            key="image"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full flex flex-col"
                          >
                            <div className="relative w-full aspect-video max-h-[300px] rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
                              <img src={imageUrl} alt="Generated Thumbnail" className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-6 flex gap-3">
                              <a 
                                href={imageUrl} 
                                download="thumbnail.png"
                                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download Image
                              </a>
                              <button 
                                onClick={generateImage}
                                disabled={isGeneratingImage}
                                className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                title="Regenerate Image"
                              >
                                <RefreshCw className={`w-5 h-5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                          </motion.div>
                        ) : isGeneratingImage ? (
                          <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center space-y-6"
                          >
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mx-auto" />
                              <ImageIcon className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="space-y-2">
                              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Generating Image</h3>
                              <p className={`text-xs animate-pulse ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Crafting cinematic visuals...</p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center space-y-6"
                          >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                              <ImageIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="space-y-4">
                              <p className="text-gray-500 text-sm">No thumbnail generated yet.</p>
                              <button
                                onClick={generateImage}
                                className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 mx-auto"
                              >
                                <Sparkles className="w-4 h-4" />
                                Generate Thumbnail
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Features Footer */}
            {!script && !isGeneratingScript && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
              >
                {[
                  { icon: Sparkles, title: "High Retention", desc: "Optimized hooks and pacing for viral potential." },
                  { icon: ImageIcon, title: "Cinematic Visuals", desc: "AI-generated documentary style thumbnails." },
                  { icon: Mic2, title: "AI Voiceovers", desc: "Professional narration in multiple languages." }
                ].map((feature, i) => (
                  <div key={i} className={`p-6 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <feature.icon className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                    <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>{feature.desc}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
}
