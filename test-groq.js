const Groq = require('groq-sdk');
require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  try {
    const res = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'test' }],
      model: 'mixtral-8x7b-32768'
    });
    console.log("SUCCESS:", res.choices[0].message.content);
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
