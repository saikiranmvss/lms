import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './index.js';

async function seed() {
  console.log('🌱 Seeding database...');
  try {
    // Users
    const adminHash = await bcrypt.hash('admin123', 12);
    const instructorHash = await bcrypt.hash('instructor123', 12);
    const studentHash = await bcrypt.hash('student123', 12);

    const adminResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified, is_instructor_approved, bio)
      VALUES ($1, $2, $3, $4, true, true, $5)
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
      RETURNING id
    `, ['Admin User', 'admin@learnhub.com', adminHash, 'admin', 'Platform administrator managing LearnHub.']);

    const instrResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified, is_instructor_approved, bio)
      VALUES ($1, $2, $3, $4, true, true, $5)
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
      RETURNING id
    `, ['John Instructor', 'instructor@learnhub.com', instructorHash, 'instructor', 'Full-stack developer with 10 years of experience teaching web development and programming.']);

    const studentResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified, bio)
      VALUES ($1, $2, $3, $4, true, $5)
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
      RETURNING id
    `, ['Jane Student', 'student@learnhub.com', studentHash, 'student', 'Passionate learner exploring new technologies.']);

    const adminId = adminResult.rows[0].id;
    const instructorId = instrResult.rows[0].id;
    const studentId = studentResult.rows[0].id;
    console.log('✅ Users created');

    // Categories
    const categories = [
      ['Web Development', 'web-development', 'Build modern websites and web apps', '💻'],
      ['Data Science', 'data-science', 'Learn data analysis and machine learning', '📊'],
      ['Mobile Development', 'mobile-development', 'Build iOS and Android apps', '📱'],
      ['Design', 'design', 'UI/UX and graphic design', '🎨'],
      ['Business', 'business', 'Business strategy and entrepreneurship', '💼'],
      ['Marketing', 'marketing', 'Digital marketing and growth', '📈'],
      ['Photography', 'photography', 'Photography and videography', '📷'],
      ['Music', 'music', 'Music production and theory', '🎵'],
      ['DevOps', 'devops', 'Cloud and infrastructure', '⚙️'],
      ['Cybersecurity', 'cybersecurity', 'Security and ethical hacking', '🔒'],
    ];

    const catIds = {};
    for (const [name, slug, desc, icon] of categories) {
      const r = await pool.query(
        'INSERT INTO categories (name, slug, description, icon) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO UPDATE SET name=$1 RETURNING id',
        [name, slug, desc, icon]
      );
      catIds[slug] = r.rows[0].id;
    }
    console.log('✅ Categories created');

    // Courses
    const courses = [
      {
        title: 'The Complete Web Development Bootcamp 2024',
        slug: 'complete-web-development-bootcamp-2024',
        description: 'Master HTML, CSS, JavaScript, React, Node.js, and more. This comprehensive bootcamp takes you from beginner to full-stack developer with hands-on projects and real-world examples.',
        short_description: 'Go from zero to full-stack developer with HTML, CSS, JS, React, Node.js and more.',
        category: 'web-development', level: 'beginner', price: 89.99, avg_rating: 4.8, total_reviews: 2847, total_enrollments: 15420,
        thumbnail: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
        what_you_learn: ['HTML5 and CSS3 from scratch', 'JavaScript ES6+ modern syntax', 'React.js with hooks', 'Node.js and Express.js', 'MongoDB and PostgreSQL', 'RESTful API design', 'Authentication with JWT', 'Deploy apps to cloud'],
        requirements: ['No programming experience needed', 'A computer with internet access', 'Eagerness to learn'],
        tags: ['html', 'css', 'javascript', 'react', 'nodejs'],
        status: 'published', is_featured: true
      },
      {
        title: 'Python for Data Science and Machine Learning',
        slug: 'python-data-science-machine-learning',
        description: 'Learn Python programming, data analysis with Pandas, visualization with Matplotlib, and machine learning with scikit-learn. Build real ML projects.',
        short_description: 'Master Python, Pandas, NumPy, scikit-learn and build real machine learning models.',
        category: 'data-science', level: 'intermediate', price: 79.99, avg_rating: 4.7, total_reviews: 1923, total_enrollments: 8930,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
        what_you_learn: ['Python fundamentals', 'Data manipulation with Pandas', 'Data visualization', 'Machine learning algorithms', 'Neural networks basics', 'Model deployment'],
        requirements: ['Basic math knowledge', 'No prior Python experience needed'],
        tags: ['python', 'data-science', 'machine-learning'],
        status: 'published', is_featured: true
      },
      {
        title: 'React Native: Build Mobile Apps for iOS & Android',
        slug: 'react-native-mobile-apps',
        description: 'Learn React Native to build cross-platform mobile apps. Create real apps, learn navigation, state management, and publish to app stores.',
        short_description: 'Build and publish iOS & Android apps using React Native — no native code needed.',
        category: 'mobile-development', level: 'intermediate', price: 69.99, avg_rating: 4.6, total_reviews: 987, total_enrollments: 4250,
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop',
        what_you_learn: ['React Native fundamentals', 'Navigation and routing', 'State management with Redux', 'Native device features', 'App Store publishing'],
        requirements: ['Basic JavaScript knowledge', 'React basics helpful but not required'],
        tags: ['react-native', 'mobile', 'ios', 'android'],
        status: 'published', is_featured: false
      },
      {
        title: 'UI/UX Design Masterclass with Figma',
        slug: 'ui-ux-design-masterclass-figma',
        description: 'Learn user interface and user experience design using Figma. Create beautiful, user-centered designs for web and mobile applications.',
        short_description: 'Learn UI/UX design principles and master Figma to create stunning interfaces.',
        category: 'design', level: 'beginner', price: 59.99, avg_rating: 4.9, total_reviews: 1456, total_enrollments: 6700,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop',
        what_you_learn: ['Design principles and theory', 'Figma from beginner to advanced', 'User research methods', 'Wireframing and prototyping', 'Design systems'],
        requirements: ['No design experience required', 'A free Figma account'],
        tags: ['ui', 'ux', 'figma', 'design'],
        status: 'published', is_featured: true
      },
      {
        title: 'DevOps & Docker: Container Mastery',
        slug: 'devops-docker-container-mastery',
        description: 'Master Docker, Kubernetes, CI/CD pipelines, and cloud deployment. Learn the complete DevOps lifecycle used by top tech companies.',
        short_description: 'Master Docker, Kubernetes, CI/CD and cloud deployment for modern DevOps.',
        category: 'devops', level: 'intermediate', price: 74.99, avg_rating: 4.7, total_reviews: 743, total_enrollments: 3120,
        thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=225&fit=crop',
        what_you_learn: ['Docker fundamentals', 'Docker Compose', 'Kubernetes orchestration', 'CI/CD with GitHub Actions', 'AWS and cloud deployment'],
        requirements: ['Basic Linux command line', 'Programming experience helpful'],
        tags: ['docker', 'kubernetes', 'devops', 'aws'],
        status: 'published', is_featured: false
      },
      {
        title: 'Digital Marketing Complete Guide 2024',
        slug: 'digital-marketing-complete-guide-2024',
        description: 'Master SEO, social media marketing, email marketing, Google Ads, Facebook Ads, and content marketing. Build a complete digital marketing skillset.',
        short_description: 'Learn SEO, social media, email marketing, Google Ads and grow any business online.',
        category: 'marketing', level: 'beginner', price: 0, avg_rating: 4.5, total_reviews: 892, total_enrollments: 12400,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
        what_you_learn: ['SEO fundamentals', 'Social media strategy', 'Email marketing', 'Paid advertising', 'Analytics and reporting'],
        requirements: ['No marketing experience needed', 'Basic computer skills'],
        tags: ['marketing', 'seo', 'social-media'],
        status: 'published', is_featured: false
      },
    ];

    const courseIds = [];
    for (const c of courses) {
      const r = await pool.query(`
        INSERT INTO courses (title, slug, description, short_description, category_id, level, price,
          avg_rating, total_reviews, total_enrollments, thumbnail, what_you_learn, requirements,
          tags, status, is_featured, instructor_id, total_lessons, duration_seconds)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        ON CONFLICT (slug) DO UPDATE SET title=$1
        RETURNING id
      `, [c.title, c.slug, c.description, c.short_description, catIds[c.category],
          c.level, c.price, c.avg_rating, c.total_reviews, c.total_enrollments,
          c.thumbnail, c.what_you_learn, c.requirements, c.tags, c.status, c.is_featured,
          instructorId, 24, 86400]);
      courseIds.push(r.rows[0].id);
    }
    console.log('✅ Courses created');

    // Sections and Lessons for first course
    const sectionTitles = [
      ['Getting Started', ['Introduction to the Course', 'Setting Up Your Environment', 'How to Get the Most Out of This Course']],
      ['HTML Fundamentals', ['What is HTML?', 'HTML Document Structure', 'Text Elements', 'Links and Images', 'HTML Forms']],
      ['CSS Styling', ['Introduction to CSS', 'Selectors and Properties', 'Box Model', 'Flexbox Layout', 'CSS Grid', 'Responsive Design']],
      ['JavaScript Basics', ['Variables and Data Types', 'Functions', 'Arrays and Objects', 'DOM Manipulation', 'Events']],
    ];

    for (const [si, [sTitle, lessons]] of sectionTitles.entries()) {
      const sRes = await pool.query(
        'INSERT INTO sections (course_id, title, position) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id',
        [courseIds[0], sTitle, si]
      );
      if (sRes.rows[0]) {
        const sId = sRes.rows[0].id;
        for (const [li, lTitle] of lessons.entries()) {
          await pool.query(
            `INSERT INTO lessons (section_id, course_id, title, type, video_url, duration_seconds, is_preview, is_published, position)
             VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8) ON CONFLICT DO NOTHING`,
            [sId, courseIds[0], lTitle, 'video',
             li === 0 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
             Math.floor(Math.random() * 900) + 300, si === 0 && li === 0, li]
          );
        }
      }
    }

    // Update course lesson count
    await pool.query(`
      UPDATE courses SET total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id), duration_seconds = total_lessons * 600 WHERE id = $1
    `, [courseIds[0]]);
    console.log('✅ Sections and lessons created');

    // Enroll student in first course
    await pool.query(
      'INSERT INTO enrollments (student_id, course_id, completion_percentage) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [studentId, courseIds[0], 25]
    );
    await pool.query(
      'INSERT INTO enrollments (student_id, course_id, completion_percentage) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [studentId, courseIds[1], 0]
    );

    // Wishlist
    await pool.query(
      'INSERT INTO wishlists (student_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [studentId, courseIds[2]]
    );

    // Reviews
    const reviewData = [
      [studentId, courseIds[0], 5, 'Absolutely amazing course! I went from zero to building full-stack apps. The instructor explains everything clearly.'],
    ];
    for (const [sid, cid, rating, comment] of reviewData) {
      await pool.query(
        'INSERT INTO reviews (course_id, student_id, rating, comment, is_approved) VALUES ($1,$2,$3,$4,true) ON CONFLICT DO NOTHING',
        [cid, sid, rating, comment]
      );
    }

    // Notifications
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)',
      [studentId, 'Welcome to LearnHub!', 'Start exploring our course catalog and begin your learning journey.', 'info']
    );
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)',
      [studentId, 'Course Enrolled', 'You have successfully enrolled in The Complete Web Development Bootcamp 2024.', 'enrollment']
    );

    console.log('✅ Enrollments, reviews, notifications created');
    console.log('');
    console.log('🎉 Seed complete! Demo accounts:');
    console.log('   Admin:      admin@learnhub.com / admin123');
    console.log('   Instructor: instructor@learnhub.com / instructor123');
    console.log('   Student:    student@learnhub.com / student123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
