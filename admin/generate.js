/**
 * Admin Blog Generator
 * Uses OpenAI API to generate blog posts in Markdown format
 */

// Define repository details (replace with your GitHub username and repo name)
const GITHUB_OWNER = 'Hiba550';
const GITHUB_REPO = 'layalcloud.tech';

document.addEventListener('DOMContentLoaded', () => {
    // Show password modal on page load
    const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    passwordModal.show();
    
    // Handle password submission
    document.getElementById('submit-password').addEventListener('click', () => {
        const password = document.getElementById('password').value;
        // Simple client-side password check (not secure, but meets minimal requirements)
        // In a real application, consider more secure authentication
        if (password === 'admin123') { // Change this to your desired password
            passwordModal.hide();
        } else {
            document.getElementById('password-error').textContent = 'Incorrect password. Please try again.';
        }
    });
    
    // Handle form submission
    document.getElementById('generate-form').addEventListener('submit', handleFormSubmit);
    
    // Handle copy button
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
    
    // Handle save button
    document.getElementById('save-locally').addEventListener('click', saveAsMarkdown);

    // Wire up the Post Blog button
    const postBtn = document.getElementById('post-btn');
    if (postBtn) {
        postBtn.addEventListener('click', postBlog);
    } else {
        console.error("Post Blog button ('post-btn') not found on DOMContentLoaded.");
    }

    // Manual tab event listeners
    document.getElementById('manual-preview-btn').addEventListener('click', () => {
        const md = document.getElementById('manual-markdown').value;
        document.getElementById('manual-preview-container').innerHTML = marked.parse(md);
    });
    document.getElementById('manual-save-btn').addEventListener('click', () => {
        const md = document.getElementById('manual-markdown').value;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'manual-post.md';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });
    document.getElementById('manual-post-btn').disabled = true;
});

/**
 * Handle form submission to generate a blog post
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const topic = document.getElementById('topic').value;
    const tone = document.getElementById('tone').value;
    const length = document.getElementById('length').value;
    const apiKey = document.getElementById('apiKey').value;
    
    // Validate inputs
    if (!topic || !apiKey) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Show loading indicator
    document.getElementById('loading').classList.remove('d-none');
    document.getElementById('result-container').classList.add('d-none');
    document.getElementById('copy-btn').classList.add('d-none');
    document.getElementById('save-locally').disabled = true;
    
    try {
        // Generate blog post using OpenAI API
        const blogPost = await generateBlogPost(topic, tone, length, apiKey);
        
        // Display the result
        displayResult(blogPost);
        
        // Enable save button
        document.getElementById('save-locally').disabled = false;
    } catch (error) {
        console.error('Error generating blog post:', error);
        alert('Error generating blog post: ' + error.message);
        document.getElementById('loading').classList.add('d-none');
    }
}

/**
 * Generate a blog post using GitHub Models API
 */
async function generateBlogPost(topic, tone, length, apiKey) {
    // Define word count based on length setting
    const wordCounts = {
        'short': 500,
        'medium': 1000,
        'long': 1500
    };
    const wordCount = wordCounts[length] || 1000;

    // Prepare the system message for the AI
    const systemMessage = `You are a professional blog writer creating high-quality, SEO-optimized blog posts in Markdown format. 
Create a comprehensive ${length} blog post (about ${wordCount} words) on the topic provided.

Guidelines:
- Write in a ${tone} tone
- Use proper Markdown formatting including:
  - Clear headings (# for main title, ## for sections, ### for subsections)
  - **Bold** for important points
  - *Italic* for emphasis
  - Bullet lists and numbered lists where appropriate
  - Add 3-5 relevant emojis where appropriate
- Include a metadata section at the top with title, date, author, and tags
- Structure should include:
  - Introduction
  - 3-5 main sections with subheadings
  - Conclusion or call to action
- Write as if for a mobile audience with clear, scannable sections
- Add a unique perspective and valuable insights
- Make it engaging, factual, and authoritative

Output Format:
---
title: [Generated Title]
date: ${new Date().toISOString().split('T')[0]}
author: AI Content Writer
tags: [3-5 relevant tags]
category: [Relevant Category]
excerpt: [Brief 1-2 sentence summary]
---

[Full Markdown Content]
`;

    // Send request to GitHub Models endpoint
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'openai/gpt-4.1',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: `Please write a blog post about: ${topic}` }
            ],
            temperature: 1.0,
            top_p: 1.0
        })
    });

    // Read body as text first
    const text = await response.text();
    let data;
    try { 
        data = JSON.parse(text); 
    } catch (_e) { 
        // If parsing fails, data remains null, and we'll use the raw text for error or content
        data = null; 
    }

    if (!response.ok) {
        let errorMessage = `Failed to generate blog post. Status: ${response.status}.`;
        if (data && (data.error?.message || data.message)) {
            errorMessage += ` Message: ${data.error.message || data.message}`;
        } else if (text) {
            // Try to provide a snippet of the response if it's not JSON or too long
            errorMessage += ` Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`;
        }
        throw new Error(errorMessage);
    }

    return data?.choices?.[0]?.message?.content || text; // Fallback to text if structure is unexpected or if content is not JSON
}

/**
 * Display the generated blog post
 */
function displayResult(markdown) {
    const resultContainer = document.getElementById('result-container');
    const previewContainer = document.getElementById('preview-container');
    const copyBtn = document.getElementById('copy-btn');
    const loadingIndicator = document.getElementById('loading');
    const postBtnEl = document.getElementById('post-btn');
    
    // Show raw markdown
    resultContainer.textContent = markdown;
    resultContainer.classList.remove('d-none');
    copyBtn.classList.remove('d-none');
    loadingIndicator.classList.add('d-none');
    
    // Render HTML preview
    previewContainer.innerHTML = marked.parse(markdown);
    previewContainer.classList.remove('d-none');
    if (postBtnEl) {
        postBtnEl.classList.remove('d-none');
    }
    
    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Copy the generated content to clipboard
 */
function copyToClipboard() {
    const resultContainer = document.getElementById('result-container');
    const copyBtn = document.getElementById('copy-btn');
    
    // Copy text
    navigator.clipboard.writeText(resultContainer.textContent)
        .then(() => {
            // Change button text temporarily
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        });
}

/**
 * Save the generated blog post as a Markdown file
 */
function saveAsMarkdown() {
    const content = document.getElementById('result-container').textContent;
    
    // Extract title from the markdown
    let title = 'blog-post';
    const titleMatch = content.match(/title:\s*(.+)/);
    if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-'); // Replace spaces with dashes
    }
    
    // Create a blob with the content
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Utility to save blob content as a file
 */
function saveBlob(content, defaultName) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${defaultName}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Post the generated blog locally by downloading .md and updated index.json
 */
async function postBlog() {
    try {
        // Get API key
        const apiKey = document.getElementById('apiKey').value;
        if (!apiKey) {
            alert('GitHub API Key is required to post the blog.');
            return;
        }
        
        // Use predefined owner and repo
        const owner = GITHUB_OWNER;
        const repo = GITHUB_REPO;

        const markdown = document.getElementById('result-container').textContent;
        // Parse front matter
        const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
        if (!fmMatch) {
            alert('Invalid markdown front matter');
            return;
        }
        const fmLines = fmMatch[1].split('\n');
        const meta = {};
        fmLines.forEach(line => {
            const [key, ...rest] = line.split(':');
            meta[key.trim()] = rest.join(':').trim().replace(/^\[|\]$/g, '');
        });
        const title = meta.title;
        const date = meta.date;
        const author = meta.author;
        const tags = meta.tags.split(',').map(t => t.trim());
        const category = meta.category;
        const excerpt = meta.excerpt;
        const image = meta.image || '';
        // Slugify title
        const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const fileName = `${slug}.md`;
        const path = `posts/${fileName}`;

        // Encode content to base64
        const contentB64 = btoa(unescape(encodeURIComponent(markdown)));

        // Create new markdown file in repo
        const createFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Add new post: ${title}`,
                content: contentB64,
                branch: 'main' // Ensure this branch exists
            })
        });

        if (!createFileResponse.ok) {
            let errorBody = 'Unknown error creating file.';
            try {
                const errorData = await createFileResponse.json();
                errorBody = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorBody = await createFileResponse.text();
            }
            throw new Error(`Failed to create markdown file in repository. Status: ${createFileResponse.status}. Message: ${errorBody}`);
        }
        

        // Update index.json
        let postsIndex = [];
        let indexSha = null;

        const indexRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/posts/index.json`, {
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (indexRes.ok) {
            const indexData = await indexRes.json();
            const indexContent = typeof indexData.content === 'string' ? atob(indexData.content) : '';
            try {
                postsIndex = JSON.parse(indexContent || '[]'); 
            } catch (e) {
                console.error("Failed to parse index.json, initializing as empty array:", e);
                postsIndex = []; 
            }
            indexSha = indexData.sha;
        } else if (indexRes.status === 404) {
            console.log('posts/index.json not found. Will create a new one.');
        } else {
            let errorBody = 'Unknown error fetching index.json.';
            try {
                const errorData = await indexRes.json();
                errorBody = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorBody = await indexRes.text();
            }
            throw new Error(`Failed to fetch posts/index.json. Status: ${indexRes.status}. Message: ${errorBody}`);
        }
        
        postsIndex.unshift({ id: slug, title, date, author, tags, category, excerpt, image, file: fileName });

        const updatedIndexB64 = btoa(unescape(encodeURIComponent(JSON.stringify(postsIndex, null, 2))));
        
        const updateIndexPayload = {
            message: `Update index.json for new post: ${title}`,
            content: updatedIndexB64,
            branch: 'main' // Ensure this branch exists
        };
        if (indexSha) {
            updateIndexPayload.sha = indexSha;
        }

        const updateIndexResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/posts/index.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(updateIndexPayload)
        });

        if (!updateIndexResponse.ok) {
            let errorBody = 'Unknown error updating index.json.';
            try {
                const errorData = await updateIndexResponse.json();
                errorBody = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorBody = await updateIndexResponse.text();
            }
            throw new Error(`Failed to update index.json in repository. Status: ${updateIndexResponse.status}. Message: ${errorBody}`);
        }

        alert('Post published successfully to GitHub repository.');
    } catch (err) {
        console.error('Error during post:', err);
        alert('Failed to publish post: ' + err.message);
    }
}
