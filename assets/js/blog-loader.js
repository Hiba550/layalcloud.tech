/**
 * Blog Loader
 * Handles loading individual blog posts and processing their content
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the post page (single post view)
  const isPostPage = window.location.pathname.includes('post.html');
  
  if (isPostPage) {
    loadSinglePost();
  }
  
  // Check for URL parameters (search, category, tag)
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  const categoryFilter = urlParams.get('category');
  const tagFilter = urlParams.get('tag');
  
  // Apply filters if present
  if (searchQuery || categoryFilter || tagFilter) {
    applyFilters(searchQuery, categoryFilter, tagFilter);
  }
});

/**
 * Load a single blog post
 */
async function loadSinglePost() {
  try {
    // Get post ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
      displayError('Post ID is missing');
      return;
    }
    
    // Get posts index
    const posts = await getBlogPostsList();
    
    // Find the specific post
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      displayError('Post not found');
      return;
    }
    
    // Load the post content from its markdown file
    const postContent = await loadMarkdownFile(`posts/${post.file}`);
    
    // Update the page title
    document.title = `${post.title} | Layal Cloud`;
    
    // Update the content
    updatePostContent(post, postContent.html);
    
    // Update meta tags for SEO
    updateMetaTags(post);
    
    // Load related posts
    loadRelatedPosts(post, posts);
    
  } catch (error) {
    console.error('Error loading blog post:', error);
    displayError('Failed to load the blog post. Please try again later.');
  }
}

/**
 * Update the post content in the DOM
 */
function updatePostContent(post, contentHtml) {
  // Find the main content container
  const contentContainer = document.querySelector('.blog-content');
  if (!contentContainer) return;
  
  // Set the post header info
  const headerContainer = document.querySelector('.single-blog-header');
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="container">
        <h1 class="display-4">${post.title}</h1>
        <div class="post-meta">
          <span class="me-3"><i class="far fa-calendar"></i> ${formatDate(post.date)}</span>
          ${post.author ? `<span class="me-3"><i class="far fa-user"></i> ${post.author}</span>` : ''}
          ${post.category ? `<span><i class="far fa-folder"></i> ${post.category}</span>` : ''}
        </div>
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags mt-2">
            ${post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  // Set the main content
  contentContainer.innerHTML = contentHtml;
  
  // Add featured image if available
  if (post.image) {
    const imgElement = document.createElement('img');
    imgElement.src = post.image;
    imgElement.alt = post.title;
    imgElement.className = 'img-fluid rounded mb-4';
    
    contentContainer.insertBefore(imgElement, contentContainer.firstChild);
  }
  
  // Add author bio if available
  if (post.author) {
    const authorBio = document.createElement('div');
    authorBio.className = 'author-bio';
    authorBio.innerHTML = `
      <img src="assets/images/author.jpg" alt="${post.author}" class="author-img">
      <div>
        <h5>${post.author}</h5>
        <p>Writer and contributor at Layal Cloud. Passionate about creating valuable content for our readers.</p>
      </div>
    `;
    
    contentContainer.appendChild(authorBio);
  }
}

/**
 * Update meta tags for SEO
 */
function updateMetaTags(post) {
  // Set Open Graph and Twitter meta tags
  const metaTags = {
    'meta[name="description"]': post.excerpt || `${post.title} - Layal Cloud Blog`,
    'meta[property="og:title"]': `${post.title} | Layal Cloud`,
    'meta[property="og:description"]': post.excerpt || `${post.title} - Layal Cloud Blog`,
    'meta[property="og:type"]': 'article',
    'meta[property="og:url"]': `${window.location.origin}${window.location.pathname}?id=${post.id}`,
    'meta[name="twitter:title"]': post.title,
    'meta[name="twitter:description"]': post.excerpt || `${post.title} - Layal Cloud Blog`
  };
  
  // If the post has an image, add it to Open Graph and Twitter
  if (post.image) {
    metaTags['meta[property="og:image"]'] = post.image;
    metaTags['meta[name="twitter:image"]'] = post.image;
  }
  
  // Update each meta tag
  Object.entries(metaTags).forEach(([selector, content]) => {
    const metaTag = document.querySelector(selector);
    if (metaTag) {
      metaTag.setAttribute('content', content);
    }
  });
}

/**
 * Load related posts
 */
function loadRelatedPosts(currentPost, allPosts) {
  // Get container for related posts
  const relatedContainer = document.querySelector('.related-posts');
  if (!relatedContainer) return;
  
  // Find posts with the same category or tags
  let relatedPosts = allPosts.filter(post => {
    if (post.id === currentPost.id) return false; // Skip current post
    
    // Check if category matches
    if (post.category && currentPost.category && post.category === currentPost.category) {
      return true;
    }
    
    // Check if any tags match
    if (post.tags && currentPost.tags) {
      return post.tags.some(tag => currentPost.tags.includes(tag));
    }
    
    return false;
  });
  
  // If not enough related posts, add recent posts
  if (relatedPosts.length < 3) {
    const recentPosts = allPosts
      .filter(post => post.id !== currentPost.id && !relatedPosts.includes(post))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    relatedPosts = [...relatedPosts, ...recentPosts].slice(0, 3);
  }
  
  // Display related posts
  if (relatedPosts.length > 0) {
    relatedContainer.innerHTML = `
      <h3 class="mb-4">Related Posts</h3>
      <div class="row">
        ${relatedPosts.slice(0, 3).map(post => `
          <div class="col-md-4 mb-4">
            <div class="card blog-post h-100">
              <img src="${post.image || 'assets/images/default-post.jpg'}" class="card-img-top" alt="${post.title}">
              <div class="card-body">
                <h5 class="card-title"><a href="post.html?id=${post.id}">${post.title}</a></h5>
                <p class="blog-post-meta">
                  <span><i class="far fa-calendar"></i> ${formatDate(post.date)}</span>
                </p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    relatedContainer.innerHTML = '';
  }
}

/**
 * Apply filters to the blog posts (search, category, tag)
 */
async function applyFilters(searchQuery, categoryFilter, tagFilter) {
  try {
    // Get all posts
    const allPosts = await getBlogPostsList();
    
    // Apply filters
    let filteredPosts = allPosts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query))
      );
    }
    
    if (categoryFilter) {
      filteredPosts = filteredPosts.filter(post => 
        post.category && post.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    if (tagFilter) {
      filteredPosts = filteredPosts.filter(post => 
        post.tags && post.tags.map(t => t.toLowerCase()).includes(tagFilter.toLowerCase())
      );
    }
    
    // Update filter info
    updateFilterInfo(searchQuery, categoryFilter, tagFilter);
    
    // Load filtered posts
    loadRegularPosts(filteredPosts);
    
    // If we have enough filtered posts, also update featured posts
    if (filteredPosts.length >= 3) {
      loadFeaturedPosts(filteredPosts.slice(0, 3));
    }
    
  } catch (error) {
    console.error('Error applying filters:', error);
  }
}

/**
 * Update filter information display
 */
function updateFilterInfo(searchQuery, categoryFilter, tagFilter) {
  const blogSectionTitle = document.querySelector('#blog .section-title');
  if (!blogSectionTitle) return;
  
  if (searchQuery) {
    blogSectionTitle.textContent = `Search Results for: "${searchQuery}"`;
  } else if (categoryFilter) {
    blogSectionTitle.textContent = `Category: ${categoryFilter}`;
  } else if (tagFilter) {
    blogSectionTitle.textContent = `Tag: ${tagFilter}`;
  }
}

/**
 * Display error message
 */
function displayError(message) {
  const contentContainer = document.querySelector('.blog-content') || document.querySelector('.container');
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div class="alert alert-danger my-5" role="alert">
        <h4>Error</h4>
        <p>${message}</p>
        <a href="index.html" class="btn btn-primary">Back to Home</a>
      </div>
    `;
  }
}
