import { Users, Award, Globe, BookOpen, Heart, Zap } from 'lucide-react';

export default function About() {
  const values = [
    { icon: Heart, title: 'Passion for Learning', desc: 'We believe education is a fundamental right and strive to make quality learning accessible to everyone.' },
    { icon: Zap, title: 'Excellence in Quality', desc: 'Every course goes through rigorous review to ensure world-class content and learning experiences.' },
    { icon: Globe, title: 'Global Community', desc: 'Connecting learners and educators from 150+ countries to foster a diverse learning environment.' },
    { icon: Users, title: 'Instructor Success', desc: 'We invest in our instructors because their success directly creates value for students worldwide.' },
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'CEO & Co-Founder', bio: 'Former educator with 15 years in EdTech innovation.' },
    { name: 'Michael Chen', role: 'CTO & Co-Founder', bio: 'Tech leader passionate about scalable learning platforms.' },
    { name: 'Emma Williams', role: 'Head of Content', bio: 'Curriculum designer ensuring every course meets the highest standards.' },
    { name: 'David Kim', role: 'Head of Instructor Success', bio: 'Helping instructors build thriving teaching careers.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-950 to-primary-800 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6">About LearnHub</h1>
          <p className="text-xl text-primary-200 leading-relaxed">
            We're on a mission to democratize education and empower people around the world to transform their lives through learning.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary-600 font-semibold text-sm mb-3">Our Mission</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Learning that transforms lives</h2>
              <p className="text-slate-600 leading-relaxed mb-5">
                LearnHub was founded with a simple belief: everyone deserves access to world-class education, regardless of geography, background, or circumstance. Since our founding, we've helped over 50,000 students discover new skills and advance their careers.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our platform connects passionate instructors with eager learners, creating a community where knowledge flows freely and opportunities are unlimited.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'Active Students', value: '50K+', icon: Users },
                { label: 'Expert Instructors', value: '1,200+', icon: Award },
                { label: 'Courses Available', value: '8,500+', icon: BookOpen },
                { label: 'Countries', value: '150+', icon: Globe },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="card p-5 text-center">
                  <Icon className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Values</h2>
            <p className="text-slate-500 max-w-xl mx-auto">The principles that guide everything we do at LearnHub.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 flex gap-5">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet Our Team</h2>
            <p className="text-slate-500">The people building the future of online learning.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(({ name, role, bio }) => (
              <div key={name} className="card p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {name[0]}
                </div>
                <h3 className="font-bold text-slate-900">{name}</h3>
                <p className="text-primary-600 text-sm font-medium mb-2">{role}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
