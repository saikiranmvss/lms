import { Link } from 'react-router-dom';
import { GraduationCap, Twitter, Linkedin, Github, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">LearnHub</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Learn without limits. Access world-class education from top instructors, anywhere, anytime.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: 'Platform', links: [['Courses', '/courses'], ['Pricing', '/pricing'], ['About', '/about'], ['Blog', '/blog'], ['FAQ', '/faq']] },
            { title: 'Teach', links: [['Become Instructor', '/register'], ['Instructor Dashboard', '/instructor/dashboard'], ['Create Course', '/instructor/courses/create']] },
            { title: 'Support', links: [['Help Center', '/faq'], ['Contact Us', '/contact'], ['Privacy Policy', '#'], ['Terms of Service', '#']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-slate-400 hover:text-white transition-colors duration-200">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} LearnHub. All rights reserved.</p>
          <p className="text-sm text-slate-500">Built for learners everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
