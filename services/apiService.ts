import { GoogleGenAI } from "@google/genai";
import { ApiRequestPayload, AppConfig, Role } from "../types";

/**
 * This service handles the communication.
 * It supports two modes:
 * 1. Gemini API (Direct usage for demonstration/fallback)
 * 2. Custom Backend (Implements the specific JSON format requested by the user)
 */

export const streamChatResponse = async (
  payload: ApiRequestPayload,
  config: AppConfig,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  
  // MODE 1: Custom Backend Implementation
  if (config.useCustomBackend) {
    try {
      const response = await fetch(config.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // { text: "...", enable_origin_explanation: true }
      });

      if (!response.ok) {
        // Try to read error text from backend if available
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`后端请求失败 (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error("后端返回内容为空");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          onChunk(chunk);
        }
      }
      onComplete();

    } catch (err) {
      console.error("Custom Backend Error:", err);
      onError(err instanceof Error ? err.message : "连接后端服务失败，请检查设置中的后端地址及服务状态。");
    }
    return;
  }

  // MODE 2: Gemini API (Demo Mode)
  try {
    // Check for API Key
    const apiKey = process.env.API_KEY || config.apiKey;
    if (!apiKey) {
        onError("缺少 API 密钥。请在设置中输入 Google Gemini API Key 或在 .env 文件中配置。");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // We simulate the "enable_origin_explanation" by modifying the system prompt
    let systemInstruction = "你是一个智能助手，负责解答用户的疑问。";
    if (payload.enable_origin_explanation) {
        systemInstruction += " 请务必在回答中提供详细的来源解释、推导过程以及相关依据。";
    }

    const streamResult = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: payload.text }] }],
      config: {
        systemInstruction: systemInstruction
      }
    });

    for await (const chunk of streamResult) {
        const chunkText = chunk.text;
        if (chunkText) {
            onChunk(chunkText);
        }
    }
    onComplete();

  } catch (err) {
    console.error("Gemini API Error:", err);
    onError(err instanceof Error ? err.message : "无法连接到 AI 服务，请检查网络或密钥。");
  }
};
