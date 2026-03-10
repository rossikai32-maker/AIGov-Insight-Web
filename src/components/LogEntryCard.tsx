'use client';

import { motion } from 'framer-motion';
import { ParsedLogEntry } from '@/types/log';
import { getDataTypeColor, getDataTypeIcon, formatLatency, formatTokens, getRiskLevelColor, getRiskLevelBgClass } from '@/lib/logParser';
import { Activity, ChevronDown, ChevronUp, Clock, Trees, GitBranch, LineChart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// BASE64解码函数
const decodeBase64 = (str: string | undefined): string => {
  if (!str) return '';
  try {
    return atob(str);
  } catch (e) {
    console.error('Failed to decode base64:', e);
    return str;
  }
};

interface LogEntryCardProps {
  entry: ParsedLogEntry;
  index: number;
  onTimelineClick?: (logId: string) => void;
  onTreeClick?: (logId: string) => void;
  onSessionTimelineClick?: (logId: string) => void;
}

export function LogEntryCard({ entry, index, onTimelineClick, onTreeClick, onSessionTimelineClick }: LogEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 直接使用解析后的字符串，不尝试解析为JSON
  const parsedReqPayload = entry.parsedReqPayload || '';
  const parsedRspPayload = entry.parsedRspPayload || '';
  const parsedQuery = entry.parsedQuery || '';

  // 优化卡片标题显示，优先显示关键信息
  const displayTitle = (() => {
    // 根据类型显示不同的关键信息
    switch (entry.dataType) {
      case 'HTTP':
        // 从HTTP请求中提取路径信息
        if (parsedReqPayload) {
          const match = parsedReqPayload.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/i);
          if (match) {
            return `${match[1]} ${match[2]}`;
          }
        }
        break;
      case 'LLM':
      case 'AGENT':
        // 显示模型名称
        if (entry.ModelName) {
          return `${entry.ModelName} Request`;
        } else {
          if (parsedReqPayload) {
            const match = parsedReqPayload.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/i);
            if (match) {
              return `${match[1]} ${match[2]}`;
            }
          }
        }
        break;
      case 'AG-UI':
        // 提取HTTP方法
        let httpMethod = '';
        let httpURL = '';
        if (parsedReqPayload) {
          const methodMatch = parsedReqPayload.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/i);
          if (methodMatch) {
            httpMethod = methodMatch[1];
            httpURL = methodMatch[2];
          }
        }
        
        // 优先显示带有query的标题，结合HTTP方法
        if (parsedQuery) {
          const shortQuery = parsedQuery.length > 50 ? parsedQuery.substring(0, 50) + '...' : parsedQuery;
          if (httpMethod && entry.ModelName) {
            return `${httpMethod} ${httpURL} ${entry.ModelName} - ${shortQuery}`;
          } else if (httpMethod) {
            return `${httpMethod} ${httpURL} - ${shortQuery}`;
          } else if (entry.ModelName) {
            return `${entry.ModelName} - ${shortQuery}`;
          } else {
            return shortQuery;
          }
        } 
        // 显示模型名称和HTTP方法
        else if (entry.ModelName) {
          if (httpMethod) {
            return `${httpMethod} ${entry.ModelName}`;
          } else {
            return entry.ModelName;
          }
        } else {
          // 从请求负载中提取信息
          if (parsedReqPayload) {
            const match = parsedReqPayload.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/i);
            if (match) {
              return `${match[1]} ${match[2]}`;
            }
          }
        }
        break;
      case 'RAG':
        // 显示RAG相关信息
        if (entry.ragDocument) {
          return `RAG: ${entry.ragDocument}`;
        }
        break;
      case 'MCP':
        // 显示MCP方法名
        if (entry.mcpMethod) {
          return `MCP: ${entry.mcpMethod}`;
        }
        break;
      case 'FILE':
        // 显示文件路径（BASE64解码）
        if (entry.answer) {
          const decodedPath = decodeBase64(entry.answer);
          const path = decodedPath.length > 128 ? decodedPath.substring(0, 128) + '...' : decodedPath;
          return `${path}`;
        }
        // 显示文件操作，优先显示进程名（BASE64解码）
        if (entry.pName) {
          return `${entry.pName}`;
        }
        return 'File Operation';
      case 'EXEC':
        // 显示执行的命令
        if (parsedQuery) {
          return parsedQuery.length > 100 ? parsedQuery.substring(0, 100) + '...' : parsedQuery;
        }
        if (entry.pName) {
          return `${entry.pName}`;
        }
        return 'Command Execution';
      case 'OPENCLAW':
        // 显示OPENCLAW相关信息
        if (parsedQuery) {
          return parsedQuery.length > 100 ? parsedQuery.substring(0, 100) + '...' : parsedQuery;
        }
        if (entry.ModelName) {
          return `${entry.ModelName} Request`;
        }
        if (entry.llmProvider) {
          return `${entry.llmProvider} Provider`;
        }
        return 'OpenClaw Request';
    }

    // 其他类型优先显示用户查询
    if (parsedQuery) {
      return parsedQuery.length > 100 ? parsedQuery.substring(0, 100) + '...' : parsedQuery;
    }

    // 默认显示
    return `${entry.dataType} Request`;
  })();

  // 生成简短描述
  const displayDescription = (() => {
    if (parsedQuery && parsedQuery.length > 50) {
      return parsedQuery.substring(0, 50) + '...';
    }
    if (entry.dataType === 'EXEC') {
      const parts = [];
      
      if (entry.llmProvider) {
        parts.push(`风险: ${entry.llmProvider}`);
      }
      
      if (entry.answer) {
        const decodedPath = decodeBase64(entry.answer);
        const shortPath = decodedPath.length > 40 ? decodedPath.substring(0, 40) + '...' : decodedPath;
        parts.push(`路径: ${shortPath}`);
      }
      
      if (entry.tokenTotal) {
        parts.push(`参数: ${entry.tokenTotal}`);
      }
      
      return parts.join(' | ');
    }
    if (entry.dataType === 'FILE') {
      // FILE类型日志：显示敏感风险等级和进程信息
      return ``;
    }
    if (entry.dataType === 'LLM') {
      // LLM类型日志：显示摘要信息
      const parts = [];
      
      // 添加llmModel
      if (entry.llmModel) {
        parts.push(entry.llmModel);
      }
      
      // 添加Query摘要
      const query = entry.llmQuery || entry.parsedQuery;
      if (query) {
        const shortQuery = query.length > 30 ? query.substring(0, 30) + '...' : query;
        parts.push(`Q: ${shortQuery}`);
      }
      
      // 添加Answer摘要
      const answer = entry.llmAnswer || entry.parsedAnswer;
      if (answer) {
        const shortAnswer = answer.length > 30 ? answer.substring(0, 30) + '...' : answer;
        parts.push(`A: ${shortAnswer}`);
      }
      
      return parts.join(' | ');
    }
    if (entry.dataType === 'AG-UI') {
      // AG-UI类型日志：显示摘要信息
      const parts = [];
      
      // 添加workflow相关信息
      if (entry.workflowStatus) {
        parts.push(`Workflow: ${entry.workflowStatus}`);
      }
      
      // 添加step数量
      if (entry.workflowTotalSteps) {
        parts.push(`Steps: ${entry.workflowTotalSteps}`);
      }
      
      // 添加执行路径摘要
      if (entry.workflowNodes) {
        try {
          // 尝试解析workflowNodes为JSON
          const nodes = JSON.parse(entry.workflowNodes);
          if (Array.isArray(nodes)) {
            const nodeNames = nodes.map(node => typeof node === 'string' ? node : node.name || node.id || '').filter(Boolean);
            const shortPath = nodeNames.length > 3 ? nodeNames.slice(0, 3).join(' → ') + ' → ...' : nodeNames.join(' → ');
            parts.push(`Path: ${shortPath}`);
          } else if (typeof nodes === 'string') {
            // 如果是字符串，直接截取
            const shortPath = nodes.length > 50 ? nodes.substring(0, 50) + '...' : nodes;
            parts.push(`Path: ${shortPath}`);
          }
        } catch (e) {
          // 如果解析失败，直接截取字符串
          const shortPath = entry.workflowNodes.length > 50 ? entry.workflowNodes.substring(0, 50) + '...' : entry.workflowNodes;
          parts.push(`Path: ${shortPath}`);
        }
      }
      
      // 如果没有workflow信息，显示Query摘要
      if (parts.length === 0) {
        const query = entry.parsedQuery;
        if (query) {
          const shortQuery = query.length > 50 ? query.substring(0, 50) + '...' : query;
          parts.push(shortQuery);
        }
      }
      
      return parts.join(' | ');
    }
    if (entry.dataType === 'OPENCLAW') {
      const parts = [];
      
      if (entry.llmProvider) {
        parts.push(`大模型服务: ${entry.llmProvider}`);
      }
      
      if (entry.toolName) {
        let toolInfo = `调用工具: ${entry.toolName}`;
        if (entry.toolInput) {
          const shortInput = entry.toolInput.length > 50 ? entry.toolInput.substring(0, 50) + '...' : entry.toolInput;
          toolInfo += ` , 执行命令: ${shortInput}`;
        }
        parts.push(toolInfo);
      }
      
      return parts.join(' , ');
    }
    if (entry.toolName) {
      return `Tool: ${entry.toolName}`;
    }
    if (entry.workflowStatus) {
      return `Workflow: ${entry.workflowStatus}`;
    }
    if (entry.mcpMethod) {
      // 如果是 tools/call 类型，显示工具名称
      if (entry.mcpMethod === 'tools/call' && entry.mcpToolName) {
        return `Tool: ${entry.mcpToolName}`;
      }
      return ``;
    }
    return '';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.02,
        ease: "easeOut"
      }}
      className="rounded-2xl bg-[var(--card-background)]/50 backdrop-blur-xl border border-[var(--border-color)]/30 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className='w-10 h-10 rounded-xl flex items-center justify-center text-lg' style={{ backgroundColor: getDataTypeColor(entry.dataType) }}>
            {getDataTypeIcon(entry.dataType)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getDataTypeColor(entry.dataType)}/10`, color: getDataTypeColor(entry.dataType) }}>
                {entry.dataType}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {entry.sessionCreatedAt} {entry.sessionEndedAt ? `~ ${entry.sessionEndedAt}` : ''}
              </span>
              <span className="text-xs text-[var(--text-secondary)] ml-auto">
                {entry.logID || entry.id}
              </span>
            </div>

            <h4 className="text-sm font-medium text-[var(--foreground)] truncate mb-1">
              {displayTitle}
            </h4>

            {/* 显示简短描述 */}
            {displayDescription && (
              <p className="text-xs text-[var(--text-secondary)] truncate mb-2">
                {displayDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
              {/* FILE类型日志只显示相关信息 */}
            {entry.dataType === 'FILE' ? (
              <>
                {/* 进程ID */}
                {entry.pid && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">PID:</span>
                    <span>{entry.pid}</span>
                  </div>
                )}            

                {/* 访问文件的进程名 */}
                {entry.pName && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">进程:</span>
                    <span>{entry.pName}</span>
                  </div>
                )}

               {/* 文件敏感风险等级 */}
                {entry.llmProvider && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">风险等级:</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${entry.llmProvider === 'HIGH' ? 'bg-red-100 text-red-800' : entry.llmProvider === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {entry.llmProvider}
                    </span>
                  </div>
                )}

                {/* 访问的文件路径（BASE64解码） */}
                {entry.answer && (
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-medium">文件路径:</span>
                    <span className="truncate">{decodeBase64(entry.answer)}</span>
                  </div>
                )}
              </>
            ) : entry.dataType === 'EXEC' ? (
              <>
                {/* 进程ID */}
                {entry.pid && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">PID:</span>
                    <span>{entry.pid}</span>
                  </div>
                )}

                {/* 进程名 */}
                {entry.pName && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">进程:</span>
                    <span>{entry.pName}</span>
                  </div>
                )}

                {/* 风险等级 */}
                {entry.llmProvider && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">风险:</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${getRiskLevelBgClass(entry.llmProvider)}`}>
                      {entry.llmProvider}
                    </span>
                  </div>
                )}

                {/* 参数数量 */}
                {entry.tokenTotal && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">参数:</span>
                    <span>{entry.tokenTotal}</span>
                  </div>
                )}

                {/* 可执行文件路径 */}
                {entry.answer && (
                  <div className="flex items-center gap-1 truncate max-w-xs" title={decodeBase64(entry.answer)}>
                    <span className="font-medium">路径:</span>
                    <span className="truncate font-mono text-xs">{decodeBase64(entry.answer)}</span>
                  </div>
                )}
              </>
            ) : (
                <>
                  {/* 请求IP和端口 - 添加明确标识 */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium">请求:</span>
                    <span>{entry.reqIp}:{entry.reqPort}</span>
                  </div>

                  {/* 响应IP和端口 - 添加明确标识 */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium">响应:</span>
                    <span>{entry.respIp}:{entry.respPort}</span>
                  </div>

                  {/* 进程信息 */}
                  {entry.pid && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">PID:</span>
                      <span>{entry.pid}</span>
                    </div>
                  )}
                  {entry.pName && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">进程:</span>
                      <span>{entry.pName}</span>
                    </div>
                  )}

                  {/* Token信息 */}
                  {entry.tokenTotal && parseInt(entry.tokenTotal) > 0 && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{formatTokens(entry.tokenTotal)} tokens</span>
                    </div>
                  )}

                  {/* 模型名称 */}
                  {entry.ModelName && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                        {entry.ModelName}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 时间轴跳转按钮 - AG-UI和OPENCLAW类型显示 */}
            {(entry.dataType === 'AG-UI' || entry.dataType === 'OPENCLAW') && onTimelineClick && (
              <button 
                className="p-2 hover:bg-[var(--accent-blue)]/10 rounded-lg transition-colors text-[var(--accent-blue)]"
                onClick={() => onTimelineClick(entry.logID || entry.id)}
                title="跳转到会话级时间轴"
              >
                <Clock className="w-5 h-5" />
              </button>
            )}
            
            {/* 会话级时序图跳转按钮 - AG-UI和OPENCLAW类型显示 */}
            {(entry.dataType === 'AG-UI' || entry.dataType === 'OPENCLAW') && onSessionTimelineClick && (
              <button 
                className="p-2 hover:bg-[var(--accent-blue)]/10 rounded-lg transition-colors text-[var(--accent-blue)]"
                onClick={() => onSessionTimelineClick(entry.logID || entry.id)}
                title="跳转到会话级时序图"
              >
                <GitBranch className="w-5 h-5" />
              </button>
            )}

            {/* 树状视图跳转按钮 - AG-UI和OPENCLAW类型显示 */}
            {(entry.dataType === 'AG-UI' || entry.dataType === 'OPENCLAW') && onTreeClick && (
              <button 
                className="p-2 hover:bg-[var(--accent-blue)]/10 rounded-lg transition-colors text-[var(--accent-blue)]"
                onClick={() => onTreeClick(entry.logID || entry.id)}
                title="开始会话级分析"
              >
                <LineChart className="w-5 h-5" />
              </button>
            )}
            
            {/* 展开/收起按钮 */}
            <button className="p-2 hover:bg-[var(--border-color)]/20 rounded-lg transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-[var(--border-color)] p-5 bg-[var(--background)]/50"
        >
          {/* EXEC类型日志专用展示 */}
          {entry.dataType === 'EXEC' ? (
            <>
              {/* 基础信息 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">基础信息</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">日志ID</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.logID || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">数据类型</p>
                    <p className="text-[var(--foreground)]">{entry.dataType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话创建时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.sessionCreatedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">收集时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.collectTime}</p>
                  </div>
                </div>
              </div>

              {/* 命令执行详情 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">命令执行详情</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {/* 风险等级 */}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">风险等级</p>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRiskLevelBgClass(entry.llmProvider || '')}`}>
                      {entry.llmProvider || 'N/A'}
                    </span>
                  </div>
                  {/* 进程名 */}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程名</p>
                    <p className="text-[var(--foreground)] font-mono">{entry.pName || 'N/A'}</p>
                  </div>
                  {/* 进程ID */}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程ID</p>
                    <p className="text-[var(--foreground)]">{entry.pid || 'N/A'}</p>
                  </div>
                  {/* 参数数量 */}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">参数数量 (argc)</p>
                    <p className="text-[var(--foreground)]">{entry.tokenTotal || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 执行命令 */}
              {parsedQuery && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">执行命令</h5>
                  <div className="bg-[var(--card-background)] p-4 rounded-lg border border-[var(--border-color)]/30">
                    <pre className="text-[var(--foreground)] font-mono text-sm whitespace-pre-wrap break-all">{parsedQuery}</pre>
                  </div>
                </div>
              )}

              {/* 可执行文件路径 */}
              {entry.answer && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">可执行文件路径</h5>
                  <div className="flex items-center gap-2 bg-[var(--card-background)] p-4 rounded-lg border border-[var(--border-color)]/30">
                    <span className="text-lg">📁</span>
                    <p className="text-[var(--foreground)] font-mono text-sm break-all">{decodeBase64(entry.answer)}</p>
                  </div>
                </div>
              )}
            </>
          ) : entry.dataType === 'FILE' ? (
            <>
              {/* 基础信息 - 只显示必要字段 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">基础信息</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">日志ID</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.logID || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">数据类型</p>
                    <p className="text-[var(--foreground)]">{entry.dataType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话创建时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.sessionCreatedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">收集时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.collectTime}</p>
                  </div>
                </div>
              </div>

              {/* 文件操作详情 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">文件操作详情</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">文件敏感风险等级</p>
                    <span className={`px-2 py-1 rounded-full text-sm ${entry.llmProvider === 'HIGH' ? 'bg-red-100 text-red-800' : entry.llmProvider === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {entry.llmProvider || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">访问进程名</p>
                    <p className="text-[var(--foreground)] font-mono">{entry.pName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程ID</p>
                    <p className="text-[var(--foreground)]">{entry.pid || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">文件路径</p>
                    <p className="text-[var(--foreground)] font-mono break-all">{decodeBase64(entry.answer) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : entry.dataType === 'OPENCLAW' ? (
            <>
              {/* OPENCLAW类型专用展示 */}
              {/* 基础信息 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">基础信息</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">日志ID</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.logID || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">数据类型</p>
                    <p className="text-[var(--foreground)]">{entry.dataType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话创建时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.sessionCreatedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话结束时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.sessionEndedAt || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">收集时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.collectTime}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程ID</p>
                    <p className="text-[var(--foreground)]">{entry.pid || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程名</p>
                    <p className="text-[var(--foreground)]">{entry.pName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 网络信息 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">网络信息</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">请求IP:Port</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.reqIp}:{entry.reqPort}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">响应IP:Port</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.respIp}:{entry.respPort}</p>
                  </div>
                </div>
              </div>

              {/* 会话信息 */}
              {entry.session && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">会话信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.session || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">消息ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.messageID || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent信息 */}
              {entry.agentID && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">Agent信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Agent ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.agentID || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Agent名称</p>
                      <p className="text-[var(--foreground)]">{entry.agentName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LLM相关信息 */}
              {(entry.ModelName || entry.llmProvider || entry.llmVersion) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">LLM相关</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">模型名称</p>
                      <p className="text-[var(--foreground)]">{entry.ModelName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM提供商</p>
                      <p className="text-[var(--foreground)]">{entry.llmProvider || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">API版本</p>
                      <p className="text-[var(--foreground)]">{entry.llmVersion || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Token相关信息 */}
              {(entry.tokenTotal || entry.tokenPrompt || entry.tokenCompletion) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">Token信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">总Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.tokenTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">提示词Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.tokenPrompt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">生成Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.tokenCompletion)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 工具使用 */}
              {entry.toolName && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">工具使用</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工具名称</p>
                      <p className="text-[var(--foreground)]">{entry.toolName}</p>
                    </div>
                    {entry.toolInput && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工具输入</p>
                        <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto">
                          {entry.toolInput}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 对话内容 */}
              {(entry.parsedQuery || entry.parsedAnswer || entry.thought) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">对话内容</h5>
                  {entry.parsedQuery && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">用户提问</p>
                      <div className="text-[var(--foreground)] bg-[var(--card-background)] p-3 rounded-lg whitespace-pre-wrap">
                        {entry.parsedQuery}
                      </div>
                    </div>
                  )}
                  {entry.parsedAnswer && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">AI回答</p>
                      <div className="text-[var(--foreground)] bg-[var(--card-background)] p-3 rounded-lg whitespace-pre-wrap">
                        {entry.parsedAnswer}
                      </div>
                    </div>
                  )}
                  {entry.thought && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">思考过程</p>
                      <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-40">
                        {entry.thought}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Payload信息 */}
              <div>
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">Payload信息</h5>
                {parsedReqPayload && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Request Payload</p>
                    <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-70">
                      {parsedReqPayload}
                    </pre>
                  </div>
                )}
                {parsedRspPayload && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Response Payload</p>
                    <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-70">
                      {parsedRspPayload}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 基础信息 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">基础信息</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">日志ID</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.logID || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">数据类型</p>
                    <p className="text-[var(--foreground)]">{entry.dataType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话创建时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.sessionCreatedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话结束时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.sessionEndedAt || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">收集时间</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.collectTime}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程ID</p>
                    <p className="text-[var(--foreground)]">{entry.pid || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">进程名</p>
                    <p className="text-[var(--foreground)]">{entry.pName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Dify版本</p>
                    <p className="text-[var(--foreground)]">{entry.difyVersion || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 网络信息 */}
              <div className="mb-6">
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">网络信息</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">请求IP:Port</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.reqIp}:{entry.reqPort}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">响应IP:Port</p>
                    <p className="text-[var(--foreground)] font-mono text-xs">{entry.respIp}:{entry.respPort}</p>
                  </div>
                </div>
              </div>

              {/* 会话信息 */}
              {entry.session && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">会话信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">会话ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.session || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">消息ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.messageID || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent/工作流信息 */}
              {(entry.agentID || entry.agentName || entry.workflowStatus) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">Agent/工作流信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Agent ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.agentID || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Agent名称</p>
                      <p className="text-[var(--foreground)]">{entry.agentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工作流状态</p>
                      <p className="text-[var(--foreground)]">{entry.workflowStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工作流总步骤</p>
                      <p className="text-[var(--foreground)]">{entry.workflowTotalSteps || 'N/A'}</p>
                    </div>
                    {entry.workflowNodes && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工作流节点</p>
                        <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto">
                          {entry.workflowNodes}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LLM相关信息 */}
              {(entry.ModelName || entry.llmProvider || entry.llmID || entry.llmModel || entry.llmRound) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">LLM相关</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">模型名称</p>
                      <p className="text-[var(--foreground)]">{entry.ModelName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM提供商</p>
                      <p className="text-[var(--foreground)]">{entry.llmProvider || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM版本</p>
                      <p className="text-[var(--foreground)]">{entry.llmVersion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM ID</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.llmID || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM模型</p>
                      <p className="text-[var(--foreground)]">{entry.llmModel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">流式模式</p>
                      <p className="text-[var(--foreground)]">{entry.llmStream === '1' ? '是' : '否'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM轮数</p>
                      <p className="text-[var(--foreground)]">{entry.llmRound || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Token相关信息 */}
              {(entry.tokenTotal || entry.historyTokenTotal || entry.llmTokenTotal) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">Token信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">本轮总Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.tokenTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">本轮提示词Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.tokenPrompt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">本轮生成Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.tokenCompletion)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">历史总Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.historyTokenTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">历史提示词Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.historyTokenPrompt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">历史生成Token</p>
                      <p className="text-[var(--foreground)]">{formatTokens(entry.historyTokenCompletion)}</p>
                    </div>
                    {/* LLM特定Token信息 */}
                    {entry.llmTokenTotal && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM总Token</p>
                          <p className="text-[var(--foreground)]">{formatTokens(entry.llmTokenTotal)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM提示词Token</p>
                          <p className="text-[var(--foreground)]">{formatTokens(entry.llmTokenPrompt)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">LLM生成Token</p>
                          <p className="text-[var(--foreground)]">{formatTokens(entry.llmTokenCompletion)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 延迟相关信息 */}
              {(entry.latency || entry.historyLatency) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">延迟信息</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">本轮延迟</p>
                      <p className="text-[var(--foreground)]">{formatLatency(entry.latency)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">历史总延迟</p>
                      <p className="text-[var(--foreground)]">{formatLatency(entry.historyLatency)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">平均延迟</p>
                      <p className="text-[var(--foreground)]">{formatLatency(entry.historyAverageLatency)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">历史轮数</p>
                      <p className="text-[var(--foreground)]">{entry.historyRound || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* RAG相关信息 */}
              {(entry.ragHitCount || entry.ragScore || entry.ragDataset) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">RAG相关</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">命中次数</p>
                      <p className="text-[var(--foreground)]">{entry.ragHitCount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">相似度得分</p>
                      <p className="text-[var(--foreground)]">{entry.ragScore || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">词数</p>
                      <p className="text-[var(--foreground)]">{entry.ragWordCount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">片段位置</p>
                      <p className="text-[var(--foreground)]">{entry.ragSegPos || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">数据集</p>
                      <p className="text-[var(--foreground)] font-mono text-xs">{entry.ragDataset || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">文档类型</p>
                      <p className="text-[var(--foreground)]">{entry.ragDataType || 'N/A'}</p>
                    </div>
                    {entry.ragDocument && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">文档名称</p>
                        <p className="text-[var(--foreground)] font-mono text-xs">{entry.ragDocument}</p>
                      </div>
                    )}
                    {entry.ragContent && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">文档内容片段</p>
                        <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-40">
                          {entry.ragContent}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MCP相关信息 */}
              {(entry.mcpMethod || entry.mcpClientName || entry.mcpServerName) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">MCP相关</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">MCP方法</p>
                      <p className="text-[var(--foreground)]">{entry.mcpMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">客户端名称</p>
                      <p className="text-[var(--foreground)]">{entry.mcpClientName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">客户端版本</p>
                      <p className="text-[var(--foreground)]">{entry.mcpClientVersion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">服务器名称</p>
                      <p className="text-[var(--foreground)]">{entry.mcpServerName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">服务器版本</p>
                      <p className="text-[var(--foreground)]">{entry.mcpServerVersion || 'N/A'}</p>
                    </div>
                    {entry.mcpToolName && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工具名称</p>
                        <p className="text-[var(--foreground)]">{entry.mcpToolName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 查询和回答 */}
              {(entry.parsedQuery || entry.parsedAnswer || entry.llmQuery || entry.llmAnswer) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">对话内容</h5>
                  {(entry.parsedQuery || entry.llmQuery) && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">查询</p>
                      <div className="text-[var(--foreground)] bg-[var(--card-background)] p-3 rounded-lg">
                        {entry.llmQuery || entry.parsedQuery}
                      </div>
                    </div>
                  )}
                  {(entry.parsedAnswer || entry.llmAnswer) && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">回答</p>
                      <div className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg">
                        {entry.llmAnswer || entry.parsedAnswer}
                      </div>
                    </div>
                  )}
                  {entry.thought && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">思考过程</p>
                      <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-40">
                        {entry.thought}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* 工具使用 */}
              {(entry.toolName || entry.mcpToolName) && (
                <div className="mb-6">
                  <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">工具使用</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工具名称</p>
                      <p className="text-[var(--foreground)]">{entry.toolName || entry.mcpToolName}</p>
                    </div>
                    {entry.toolInput && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">工具输入</p>
                        <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto">
                          {entry.toolInput}
                        </pre>
                      </div>
                    )}
                    {entry.mcpToolInput && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">MCP工具输入</p>
                        <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto">
                          {entry.mcpToolInput}
                        </pre>
                      </div>
                    )}
                    {entry.mcpAnswer && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">MCP工具回答</p>
                        <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto">
                          {entry.mcpAnswer}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payload信息 */}
              <div>
                <h5 className="text-xs font-semibold text-[var(--accent-blue)] mb-3 uppercase tracking-wider">Payload信息</h5>
                {parsedReqPayload && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Request Payload</p>
                    <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-70">
                      {parsedReqPayload}
                    </pre>
                  </div>
                )}
                {parsedRspPayload && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Response Payload</p>
                    <pre className="text-[var(--foreground)] font-mono text-xs bg-[var(--card-background)] p-3 rounded-lg overflow-x-auto max-h-70">
                      {parsedRspPayload}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
