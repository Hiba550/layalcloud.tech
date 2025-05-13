/**
 * Markdown Parser
 * Converts Markdown content to HTML for the static blog
 */

// Define regex patterns for Markdown elements
const markdownPatterns = {
  heading: /^(#{1,6})\s+(.+)$/gm,
  bold: /\*\*(.*?)\*\*/g,
  italic: /\*(.*?)\*/g,
  link: /\[([^\[]+)\]\(([^)]+)\)/g,
  image: /!\[([^\[]+)\]\(([^)]+)\)/g,
  listItem: /^(\s*)([-*+]|\d+\.)\s+(.+)$/gm,
  code: /`{3}(\w*)\n([\s\S]*?)\n`{3}/g,
  inlineCode: /`([^`]+)`/g,
  blockquote: /^>\s+(.+)$/gm,
  horizontalRule: /^(-{3,}|_{3,}|\*{3,})$/gm,
  paragraph: /^(?!<h|<ul|<ol|<li|<blockquote|<hr|<table|<pre)(.+)$/gm,
};

/**
 * Parse Markdown content to HTML
 * @param {string} markdown - The markdown content
 * @returns {string} - The HTML content
 */
function parseMarkdown(markdown) {
  let html = markdown;
  
  // Parse metadata if available
  const metadata = {};
  const metadataMatch = html.match(/^---\n([\s\S]*?)\n---\n/);
  
  if (metadataMatch) {
    const metadataContent = metadataMatch[1];
    const metadataLines = metadataContent.split('\n');
    
    metadataLines.forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        metadata[key.trim()] = value.trim();
      }
    });
    
    // Remove metadata section from the content
    html = html.replace(/^---\n[\s\S]*?\n---\n/, '');
  }
  
  // Convert Markdown syntax to HTML
  html = html
    // Convert headings
    .replace(markdownPatterns.heading, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level}>${content}</h${level}>`;
    })
    
    // Convert bold text
    .replace(markdownPatterns.bold, '<strong>$1</strong>')
    
    // Convert italic text
    .replace(markdownPatterns.italic, '<em>$1</em>')
    
    // Convert links
    .replace(markdownPatterns.link, '<a href="$2">$1</a>')
    
    // Convert images
    .replace(markdownPatterns.image, '<img src="$2" alt="$1" loading="lazy">')
    
    // Convert code blocks
    .replace(markdownPatterns.code, (match, language, code) => {
      return `<pre><code class="language-${language}">${escapeHTML(code)}</code></pre>`;
    })
    
    // Convert inline code
    .replace(markdownPatterns.inlineCode, '<code>$1</code>')
    
    // Convert blockquotes
    .replace(markdownPatterns.blockquote, '<blockquote>$1</blockquote>')
    
    // Convert horizontal rules
    .replace(markdownPatterns.horizontalRule, '<hr>')
    
    // Process lists (simple implementation)
    .replace(/^( *)[-*+] (.+)$/gm, (match, indent, content) => {
      const indentLevel = Math.floor(indent.length / 2);
      return `${'  '.repeat(indentLevel)}<li>${content}</li>`;
    });
    
  // Wrap list items with ul/ol
  html = processLists(html);
  
  // Convert paragraphs (lines that don't start with HTML tags)
  html = html.replace(/^(?!<h|<ul|<ol|<li|<blockquote|<hr|<pre)(.+)$/gm, '<p>$1</p>');
  
  // Clean up multiple consecutive line breaks
  html = html.replace(/\n\s*\n/g, '\n\n');
  
  return { html, metadata };
}

/**
 * Process and properly nest list items
 */
function processLists(content) {
  // This is a simplified implementation
  // For a complete solution, you'd need to handle nested lists properly
  content = content.replace(/(<li>.*<\/li>\n)+/g, (match) => {
    return '<ul>\n' + match + '</ul>';
  });
  
  return content;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Load a Markdown file and convert to HTML
 */
async function loadMarkdownFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load markdown file: ${response.status}`);
    }
    
    const markdown = await response.text();
    return parseMarkdown(markdown);
  } catch (error) {
    console.error('Error loading markdown file:', error);
    return { 
      html: '<p>Error loading content.</p>', 
      metadata: {} 
    };
  }
}
