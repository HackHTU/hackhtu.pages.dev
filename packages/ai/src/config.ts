/**
 * `@hackhtu/ai` 需要的配置。
 *
 * bot 的 `AiConfig` 继承它，这样 AI 基础设施不依赖 apps/bot。
 */
export interface AiConfig {
  aiModel: string;
  aiTriageModel: string;
  aiTriageThreshold: number;
  aiContextTokenLimit: number;
  aiMemoryLimit: number;
  aiReasoning: string;
  aiCapabilities: string[];
  stickerSet: string;
}
