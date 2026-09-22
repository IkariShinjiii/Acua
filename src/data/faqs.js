// Every answer here has to be something ACUA can actually stand behind —
// same discipline as the Concierge system prompt (supabase/functions/
// concierge-chat/index.ts) and the footer: never invent shipping windows,
// return policy, or payment details that don't exist anywhere else on the
// site yet. Entries tagged NEEDS_REAL_ANSWER give an honest current answer
// (point to email) rather than a fabricated one — replace their `answer`
// with the real policy once the owner provides it, and drop the tag.
export const FAQ_CATEGORIES = [
  {
    category: 'Our Pieces',
    items: [
      {
        question: 'Is every piece really one-of-a-kind?',
        answer:
          "Every piece is handmade in small batches, and many are genuine 1-of-1 originals — once a piece marked 1-of-1 sells, it won't be restocked.",
      },
      {
        question: 'What materials do you use?',
        answer:
          'Non-tarnish finishes — warm gold-tone or cool silver-tone alloy — paired with natural stones, freshwater pearls, or salvaged sea glass. Nothing here fades, tarnishes, or needs special polishing.',
      },
      {
        question: 'Do you make rings or earrings?',
        answer:
          "Not currently — our focus is necklaces, chokers, statement cuffs, and ceremonial suites. If that changes, we'll announce it on Instagram and TikTok (@acua_ph) first.",
      },
      {
        question: 'How do I care for my piece?',
        answer:
          'Our non-tarnish finishes are designed to resist fading and discoloration with normal wear. For the longest-lasting shine, keep pieces dry, store them away from direct sunlight, and avoid contact with perfume or cleaning products.',
      },
    ],
  },
  {
    category: 'Custom Commissions',
    items: [
      {
        question: 'How does a custom commission work?',
        answer:
          "Submit a brief through our Custom Request page with your category, material, and budget. Our head artisan reviews it and sends back a complimentary concept sketch and a fixed quote within 48 hours — there's zero obligation to proceed.",
      },
      {
        question: 'What can I customize?',
        answer:
          'Category (Necklace/Choker, Statement Cuff, or Ceremonial/Suite), material (non-tarnish gold-tone, silver-tone, or a natural & synthetic mix), and your desired timeline. Commission budgets typically run from ₱22,000 up to ₱168,000+ depending on scope.',
      },
    ],
  },
  {
    category: 'Ordering & Payment',
    items: [
      {
        question: 'How do I place an order?',
        answer:
          "Add pieces to your cart and use Email to Order — this drafts an email with your selections so we can confirm payment and shipping directly. Online checkout isn't live yet, but every order is confirmed by a real person, not an automated system.",
      },
      {
        // NEEDS_REAL_ANSWER — replace once the owner confirms which payment
        // methods are actually accepted (bank transfer, GCash, COD, etc.).
        question: 'What payment methods do you accept?',
        answer:
          "This isn't published on the site yet — email us at acuavibe@gmail.com when you're ready to order and we'll walk you through it directly.",
      },
    ],
  },
  {
    category: 'Shipping & Returns',
    items: [
      {
        // Partly real (ships from Iloilo City) and partly NEEDS_REAL_ANSWER
        // (delivery timeline) — replace the second sentence once the owner
        // confirms actual delivery windows.
        question: 'Where do you ship from, and how long does delivery take?',
        answer:
          "We ship nationwide from Iloilo City, Philippines. Specific delivery timelines aren't published yet — email us at acuavibe@gmail.com after ordering and we'll confirm exactly when to expect your piece.",
      },
      {
        // NEEDS_REAL_ANSWER — replace once the owner confirms actual
        // shipping rates/policy (flat rate, free over a threshold, etc.).
        question: 'How much does shipping cost?',
        answer:
          "Shipping costs aren't published on the site yet — we'll confirm the exact cost with you directly once you place an order.",
      },
      {
        // NEEDS_REAL_ANSWER — replace once the owner confirms an actual
        // return/exchange policy.
        question: "What's your return or exchange policy?",
        answer:
          "We don't have a published return policy yet. If something isn't right with your order, email us at acuavibe@gmail.com and we'll work it out with you directly.",
      },
    ],
  },
];
