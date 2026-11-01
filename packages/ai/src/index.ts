export type { AiConfig } from "./config";

export { estimateTokens } from "./tokens";

export { createChatEngine } from "./chat/engine";

export type { ChatEngine } from "./chat/engine";

export { createClefDecisionModel } from "./chat/clef";

export { runChat } from "./chat/run";

export type { ChatRunOptions } from "./chat/run";

export { createTools } from "./chat/tools";

export type { AiToolContext } from "./chat/tools";

export { triageMessage } from "./chat/triage";

export type { TriageResult } from "./chat/triage";

export { compressLastMessage } from "./context/compress";

export {
  addHistory,
  loadHistory,
  MAX_HISTORY,
  pruneHistory,
  toModelMessages,
} from "./context/history";

export type { AiHistoryRow, HistoryMessage } from "./context/history";

export { forgetNote, readMemory, rememberNote } from "./context/memory";

export { buildDynamicContext, STATIC_SYSTEM_PROMPT } from "./context/prompt";

export type { DynamicContext } from "./context/prompt";

export {
  displayNameOf,
  formatLogTime,
  formatTime,
  isMessageWrapperStart,
  normalizeAssistantHistory,
  renderMessage,
  stripMessageWrapper,
  stripRecordHead,
} from "./context/chat-log";

export type { AiChatMessage, AiChatRole, AiChatType } from "./context/chat-log";

export { parseCapabilities } from "./media/capabilities";

export type { AiCapabilities } from "./media/capabilities";

export {
  extractUrls,
  fetchPageMarkdown,
  safeUrl,
  toMarkdown,
} from "./media/web";
