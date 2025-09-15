const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Missing GOOGLE_API_KEY environment variable');
  process.exit(1);
}

const prompt = process.argv.slice(2).join(' ').trim();
if (!prompt) {
  console.error('Usage: node index.js <prompt>');
  process.exit(1);
}

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(text);
  } catch (err) {
    console.error('Error generating content:', err.message);
    process.exit(1);
  }
}

run();
