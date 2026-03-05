"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { chatApi } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  action?: string;
  actionParams?: {
    receiverId?: number;
    amount?: string;
    bankAccountId?: number;
  };
  requiresConfirmation?: boolean;
  confirmed?: boolean;
}

const SUGGESTIONS = [
  { icon: "💰", label: "Check my wallet balance" },
  { icon: "📊", label: "Show recent transactions" },
  { icon: "💸", label: "Send money to someone" },
  { icon: "👤", label: "View my profile" },
  { icon: "🏦", label: "List my bank accounts" },
  { icon: "✏️", label: "Something else" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasConversation = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const buildHistory = () => {
    return messages
      .slice(-10)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text,
      }));
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await chatApi.send({
        message: trimmed,
        history: buildHistory(),
      });
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        text: res.reply,
        action: res.action || undefined,
        actionParams: res.actionParams || undefined,
        requiresConfirmation: res.requiresConfirmation,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (msg: Message) => {
    if (!msg.action || !msg.actionParams) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, confirmed: true } : m))
    );
    setIsLoading(true);

    try {
      const res = await chatApi.confirm({
        action: msg.action,
        params: msg.actionParams,
      });
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "bot", text: res.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "Failed to execute action. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (msg: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, confirmed: true } : m))
    );
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "bot", text: "Transfer cancelled." },
    ]);
  };

  const handleSuggestionClick = (label: string) => {
    if (label === "Something else") {
      inputRef.current?.focus();
      return;
    }
    handleSend(label);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-20 right-6 z-[60] w-[380px] h-[540px] bg-white dark:bg-[#0f1729] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-2xl shadow-black/12 dark:shadow-black/40 flex flex-col overflow-hidden max-sm:w-[calc(100vw-32px)] max-sm:right-4 max-sm:bottom-20 max-sm:h-[70vh]"
          >
            <div className="px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  NeoBot
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Minimize chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500 dark:text-slate-400">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {!hasConversation ? (
                <div className="px-5 py-5 flex flex-col h-full">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Looking for something? Let me help you!
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
                    Which of the following suits your requirement?
                  </p>

                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSuggestionClick(s.label)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all group"
                      >
                        <span className="text-lg shrink-0">{s.icon}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      <div
                        className={cn(
                          "flex items-end gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "bot" && (
                          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0 mb-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                          )}
                        >
                          <span className="whitespace-pre-wrap">{msg.text}</span>
                        </div>
                      </div>

                      {msg.requiresConfirmation && !msg.confirmed && (
                        <div className="flex gap-2 mt-2 ml-9">
                          <button
                            onClick={() => handleConfirm(msg)}
                            disabled={isLoading}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancel(msg)}
                            disabled={isLoading}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-end gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-1 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Type your question here..."
                  disabled={isLoading}
                  className="flex-1 h-10 px-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed shrink-0 mr-0.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 font-medium">
                All responses are generated by AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "fixed bottom-6 right-6 z-[60] h-11 shadow-lg flex items-center justify-center transition-all",
          open
            ? "w-11 rounded-full bg-slate-800 dark:bg-slate-700 shadow-slate-900/20"
            : "px-5 gap-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
        )}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="text-white text-sm font-semibold whitespace-nowrap">
                Ask NeoBot
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
