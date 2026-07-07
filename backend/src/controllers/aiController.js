import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

/**
 * POST /api/ai/chat
 * Body: { courseId, lessonId, messages }
 * messages: Array of { role: 'user'|'assistant', content: string }
 */
export async function getAiTutorResponse(req, res) {
  try {
    const { courseId, lessonId, messages } = req.body;

    if (!courseId) {
      return sendError(res, 400, 'Course ID is required.');
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return sendError(res, 400, 'Messages array is required.');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return sendError(res, 500, 'AI Tutor Service is not configured (missing API Key).');
    }

    // 1. Fetch course context
    const { rows: courses } = await pool.query(
      `SELECT c.title, c.description, c.short_description, u.name AS instructor_name 
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $1`,
      [courseId]
    );

    if (!courses[0]) {
      return sendError(res, 404, 'Course not found.');
    }
    const course = courses[0];

    // 2. Optional: Fetch active lesson context
    let lessonContext = '';
    if (lessonId) {
      const { rows: lessons } = await pool.query(
        'SELECT title, content, type FROM lessons WHERE id = $1',
        [lessonId]
      );
      if (lessons[0]) {
        const lesson = lessons[0];
        lessonContext = `The student is currently watching/reading the lesson titled "${lesson.title}" (${lesson.type}).`;
        if (lesson.content) {
          lessonContext += ` Here is some written content/description from the lesson: "${lesson.content.slice(0, 1000)}".`;
        }
      }
    }

    // 3. Construct System Prompt
    const systemPrompt = `You are "LearnHub AI", a highly professional, expert AI Learning Tutor and Teaching Assistant for the course "${course.title}".
This course is taught by the instructor "${course.instructor_name}".
Course Overview: ${course.short_description || course.description || 'No description provided.'}
${lessonContext}

Your goal:
- Help the student understand the course concepts, explain complex terms, provide examples, and clarify any doubts.
- Answer in a structured, clean Markdown format. Keep answers concise, direct, helpful, and academically engaging.
- Be encouraging and supportive, maintaining the persona of an expert academic tutor.
- IMPORTANT: Only answer questions related to this course topic, general programming/field-related queries, or study advice. If the student asks you something completely unrelated (e.g., booking flights, recipes, random pop culture), politely refuse to answer and redirect them to the course topic.
`;

    // 4. Format messages for OpenAI Chat API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })).slice(-15) // Keep last 15 messages to stay within context windows and avoid rate limits
    ];

    // 5. Call OpenAI API using native fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API Error response:', errText);
      throw new Error(`OpenAI responded with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response at this time.';

    return sendSuccess(res, { reply });
  } catch (err) {
    console.error('AI Tutor controller error:', err);
    return sendError(res, 500, 'AI Tutor service encountered an error.', err.message);
  }
}

/**
 * POST /api/ai/run-code
 * Proxies code execution to the self-hosted Piston Docker container
 */
export async function runCodeProxy(req, res) {
  try {
    const { language, version, files } = req.body;

    if (!language || !files) {
      return sendError(res, 400, 'Language and files are required.');
    }

    const pistonUrl = process.env.PISTON_URL || 'http://127.0.0.1:2000';

    // Query Piston runtimes to resolve the installed version for the target language/alias
    let targetVersion = version;
    try {
      const runtimesRes = await fetch(`${pistonUrl}/api/v2/runtimes`);
      if (runtimesRes.ok) {
        const runtimes = await runtimesRes.json();
        const match = runtimes.find(
          r => r.language.toLowerCase() === language.toLowerCase() ||
               r.aliases?.some(a => a.toLowerCase() === language.toLowerCase())
        );
        if (match) {
          targetVersion = match.version;
        }
      }
    } catch (e) {
      console.warn('Could not fetch runtimes list from Piston to match version:', e.message);
    }

    const response = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, version: targetVersion, files })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Piston Local Error response:', errText);
      throw new Error(`Piston local instance responded with status ${response.status}`);
    }

    const resData = await response.json();
    return sendSuccess(res, resData);
  } catch (err) {
    console.error('Piston proxy error:', err);
    return sendError(
      res,
      500,
      'Failed to execute code. Ensure the self-hosted Piston Docker container is running.',
      err.message
    );
  }
}

