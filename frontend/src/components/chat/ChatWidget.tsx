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
];

type View = "home" | "chat";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && view === "chat") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, view]);

  const buildHistory = () =>
    messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
    }));

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (view === "home") setView("chat");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await chatApi.send({ message: trimmed, history: buildHistory() });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: res.reply,
          action: res.action || undefined,
          actionParams: res.actionParams || undefined,
          requiresConfirmation: res.requiresConfirmation,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "bot", text: "Couldn't reach NeoBot. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (msg: Message) => {
    if (!msg.action || !msg.actionParams) return;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, confirmed: true } : m)));
    setIsLoading(true);
    try {
      const res = await chatApi.confirm({ action: msg.action, params: msg.actionParams });
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "bot", text: "Action failed. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (msg: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, confirmed: true } : m)));
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: "Cancelled." }]);
  };

  const handleBack = () => {
    setView("home");
    setMessages([]);
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-6 z-60 w-[370px] bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-sm:w-[calc(100vw-32px)] max-sm:right-4 max-sm:bottom-20 max-sm:h-[70vh]"
            style={{ height: 540 }}
          >
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 dark:from-[#0f0f1a] dark:to-[#1a1a2e] px-5 pt-4 pb-5 shrink-0">
              <div className="flex items-center justify-between mb-4">
                {view === "chat" ? (
                  <button
                    onClick={handleBack}
                    className="p-1 -ml-1 rounded-md hover:bg-white/10 transition-colors"
                    aria-label="Back"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5" />
                      <path d="M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">N</span>
                  </div>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {view === "home" ? (
                <div>
                  <h2 className="text-[22px] font-bold text-white leading-tight">Hi there 👋</h2>
                  <h2 className="text-[22px] font-bold text-white leading-tight">How can we help you?</h2>
                </div>
              ) : (
                <span className="text-white font-semibold text-base">NeoBot</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-transparent">
              <AnimatePresence mode="wait">
                {view === "home" ? (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="p-4"
                  >
                    <button
                      onClick={() => {
                        setView("chat");
                        setTimeout(() => inputRef.current?.focus(), 200);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/40 shadow-sm hover:shadow transition-all group mb-4"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Send us a message</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">We typically reply instantly</p>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>

                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Quick actions</p>
                    <div className="space-y-0.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => handleSend(s.label)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/40 text-left transition-colors group"
                        >
                          <span className="text-sm opacity-70">{s.icon}</span>
                          <span className="text-[13px] text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.15 }}
                    className="px-4 py-3 space-y-2.5"
                  >
                    {messages.length === 0 && (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
                        Ask me anything about your account
                      </p>
                    )}

                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                          {msg.role === "bot" && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] text-white font-bold">N</span>
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                              msg.role === "user"
                                ? "bg-slate-800 dark:bg-slate-700 text-white rounded-br-sm"
                                : "bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700/30"
                            )}
                          >
                            <span className="whitespace-pre-wrap">{msg.text}</span>
                          </div>
                        </div>

                        {msg.requiresConfirmation && !msg.confirmed && (
                          <div className="flex gap-2 mt-1.5 ml-8">
                            <button
                              onClick={() => handleConfirm(msg)}
                              disabled={isLoading}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleCancel(msg)}
                              disabled={isLoading}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-white font-bold">N</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5 border border-slate-100 dark:border-slate-700/30">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#1a1a2e]">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-1 border border-slate-200 dark:border-slate-700/50 focus-within:border-slate-300 dark:focus-within:border-slate-600 transition-colors">
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
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1 h-9 px-2.5 bg-transparent text-[13px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center mt-1.5">
                Powered by NeoBot AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-60 w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 shadow-lg shadow-slate-900/20 flex items-center justify-center transition-all"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.12 }}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="open"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
