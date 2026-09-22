import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm the ACUA concierge — ask me about a piece, materials, or how custom commissions work.",
};

function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-chile-rojo text-white rounded-br-sm'
            : 'bg-surface-elevated text-on-surface shadow-cloud-sm rounded-bl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface-elevated shadow-cloud-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60 animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// A floating, non-modal chat widget — unlike CartDrawer/SearchOverlay this
// deliberately doesn't trap focus or block the rest of the page, matching
// how real storefront chat widgets (Intercom, Crisp, etc.) behave: you can
// keep browsing while it's open.
export default function ConciergeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => inputRef.current?.focus(), 200);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('concierge-chat', {
        body: { messages: nextMessages },
      });

      if (error || !data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              data?.error ||
              "Sorry, I'm having trouble responding right now — please try again in a moment.",
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong reaching the concierge. Please check your connection and try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="ACUA Concierge chat"
            className="fixed bottom-24 right-4 sm:right-6 z-[150] w-[calc(100%-2rem)] sm:w-96 h-[70vh] max-h-[560px] bg-sand rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-chile-rojo text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-serif text-lg leading-tight">ACUA Concierge</h2>
                <p className="text-[11px] text-white/80 uppercase tracking-wider">Usually replies in seconds</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close concierge chat"
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              role="log"
              aria-live="polite"
              aria-label="Conversation"
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {isSending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-outline-variant/30 p-3 flex items-center gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a piece, materials, commissions…"
                aria-label="Message the ACUA concierge"
                className="flex-1 bg-surface-container-low rounded-full px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-chile-rojo text-white border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={toggleButtonRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close concierge chat' : 'Chat with the ACUA concierge'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-4 sm:right-6 z-[150] w-14 h-14 rounded-full bg-chile-rojo text-white shadow-terracotta-glow flex items-center justify-center border-none cursor-pointer hover:brightness-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
