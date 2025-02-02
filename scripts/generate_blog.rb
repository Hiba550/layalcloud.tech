require 'net/http'
require 'json'
require 'fileutils'

# Configuration
GEMINI_API_URL = 'https://api.gemini.com/v2'
BLOG_DIR = 'blog'
IMAGES_DIR = 'assets/images'

# Fetch data from Gemini API
def fetch_gemini_data
  uri = URI("#{GEMINI_API_URL}/data")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
end

# Generate markdown content for a blog post
def generate_markdown(data)
  <<~MARKDOWN
    # #{data['title']}

    #{data['content']}

    ![Image](#{IMAGES_DIR}/#{data['image']})
  MARKDOWN
end

# Save markdown content to a file
def save_markdown(filename, content)
  FileUtils.mkdir_p(BLOG_DIR)
  File.write(File.join(BLOG_DIR, filename), content)
end

# Main function to generate blog posts
def generate_blog_posts
  data = fetch_gemini_data
  data.each do |post|
    markdown = generate_markdown(post)
    save_markdown("#{post['title'].downcase.gsub(' ', '_')}.md", markdown)
  end
end

# Run the script
generate_blog_posts
