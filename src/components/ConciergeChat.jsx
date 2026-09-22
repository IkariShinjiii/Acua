import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logoMarkCream from '../assets/logo-mark-cream.png';
import logoMarkInk from '../assets/logo-mark-ink.png';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm the ACUA concierge — ask me about a piece, materials, or how custom commissions work.",
};

// Real, answerable starting points — one from each thing the concierge
// was actually built to help with (§39): the live catalog, materials,
// custom commissions, and the one shipping fact that's real (nationwide
// from Iloilo City), rather than generic chatbot filler.
const SUGGESTED_PROMPTS = [
  'What pieces do you have right now?',
  'What materials do you use?',
  'How do custom commissions work?',
  'Do you ship nationwide?',
];

function AssistantAvatar({ logoMark }) {
  return (
    <div className="w-7 h-7 rounded-full bg-surface-elevated shadow-cloud-sm flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
      <img src={logoMark} alt="" className="w-full h-full object-contain" />
    </div>
  );
}

function MessageBubble({ role, content, isError, logoMark }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <AssistantAvatar logoMark={logoMark} />}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-chile-rojo text-white rounded-br-sm'
            : isError
            ? 'bg-chile-rojo/10 text-on-surface shadow-cloud-sm rounded-bl-sm border border-accent/20'
            : 'bg-surface-elevated text-on-surface shadow-cloud-sm rounded-bl-sm'
        }`}
      >
        {isError && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent mb-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" /> Concierge unavailable
          </span>
        )}
        {content}
      </div>
    </div>
  );
}

function TypingIndicator({ logoMark }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <AssistantAvatar logoMark={logoMark} />
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
  const { theme } = useTheme();
  const avatarLogoMark = theme === 'dark' ? logoMarkCream : logoMarkInk;
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

// Only the real, appended conversation (role: user/assistant) gets sent
// back to the edge function as history — an isError bubble is a client-
// side detail Gemini never said and shouldn't see echoed back to it.
//
// A raw fetch rather than supabase.functions.invoke() — invoke() awaits
// the full response body before returning, which is exactly the "wait for
// the whole reply, then show it all at once" behavior the edge function's
// switch to streaming is meant to get away from. Reading the body directly
// as it arrives lets the reply grow into view as Gemini generates it,
// instead of a typing indicator sitting still for the whole generation.
  const sendToConcierge = async (conversationForApi) => {
    setIsSending(true);
    let streamedAnyText = false;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/concierge-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages: conversationForApi }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            isError: true,
            content:
              data?.error ||
              "Sorry, I'm having trouble responding right now — please try again in a moment.",
          },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        if (!streamedAnyText) {
          streamedAnyText = true;
          setMessages((prev) => [...prev, { role: 'assistant', content: chunk }]);
        } else {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        }
      }

      if (!streamedAnyText) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            isError: true,
            content: "Sorry, I couldn't come up with a reply just then — could you try asking again?",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isError: true,
          content: 'Something went wrong reaching the concierge. Please check your connection and try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const submitMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    sendToConcierge(nextMessages);
  };

  const handleSend = (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  // Only shown before the visitor has said anything themselves — once
  // they're mid-conversation, a row of starter prompts is just clutter.
  const showSuggestions = messages.length === 1 && !isSending;

  // Once the reply starts streaming in, the last message is already the
  // growing assistant bubble — the typing indicator would just sit
  // redundantly below text that's visibly arriving. Show it only for the
  // gap before the first token lands (last message is still the visitor's).
  const isAwaitingFirstToken = isSending && messages[messages.length - 1]?.role !== 'assistant';

  const handleRetry = () => {
    if (isSending) return;
    // Drop the trailing error bubble and re-send the same conversation
    // (still ending in the last real user message) rather than making
    // the visitor retype it.
    const withoutError = messages.filter((m) => !m.isError);
    setMessages(withoutError);
    sendToConcierge(withoutError);
  };

  const lastMessageFailed = messages.length > 0 && messages[messages.length - 1]?.isError;

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
            // calc(...+env(safe-area-inset-bottom)) rather than plain bottom-24:
            // the manifest sets display: standalone, so on a notched iPhone
            // added to the home screen there's no browser chrome left to keep
            // this clear of the home indicator gesture area the way a normal
            // Safari tab does.
            className="fixed bottom-[calc(6rem_+_env(safe-area-inset-bottom))] right-4 sm:right-6 z-[150] w-[calc(100%-2rem)] sm:w-96 h-[70vh] max-h-[560px] bg-sand rounded-3xl shadow-2xl ring-1 ring-black/5 flex flex-col overflow-hidden"
          >
            <div className="bg-chile-rojo text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <img src={logoMarkCream} alt="" className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-lg leading-tight">ACUA Concierge</h2>
                <p className="text-[11px] text-white/80 uppercase tracking-wider">Usually replies in seconds</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close concierge chat"
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer text-white flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo"
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
                <MessageBubble key={i} role={m.role} content={m.content} isError={m.isError} logoMark={avatarLogoMark} />
              ))}
              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pl-9">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => submitMessage(prompt)}
                      className="text-xs text-left px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-elevated shadow-input-inset text-on-surface border-none cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {isAwaitingFirstToken && <TypingIndicator logoMark={avatarLogoMark} />}
              {lastMessageFailed && !isSending && (
                <div className="flex justify-start pl-9">
                  <button
                    onClick={handleRetry}
                    className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                  >
                    Try Again
                  </button>
                </div>
              )}
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
        className="fixed bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] right-4 sm:right-6 z-[150] w-14 h-14 rounded-full bg-chile-rojo text-white shadow-terracotta-glow flex items-center justify-center border-none cursor-pointer hover:brightness-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
