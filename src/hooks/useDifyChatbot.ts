import { useEffect, useState, useCallback } from 'react';

interface DifyChatbotOptions {
  baseUrl: string;
  token: string;
}

// 自定义钩子，用于处理与 Dify 聊天机器人的交互
export const useDifyChatbot = () => {
  const [isSelected, setIsSelected] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 初始化 Dify 聊天机器人配置 - 暂时屏蔽
  useEffect(() => {
    // 确保 Dify 聊天机器人配置已加载
    /* if (typeof window !== 'undefined' && !window.difyChatbotConfig) {
      window.difyChatbotConfig = {
        token: 'Gc9fr2SqqNUvKS0X',
        baseUrl: 'http://192.168.50.195',
        inputs: {},
        systemVariables: {},
        userVariables: {}
      };
    } */
  }, []);

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selected = selection.toString().trim();
      if (selected) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(selected);
        setIsSelected(true);
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      } else {
        setIsSelected(false);
        setSelectedText('');
      }
    }
  }, []);

  // 监听文本选择事件
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

  // 将选中的文本发送到 Dify 聊天机器人 - 暂时屏蔽
  const sendSelectedTextToChatbot = useCallback((query?: string) => {
    if (!selectedText) return;
    
    // 提示功能暂时禁用
    alert('AI 助手功能暂时禁用，该功能正在维护中。');
    
    // 重置选择状态
    setIsSelected(false);
    setSelectedText('');
  }, [selectedText]);

  // 发送包含当前页面上下文的消息
  const sendWithContext = useCallback((query: string, context?: any) => {
    let fullPrompt = query;
    
    // 添加上下文信息
    if (context) {
      fullPrompt += '\n\n上下文信息：';
      fullPrompt += JSON.stringify(context, null, 2);
    }
    
    // 打开聊天窗口并发送消息
    if (window.difyChatbot) {
      window.difyChatbot.open();
      
      if (typeof window.difyChatbot.send === 'function') {
        window.difyChatbot.send(fullPrompt);
      } else {
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('#dify-chatbot-bubble-window input[type="text"]');
          const sendBtn = document.querySelector<HTMLButtonElement>('#dify-chatbot-bubble-window button[type="submit"]');
          
          if (input && sendBtn) {
            input.value = fullPrompt;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            sendBtn.click();
          }
        }, 500);
      }
    }
  }, []);

  return {
    isSelected,
    selectedText,
    selectionPosition,
    sendSelectedTextToChatbot,
    sendWithContext
  };
};

// 全局类型声明
declare global {
  interface Window {
    difyChatbotConfig: {
      token: string;
      baseUrl: string;
      inputs: Record<string, any>;
      systemVariables: Record<string, any>;
      userVariables: Record<string, any>;
    };
    difyChatbot?: {
      open: () => void;
      close: () => void;
      send?: (message: string) => void;
    };
  }
}
