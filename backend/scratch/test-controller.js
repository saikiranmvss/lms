import 'dotenv/config';
import { login } from '../src/controllers/authController.js';

async function test() {
  const req = {
    body: {
      email: 'doesnotexist@example.com',
      password: 'wrongpassword'
    }
  };
  
  const res = {
    status(code) {
      console.log('Status set:', code);
      return this;
    },
    json(obj) {
      console.log('JSON returned:', obj);
      return this;
    }
  };

  try {
    await login(req, res);
  } catch (err) {
    console.error('Unhandled Controller Error:', err);
  }
}

test().then(() => process.exit(0));
