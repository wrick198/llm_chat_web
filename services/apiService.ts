
import { GoogleGenAI } from "@google/genai";
import { ApiRequestPayload, AppConfig } from "../types";

export const streamChatResponse = async (
  payload: ApiRequestPayload,
  config: AppConfig,
  customUrl: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  
  if (config.useCustomBackend) {
    try {
      const response = await fetch(customUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), 
      });

      if (!response.ok) {
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
      console.error("Backend Error:", err);
      onError(err instanceof Error ? err.message : "连接后端服务失败。");
    }
    return;
  }

  // Gemini Demo Fallback
  try {
    // Correct initialization using process.env.API_KEY exclusively as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for general text tasks
    const streamResult = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: payload.text,
      config: {
        systemInstruction: payload.enable_semantic_thinking ? "请作为语义规范专家回答。" : "你是一个助手。"
      }
    });

    for await (const chunk of streamResult) {
        // Access chunk.text property directly, do not call it as a method
        if (chunk.text) onChunk(chunk.text);
    }
    onComplete();
  } catch (err) {
    onError(err instanceof Error ? err.message : "AI 服务连接失败。");
  }
};
