import React from 'react';
import { LAST_UPDATED, PRIVACY, TERMS } from '../data/legal';

const DOCS = { privacy: PRIVACY, terms: TERMS };
const LINKS = [
  { pattern: 'acuavibe@gmail.com', href: 'mailto:acuavibe@gmail.com' },
  { pattern: 'privacy.gov.ph', href: 'https://privacy.gov.ph', external: true },
];
const LINK_RE = new RegExp(`(${LINKS.map((l) => l.pattern.replace(/\./g, '\\.')).join('|')})`);

// Turns the email address and the NPC's website into real links; the rest
// of the legal text is plain.
function Linkified({ text }) {
  return text.split(LINK_RE).map((part, i) => {
    const link = LINKS.find((l) => l.pattern === part);
    if (!link) return <React.Fragment key={i}>{part}</React.Fragment>;
    return (
      <a
        key={i}
        href={link.href}
        {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        className="text-accent underline underline-offset-2 hover:text-terracota transition-colors"
      >
        {part}
      </a>
    );
  });
}

export default function LegalView({ doc, setCurrentView }) {
  const content = DOCS[doc];
  const other = doc === 'privacy' ? { id: 'terms', label: 'Terms of Service' } : { id: 'privacy', label: 'Privacy Policy' };

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <header className="mb-10 sm:mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-on-surface font-normal leading-[1.15]">
            {content.title}
          </h1>
          <p className="text-xs text-on-surface-variant mt-3">Last updated {LAST_UPDATED}</p>
          <p className="text-sm sm:text-base text-on-surface/80 leading-relaxed mt-5">{content.intro}</p>
        </header>

        <div className="space-y-9">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl sm:text-2xl text-on-surface mb-3">{section.heading}</h2>
              <div className="space-y-3 text-sm sm:text-[15px] text-on-surface/80 leading-relaxed">
                {section.body.map((block, i) =>
                  typeof block === 'string' ? (
                    <p key={i}>
                      <Linkified text={block} />
                    </p>
                  ) : (
                    <ul key={i} className="list-disc pl-5 space-y-2 marker:text-accent">
                      {block.list.map((item) => (
                        <li key={item}>
                          <Linkified text={item} />
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 pt-6 border-t border-outline-variant/30 text-sm text-on-surface-variant">
          See also our{' '}
          <button
            onClick={() => setCurrentView(other.id)}
            className="text-accent underline underline-offset-2 hover:text-terracota transition-colors bg-transparent border-none p-0 cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            {other.label}
          </button>
          .
        </p>
      </main>
    </div>
  );
}
