const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyDfOyh_zQRW5j4Yg8QtckJXULW-5qHQmNc');
(async () => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('hola');
    console.log('SUCCESS', result.response.text());
  } catch (e) {
    console.log('ERROR:', e.message, e.status, JSON.stringify(e));
  }
})();
