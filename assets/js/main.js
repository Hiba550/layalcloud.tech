/**
 * Main JavaScript for the Layal Cloud Blog
 * Handles blog post loading, UI interactions, and more
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the blog
  initializeBlog();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Initialize the blog functionality
 */
async function initializeBlog() {
  // Load blog posts
  await loadBlogPosts();
  
  // Load categories and tags
  loadCategoriesAndTags();
  
  // Initialize search functionality
  initializeSearch();
}

/**
 * Set up event listeners for interactive elements
 */
function setupEventListeners() {
  // Contact form submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactFormSubmit);
  }
  
  // Newsletter subscription
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  }
  
  // Search functionality
  const searchForm = document.querySelector('.card-body .input-group');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
    
    // Also handle button click
    const searchButton = searchForm.querySelector('button');
    if (searchButton) {
      searchButton.addEventListener('click', handleSearch);
    }
  }
}

/**
 * Get the list of all blog posts
 */
async function getBlogPostsList() {
  try {
    const response = await fetch('posts/index.json');
    if (!response.ok) {
      throw new Error(`Failed to load posts index: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading blog posts list:', error);
    
    // Return empty array in case of error
    return [];
  }
}

/**
 * Load and display blog posts
 */
async function loadBlogPosts() {
  try {
    // Get posts list
    const posts = await getBlogPostsList();
    
    if (posts.length === 0) {
      displayNoPosts();
      return;
    }
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Load featured posts (most recent 3)
    loadFeaturedPosts(posts.slice(0, 3));
    
    // Load regular posts
    loadRegularPosts(posts);
    
  } catch (error) {
    console.error('Error loading blog posts:', error);
    displayError('Failed to load blog posts. Please try again later.');
  }
}

/**
 * Load featured posts into the featured section
 */
function loadFeaturedPosts(featuredPosts) {
  const featuredContainer = document.querySelector('.featured-posts-container');
  if (!featuredContainer) return;
  
  // Clear loading indicator
  featuredContainer.innerHTML = '';
  
  featuredPosts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'col-md-4 mb-4';
    
    const imageUrl = post.image || 'assets/images/default-post.jpg';
    
    postElement.innerHTML = `
      <div class="featured-post">
        <img src="${imageUrl}" alt="${post.title}" class="featured-post-img w-100">
        <div class="featured-post-content">
          <div class="featured-post-meta">
            <span class="me-3"><i class="far fa-calendar"></i> ${formatDate(post.date)}</span>
            ${post.author ? `<span><i class="far fa-user"></i> ${post.author}</span>` : ''}
          </div>
          <h3 class="featured-post-title">
            <a href="post.html?id=${post.id}" class="text-white">${post.title}</a>
          </h3>
        </div>
      </div>
    `;
    
    featuredContainer.appendChild(postElement);
  });
}

/**
 * Load regular posts into the main blog section
 */
function loadRegularPosts(posts) {
  const postsContainer = document.querySelector('.blog-posts-container');
  if (!postsContainer) return;
  
  // Clear loading indicator
  postsContainer.innerHTML = '';
  
  // Get posts to display (all for now, pagination will be implemented later)
  const postsToDisplay = posts;
  
  postsToDisplay.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'card blog-post mb-4';
    
    const imageUrl = post.image || 'assets/images/default-post.jpg';
    const excerpt = post.excerpt || post.content.substring(0, 150) + '...';
    
    postElement.innerHTML = `
      <div class="row g-0">
        <div class="col-md-4">
          <img src="${imageUrl}" class="card-img-top h-100" alt="${post.title}">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h3 class="card-title">
              <a href="post.html?id=${post.id}">${post.title}</a>
            </h3>
            <div class="blog-post-meta">
              <span class="me-3"><i class="far fa-calendar"></i> ${formatDate(post.date)}</span>
              ${post.author ? `<span class="me-3"><i class="far fa-user"></i> ${post.author}</span>` : ''}
              ${post.category ? `<span><i class="far fa-folder"></i> ${post.category}</span>` : ''}
            </div>
            <p class="blog-post-excerpt">${excerpt}</p>
            <a href="post.html?id=${post.id}" class="btn btn-sm btn-primary">Read More</a>
            
            ${post.tags && post.tags.length > 0 ? `
            <div class="blog-post-tags">
              ${post.tags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    postsContainer.appendChild(postElement);
  });
  
  // Update pagination
  updatePagination(posts.length);
}

/**
 * Load categories and tags from the posts
 */
function loadCategoriesAndTags() {
  getBlogPostsList().then(posts => {
    // Extract categories
    const categories = [...new Set(posts.map(post => post.category).filter(Boolean))];
    const categoriesContainer = document.querySelector('.categories-list');
    
    if (categoriesContainer) {
      categoriesContainer.innerHTML = categories.map(category => 
        `<li><a href="index.html?category=${encodeURIComponent(category)}">${category}</a></li>`
      ).join('');
    }
    
    // Extract tags
    const allTags = posts.flatMap(post => post.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    const tagsContainer = document.querySelector('.tags-cloud');
    
    if (tagsContainer) {
      tagsContainer.innerHTML = uniqueTags.map(tag => 
        `<a href="index.html?tag=${encodeURIComponent(tag)}">${tag}</a>`
      ).join('');
    }
  });
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
  const searchInput = document.querySelector('.input-group input');
  const searchButton = document.querySelector('.input-group button');
  
  if (!searchInput || !searchButton) return;
  
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    }
  });
  
  // Also submit on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `index.html?search=${encodeURIComponent(query)}`;
      }
    }
  });
}

/**
 * Update pagination based on total posts
 */
function updatePagination(totalPosts) {
  // This is a placeholder for pagination functionality
  // Currently just making the first page active
  const pagination = document.querySelector('.pagination');
  
  if (!pagination) return;
  
  // For now, we'll just show the pagination UI
  // Real pagination will be implemented later
}

/**
 * Display error message when posts can't be loaded
 */
function displayError(message) {
  const containers = [
    document.querySelector('.featured-posts-container'),
    document.querySelector('.blog-posts-container')
  ];
  
  containers.forEach(container => {
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-danger" role="alert">
            ${message}
          </div>
        </div>
      `;
    }
  });
}

/**
 * Display message when no posts are found
 */
function displayNoPosts() {
  const containers = [
    document.querySelector('.featured-posts-container'),
    document.querySelector('.blog-posts-container')
  ];
  
  containers.forEach(container => {
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <p>No blog posts found.</p>
        </div>
      `;
    }
  });
}

/**
 * Handle contact form submission
 */
function handleContactFormSubmit(event) {
  event.preventDefault();
  
  // In a real implementation, you'd send the form data to a backend service
  // For now, we'll just show a success message
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Show success message
  form.innerHTML = `
    <div class="alert alert-success">
      <p>Thank you for your message! We've received it and will respond as soon as possible.</p>
    </div>
  `;
}

/**
 * Handle newsletter subscription
 */
function handleNewsletterSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const emailInput = form.querySelector('input[type="email"]');
  
  if (!emailInput || !emailInput.value) return;
  
  // In a real implementation, you'd send this to a backend service
  // For now, we'll just show a success message
  
  form.innerHTML = `
    <div class="alert alert-success">
      <p>Thank you for subscribing to our newsletter!</p>
    </div>
  `;
}

/**
 * Handle search form submission
 */
function handleSearch(event) {
  event.preventDefault();
  
  const searchInput = document.querySelector('.input-group input');
  if (!searchInput) return;
  
  const query = searchInput.value.trim();
  if (query) {
    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
  }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}
