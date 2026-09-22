import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQ_CATEGORIES } from '../data/faqs';

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="bg-surface-elevated rounded-2xl shadow-cloud-sm overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-inset"
      >
        <span className="text-sm font-medium text-on-surface">{question}</span>
        <ChevronDown
          className={`w-4 h-4 stroke-[1.75] text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-on-surface/80 leading-relaxed px-5 pb-5">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQView() {
  // A flat Set of "categoryIndex-itemIndex" keys — several answers can be
  // open at once, matching how an FAQ is actually used (comparing two
  // related answers side by side rather than one at a time).
  const [openKeys, setOpenKeys] = useState(() => new Set());

  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <div className="text-center max-w-xl mx-auto space-y-2.5 mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-on-surface font-normal leading-[1.15]">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-sans">
            Answers about our pieces, custom commissions, and ordering. Can't find what you're
            looking for? Email us at{' '}
            <a href="mailto:acuavibe@gmail.com" className="text-accent hover:text-terracota transition-colors">
              acuavibe@gmail.com
            </a>
            .
          </p>
        </div>

        <div className="space-y-10">
          {FAQ_CATEGORIES.map((group, categoryIndex) => (
            <section key={group.category}>
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant mb-4">
                {group.category}
              </h2>
              <div className="space-y-3">
                {group.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  return (
                    <FAQItem
                      key={key}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openKeys.has(key)}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
