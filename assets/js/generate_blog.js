const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

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

async function generateBlogPost(input) {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chatSession.sendMessage(input);
  return result.response.text();
}

async function displayBlogPosts() {
  const postsContainer = document.getElementById('posts-container');
  const input = "Generate a technical blog post with retype markdowns and related images";
  const blogPost = await generateBlogPost(input);

  const postElement = document.createElement('div');
  postElement.innerHTML = blogPost;
  postsContainer.appendChild(postElement);
}

displayBlogPosts();
