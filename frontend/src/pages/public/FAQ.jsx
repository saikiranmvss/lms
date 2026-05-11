import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const faqs = [
  { q: 'How do I get started?', a: 'Simply create a free account, browse our course catalog, and enroll in any course that interests you. You can start learning immediately after enrollment.' },
  { q: 'Are certificates recognized by employers?', a: 'LearnHub certificates are respected by many employers who value demonstrated skills. While recognition varies by industry, our certificates show commitment to professional development.' },
  { q: 'Can I access courses on mobile?', a: 'Yes! LearnHub is fully responsive and works great on all devices — desktop, tablet, and mobile. Your progress syncs across all devices automatically.' },
  { q: 'What is the refund policy?', a: 'We offer a 30-day money-back guarantee on all paid courses. If you\'re not satisfied, contact our support team for a full refund, no questions asked.' },
  { q: 'How do I become an instructor?', a: 'Register for an account and select "Instructor" as your role. You can start creating courses immediately. Our team reviews published courses before making them live.' },
  { q: 'Is there a free trial?', a: 'Many courses offer free preview lessons so you can try before you buy. We also have a selection of completely free courses in various categories.' },
  { q: 'How long do I have access to a course?', a: 'Once enrolled, you have lifetime access to the course content. Learn at your own pace — there\'s no expiration date.' },
  { q: 'Can I download videos for offline viewing?', a: 'Currently, courses can be accessed online through our platform. We\'re working on offline viewing features for future updates.' },
  { q: 'How do I contact support?', a: 'You can reach our support team through the Contact page, or email us directly at support@learnhub.com. We aim to respond within 24 hours.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and in some regions, local payment methods.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-slate-500">Everything you need to know about LearnHub.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className={clsx('card overflow-hidden transition-all duration-200', open === i && 'border-primary-200')}>
            <button onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors">
              <span className={clsx('font-semibold text-sm sm:text-base', open === i ? 'text-primary-700' : 'text-slate-900')}>{faq.q}</span>
              {open === i ? <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-14 card p-8 text-center bg-primary-50 border-primary-100">
        <h3 className="font-bold text-slate-900 text-xl mb-2">Still have questions?</h3>
        <p className="text-slate-600 mb-5">Can't find the answer you're looking for? Our friendly team is here to help.</p>
        <a href="/contact" className="btn-primary inline-block">Contact Support</a>
      </div>
    </div>
  );
}
