import { Link } from 'react-router-dom';
import { CheckCircle, Zap, Crown, Building } from 'lucide-react';

const plans = [
  {
    name: 'Free', price: '$0', period: 'forever', icon: Zap, color: 'bg-slate-50 border-slate-200',
    features: ['Access to free courses', 'Basic progress tracking', 'Community forum access', 'Mobile access'],
    cta: 'Get Started Free', ctaLink: '/register', ctaStyle: 'btn-secondary',
  },
  {
    name: 'Pro', price: '$29', period: 'per month', icon: Crown, color: 'bg-primary-600 text-white border-primary-600', highlight: true,
    features: ['Access to all 8,500+ courses', 'Completion certificates', 'Offline downloading', 'Priority support', 'Advanced analytics', 'New courses monthly'],
    cta: 'Start Pro Trial', ctaLink: '/register', ctaStyle: 'bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-all',
  },
  {
    name: 'Teams', price: '$49', period: 'per user/month', icon: Building, color: 'bg-slate-50 border-slate-200',
    features: ['Everything in Pro', 'Team dashboard', 'Admin controls', 'Custom learning paths', 'Dedicated account manager', 'API access & SSO'],
    cta: 'Contact Sales', ctaLink: '/contact', ctaStyle: 'btn-primary',
  },
];

export default function Pricing() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Choose the plan that fits your learning goals. Start free, upgrade anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(({ name, price, period, icon: Icon, color, highlight, features, cta, ctaLink, ctaStyle }) => (
            <div key={name} className={`rounded-2xl border-2 p-8 ${color} ${highlight ? 'scale-105 shadow-2xl' : ''} transition-all`}>
              <div className={`w-12 h-12 rounded-xl ${highlight ? 'bg-white/20' : 'bg-primary-50'} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${highlight ? 'text-white' : 'text-primary-600'}`} />
              </div>
              <h2 className={`text-xl font-bold mb-1 ${highlight ? 'text-white' : 'text-slate-900'}`}>{name}</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-extrabold ${highlight ? 'text-white' : 'text-slate-900'}`}>{price}</span>
                <span className={`text-sm ${highlight ? 'text-primary-200' : 'text-slate-500'}`}>/{period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className={`flex items-center gap-3 text-sm ${highlight ? 'text-primary-100' : 'text-slate-600'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-white' : 'text-green-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={ctaLink} className={`${ctaStyle} w-full text-center block py-2.5`}>{cta}</Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">All plans include</h3>
          <p className="text-slate-500 mb-8">No matter which plan you choose, you always get:</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-slate-600">
            {['30-day money-back guarantee', 'Cancel anytime', '24/7 access to courses', 'Secure payments', 'Multi-device sync', 'Regular content updates'].map(item => (
              <span key={item} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
