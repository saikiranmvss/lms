import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success('Message sent! We\'ll get back to you within 24 hours.'); setForm({ name: '', email: '', subject: '', message: '' }); }, 1200);
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@learnhub.com' },
    { icon: Phone, label: 'Phone', value: '+1 (800) LEARN-HUB' },
    { icon: MapPin, label: 'Address', value: '123 Learning Ave, San Francisco, CA 94105' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Get in Touch</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Have a question? We're here to help. Send us a message and we'll respond within 24 hours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact info */}
        <div className="space-y-6">
          {contactInfo.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 font-medium mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" required>
                <option value="">Select a topic</option>
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Billing & Payments</option>
                <option>Instructor Support</option>
                <option>Course Issues</option>
                <option>Partnership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="input resize-none" placeholder="How can we help you?" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
