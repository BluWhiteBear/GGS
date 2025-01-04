// Configuration object for different blog types
const BLOG_CONFIGS = {
    hex: {
        jsonPath: 'js/data/blogPosts_Hex.json',
        template: createTemplate('Hex VR')
    },
    site: {
        jsonPath: 'js/data/blogPosts_Site.json',
        template: createTemplate('GG Site')
    }
};

// Template helper function
function createTemplate(prefix) {
    return {
        title: `${prefix} Patch Notes`,
        headerPrefix: `${prefix} Patch Notes |`
    };
}

const STYLES = {
    cardHeader: {
        background: '#1a1a1a',
        padding: '15px 10px',
        borderRadius: '10px 10px 0 0'
    },
    headerImage: {
        border: '2px solid white',
        borderRadius: '10px',
        objectFit: 'cover',
        minWidth: '50px',
        minHeight: '50px',
        width: '100%',
        maxHeight: '80px'
    }
};

// Template function to generate blog posts
function generateBlogPost(postData, blogType, isGenerator = false) {
    try {
        if (!isGenerator) validateBlogPost(postData);
        const config = BLOG_CONFIGS[blogType];
        const collapseId = `patchnotes_${postData.version?.replace(/\./g, '_') || 'preview'}`;

        return `
            ${isGenerator && !validateBlogPost(postData, true) ? 
                '<div class="alert alert-danger mb-3">Missing required fields</div>' : ''}
            <div class="card text-white bg-dark h-100">
                <div class="card-body p-0">
                    ${generateHeader(postData, config)}
                    ${generateContent(postData, collapseId)}
                </div>
            </div>
            <div class="my-5"></div>
        `;
    } catch (error) {
        console.error('Error generating blog post:', error);
        return isGenerator ? generateErrorCard(postData, error) : `<div class="alert alert-danger">Error generating blog post: ${error.message}</div>`;
    }
}

function generateHeader(postData, config) {
    return `
        <div style="background-color: #1a1a1a; padding: 15px 10px; border-radius: 10px 10px 0 0;">
            <div class="row no-gutters">
                <div class="col-2 col-sm-1 d-flex align-items-center pe-2" style="min-width: 60px;">
                    <img src="${postData.headerImg}" alt="" class="img-fluid" 
                        style="border: 2px solid white; border-radius: 10px; object-fit: cover; min-width: 50px; min-height: 50px; width: 100%; max-height: 80px;"/>
                </div>
                <div class="col-10 col-sm-11 d-flex flex-column justify-content-center">
                    <h3 class="font-weight-light" style="margin-bottom: 10px;">${config.template.headerPrefix} ${postData.type}</h3>
                    <p style="margin-bottom: 15px;"><b>Version ${postData.version}</b> - ${postData.date}</p>
                </div>
            </div>
        </div>
    `;
}

function generateContent(postData, collapseId) {
    return `
        <div style="padding: 20px;">
            <div class="col-lg-8">
                <h3 class="font-weight-light" style="margin-bottom: 10px;">${postData.title}</h3>
                <h4 style="font-weight: 600;">Developer Notes:</h4>
                <p style="margin-bottom: 15px;">${postData.devNotes} - ${postData.author}</p>

                <button class="btn btn-outline-light" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#${collapseId}" aria-expanded="false" 
                        aria-controls="${collapseId}" style="width: 120px;">
                    Show More
                </button>

                <div class="collapse" id="${collapseId}" style="margin-top: 0px;">
                    ${generateSections(postData.sections)}
                    ${generateMedia(postData)}
                    ${postData.downloadUrl ? `<a class="btn btn-outline-light" href="${postData.downloadUrl}" target="_blank">Download</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

function generateErrorCard(postData, error) {
    const errorHeader = generateHeader(postData, BLOG_CONFIGS.hex);
    return `
        <div class="alert alert-danger mb-3">Error generating blog post: ${error.message}</div>
        <div class="card text-white bg-dark h-100">
            <div class="card-body p-0">
                ${errorHeader}
                ${generateContent(postData, `error_${Date.now()}`)}
            </div>
        </div>
        <div class="my-5"></div>
    `;
}

// Validate the blog post data
function validateBlogPost(postData, returnBoolean = false) {
    const requiredFields = ['type', 'version', 'date', 'title', 'author', 'devNotes'];
    for (const field of requiredFields) {
        if (!postData[field]) {
            if (returnBoolean) return false;
            throw new Error(`Missing required field: ${field}`);
        }
    }
    return true;
}

// Generate sections from blog post data
function generateSections(sections) {
    if (!sections?.length) return '';
    return sections.map(section => `
        <hr>
        <h5 style="font-weight: 600;">${section.title}:</h5>
        <dl>
            ${section.changes.map(change => `<dt>${change.name}</dt><dd>${change.description}</dd>`).join('')}
        </dl>
    `).join('');
}

// Generate media content for the blog post
function generateMedia(postData) {
    if (!postData.mediaUrl && !postData.videoUrl) return '';
    
    let videoUrl = postData.videoUrl;
    if (videoUrl && videoUrl.includes('youtube')) {
        // Convert to privacy-enhanced URL format and strip tracking parameters
        videoUrl = videoUrl
            .replace(/(?:www\.)?youtube\.com\/watch\?v=([^&]+)/, 'www.youtube-nocookie.com/embed/$1')
            .replace('youtube.com/embed/', 'youtube-nocookie.com/embed/')
            .split('?')[0]; // Remove any existing parameters
        
        // Add minimal required parameters
        const params = [
            'rel=0',                // Don't show related videos
            'modestbranding=1',     // Minimal branding
            'enablejsapi=0',        // Disable JS API
            'nocookie=1'            // Enable privacy mode
        ];
        
        videoUrl += '?' + params.join('&');
    }

    const mediaContent = postData.mediaType === 'video' && videoUrl ? 
        `<iframe class="rounded" 
            src="${videoUrl}" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            loading="lazy"
            referrerpolicy="no-referrer"
            title="Video content"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allowfullscreen></iframe>` : 
        `<img src="${postData.mediaUrl}" 
            alt="Blog post media" 
            class="rounded" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);"
            loading="lazy"/>`;

    return `
        <div style="position: relative; overflow: hidden; padding-top: 56.25%; margin-bottom: 20px;">
            ${mediaContent}
        </div>
    `;
}

// Load blog posts dynamically
async function loadBlogPosts(blogType = 'hex') {
    try {
        const config = BLOG_CONFIGS[blogType];
        const response = await fetch(config.jsonPath);
        const data = await response.json();
        const visiblePosts = data.posts.filter(post => !post.hidden);

        const container = document.querySelector('#blog-posts-container');
        visiblePosts.forEach(postData => {
            container.insertAdjacentHTML('beforeend', generateBlogPost(postData, blogType));
        });
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.querySelector('#blog-posts-container').innerHTML = '<div class="alert alert-danger">Error loading blog posts</div>';
    }
}

// Load recent news
async function loadRecentNews() {
    try {
        const response = await fetch(BLOG_CONFIGS.hex.jsonPath);
        const data = await response.json();
        const recentPost = data.posts.find(post => !post.hidden);

        if (!recentPost) return;
        const newsContainer = document.querySelector('#recent-news-container');
        newsContainer.insertAdjacentHTML('beforeend', `
            <div class="row g-4">
                <div class="col-12 col-lg-5">
                    <div class="text-white">
                        <h3 class="font-weight-light">${recentPost.title} | ${recentPost.type}</h3>
                        <p class="text-light mb-2" style="font-size: 0.9rem;">
                            <b>Version ${recentPost.version}</b> - ${recentPost.date}
                        </p>
                        <p style="font-size: 1.1rem;">${recentPost.devNotes} - ${recentPost.author}</p>
                        <a class="btn btn-outline-light px-4" href="blog_hex.html" style="border-radius: 20px;">Learn More</a>
                    </div>
                </div>
                <div class="col-12 col-lg-7">
                    ${generateMedia(recentPost)}
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error loading recent news:', error);
        document.querySelector('#recent-news-container').innerHTML = '<div class="alert alert-danger">Error loading recent news</div>';
    }
}

// Initialize page components on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const blogContainer = document.querySelector('#blog-posts-container');
    if (blogContainer) loadBlogPosts(blogContainer.dataset.blogType || 'hex');

    const newsContainer = document.querySelector('#recent-news-container');
    if (newsContainer) loadRecentNews();
    
    // Add this new code
    const statusAlert = document.querySelector('.edit-status-alert');
    const statusText = document.querySelector('.edit-status-text');
    if (statusAlert && statusText) {
        statusAlert.classList.add('creating');
        statusText.textContent = 'Creating new blog post';
    }

    const existingPostsSelect = document.getElementById('existingPosts');
    if (existingPostsSelect) {
        existingPostsSelect.addEventListener('change', function() {
            if (!this.value) {
                clearPostSelection();
            }
            else
            {
                loadExistingPost();
            }
        });
    }
    
    await populateExistingPosts();
});

// Populate existing blog post options in a dropdown
async function populateExistingPosts() {
    try {
        // Check if select element exists first
        const select = document.getElementById('existingPosts');
        if (!select) {
            // Not on blog post designer page, skip silently
            return;
        }

        const [hexPosts, sitePosts] = await Promise.all([
            fetch(BLOG_CONFIGS.hex.jsonPath).then(res => res.json()),
            fetch(BLOG_CONFIGS.site.jsonPath).then(res => res.json())
        ]);

        select.innerHTML = '<option value="">New Blog Post</option>';
        
        appendPostOptions(select, 'Hex VR Posts', hexPosts.posts);
        appendPostOptions(select, 'Site Posts', sitePosts.posts);
    } catch (error) {
        console.error('Error loading existing posts:', error);
        // Only show error if select exists
        const select = document.getElementById('existingPosts');
        if (select) {
            select.innerHTML = '<option value="">Error loading posts</option>';
        }
    }
}

function appendPostOptions(select, label, posts) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;
    posts.forEach(post => {
        const option = document.createElement('option');
        option.value = `${label.split(' ')[0].toLowerCase()}-${post.version}`;
        option.textContent = `${post.title} (${post.version})`;
        option.dataset.json = JSON.stringify(post);
        optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
}

function loadExistingPost() {
    const select = document.getElementById('existingPosts');
    const selectedOption = select.selectedOptions[0];
    const statusAlert = document.querySelector('.edit-status-alert');
    const statusText = document.querySelector('.edit-status-text');
    const deleteBtn = document.getElementById('deletePostBtn');
    
    if (selectedOption?.dataset.json) {
        document.getElementById('outputJson').value = JSON.stringify(JSON.parse(selectedOption.dataset.json), null, 4);
        updateFormFromJson();
        
        // Show editing status and delete button
        statusAlert.classList.remove('creating');
        statusAlert.classList.add('editing');
        statusAlert.style.display = 'block';
        statusText.textContent = `Editing existing post`;
        deleteBtn.style.display = 'block';
    } else {
        // Show creating status and hide delete button
        statusAlert.classList.remove('editing');
        statusAlert.classList.add('creating');
        statusAlert.style.display = 'block';
        statusText.textContent = 'Creating new blog post';
        deleteBtn.style.display = 'none';
    }
}

function clearPostSelection() {
    try {
        const select = document.getElementById('existingPosts');
        const deleteBtn = document.getElementById('deletePostBtn');
        
        if (select) {
            select.value = '';
        }
        
        // Hide delete button
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
        
        const statusAlert = document.querySelector('.edit-status-alert');
        const statusText = document.querySelector('.edit-status-text');
        
        if (statusAlert && statusText) {
            statusAlert.classList.remove('editing');
            statusAlert.classList.add('creating');
            statusText.textContent = 'Creating new blog post';
        }
        
        clearFormFields();
        
        console.log('Post selection cleared successfully');
    } catch (error) {
        console.error('Error clearing post selection:', error);
    }
}

function clearFormFields() {
    try {
        // Clear basic info fields
        document.getElementById('headerImg').value = '';
        document.getElementById('type').value = 'Major Update';
        document.getElementById('version').value = '';
        document.getElementById('date').value = '';
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        document.getElementById('devNotes').value = '';
        
        // Clear media fields
        document.getElementById('mediaUrl').value = '';
        document.getElementById('videoUrl').value = '';
        document.getElementById('mediaType').value = 'image';
        document.getElementById('downloadUrl').value = '';
        
        // Clear blog type selection
        document.getElementById('blogType').value = 'hex';
        
        // Clear sections with a fresh container
        const sectionsContainer = document.getElementById('sectionsContainer');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = '<h3>Sections</h3>';
        }
        
        // Clear JSON output
        const jsonOutput = document.getElementById('outputJson');
        if (jsonOutput) {
            jsonOutput.value = '';
        }
        
        // Force update preview
        if (typeof updatePreview === 'function') {
            updatePreview();
        }
        
        console.log('Form fields cleared successfully');
    } catch (error) {
        console.error('Error clearing form fields:', error);
    }
}