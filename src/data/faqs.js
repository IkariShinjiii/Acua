// Every answer here has to be something ACUA can actually stand behind —
// same discipline as the Concierge system prompt (supabase/functions/
// concierge-chat/index.ts) and the footer: never invent shipping windows,
// return policy, or payment details that don't exist anywhere else on the
// site yet.
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
        question: 'What payment methods do you accept?',
        answer:
          "GCash and bank transfer, both via QR code — once your order is confirmed, we'll send you a QR code to scan and pay directly.",
      },
    ],
  },
  {
    category: 'Shipping & Returns',
    items: [
      {
        question: 'Where do you ship from, and how long does delivery take?',
        answer:
          'We ship nationwide from Iloilo City, Philippines. Once your order ships, expect delivery within 2-3 days.',
      },
      {
        question: 'How much does shipping cost?',
        answer:
          "Shipping cost varies by your region and the weight of your order — we'll confirm the exact cost with you directly when you place your order.",
      },
      {
        question: "What's your return or exchange policy?",
        answer:
          "If something isn't right with your order, you can return it within 1 week of receiving it. Return shipping is covered by the customer. Email us at acuavibe@gmail.com to start a return.",
      },
    ],
  },
];
