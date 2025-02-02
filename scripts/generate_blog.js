const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function fetchGeminiData() {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chatSession.sendMessage("Fetch technical blog data");
  return JSON.parse(result.response.text());
}

function generateMarkdown(data) {
  return `
    # ${data.title}

    ${data.content}

    ![Image](assets/images/${data.image})
  `;
}

function saveMarkdown(filename, content) {
  const blogDir = path.join(__dirname, '..', 'blog');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir);
  }
  fs.writeFileSync(path.join(blogDir, filename), content);
}

async function generateBlogPosts() {
  const data = await fetchGeminiData();
  data.forEach(post => {
    const markdown = generateMarkdown(post);
    saveMarkdown(`${post.title.toLowerCase().replace(/ /g, '_')}.md`, markdown);
  });
}

generateBlogPosts();
