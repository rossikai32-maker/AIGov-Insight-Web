export interface LogEntry {
  dataType: string;
  session: string;
  messageID: string;
  sessionCreatedAt: string;
  sessionEndedAt: string;
  reqIp: string;
  reqPort: string;
  respIp: string;
  respPort: string;
  pid: string;
  agentID: string;
  agentName: string;
  ModelName: string;
  llmProvider: string;
  query: string;
  answer: string;
  thought: string;
  toolName: string;
  toolInput: string;
  tokenTotal: string;
  tokenPrompt: string;
  tokenCompletion: string;
  latency: string;
  historyRound: string;
  historyTokenTotal: string;
  historyTokenPrompt: string;
  historyTokenCompletion: string;
  historyLatency: string;
  historyAverageLatency: string;
  historyToolUse: string;
  workflowStatus: string;
  workflowTotalSteps: string;
  workflowNodes: string;
  ragHitCount: string;
  ragWordCount: string;
  ragSegPos: string;
  ragScore: string;
  ragDataset: string;
  ragDocument: string;
  ragDataType: string;
  ragContent: string;
  mcpMethod: string;
  mcpClientName: string;
  mcpClientVersion: string;
  mcpServerName: string;
  mcpServerVersion: string;
  mcpServerInst: string;
  mcpToolName: string;
  mcpToolInput: string;
  mcpAnswer: string;
  llmID: string;
  llmVersion: string;
  llmModel: string;
  llmStream: string;
  llmRound: string;
  llmTokenTotal: string;
  llmTokenPrompt: string;
  llmTokenCompletion: string;
  llmQuery: string;
  llmAnswer: string;
  difyVersion: string;
  reqPayload: string;
  rspPayload: string;
  logID: string;
  collectTime: string;
  pName: string;
}

export interface ParsedLogEntry extends LogEntry {
  id: string;
  timestamp: Date;
  parsedQuery?: string;
  parsedAnswer?: string;
  parsedReqPayload?: string;
  parsedRspPayload?: string;
  [key: string]: any;
}

export interface LogStats {
  totalRequests: number;
  totalTokens: number;
  averageLatency: number;
  activeSessions: number;
  requestsByType: Record<string, number>;
  requestsByHour: Array<{ hour: string; count: number }>;
}
