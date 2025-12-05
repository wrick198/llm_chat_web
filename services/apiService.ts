
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
        // Correctly sending the new payload structure: text, enable_semantic_thinking, enable_rag
        body: JSON.stringify(payload), 
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
    
    // Simulate the flags by modifying the system prompt for the demo
    let systemInstruction = "你是一个智能助手，负责解答用户的疑问。";
    
    if (payload.enable_semantic_thinking) {
        systemInstruction += " 请务必在回答中提供详细的深度语义分析、推导过程以及相关逻辑依据，展现你的思维链。";
    }
    
    if (payload.enable_rag) {
        systemInstruction += " 请假设你正在使用外部知识库进行检索（虽然在Demo模式下没有连接真实数据库），请在回答中模拟引用外部文档或数据的语气。";
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
