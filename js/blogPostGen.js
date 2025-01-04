// Configuration object for different blog types
const BLOG_CONFIGS = {
    hex: {
        jsonPath: 'js/data/blogPosts_Hex.json',
        template: {
            title: 'Hex VR Patch Notes',
            headerPrefix: 'Hex VR Patch Notes |'
        }
    },
    site: {
        jsonPath: 'js/data/blogPosts_Site.json',
        template: {
            title: 'GG Site Patch Notes',
            headerPrefix: 'GG Site Patch Notes |'
        }
    }
};

// Template function with configurable blog type
function generateBlogPost(postData, blogType) {
    try {
        validateBlogPost(postData);
        const config = BLOG_CONFIGS[blogType];
        const collapseId = `patchnotes_${postData.version.replace(/\./g, '_')}`;
        
        return `
        <div class="card text-white bg-dark h-100">
            <div class="card-body p-0">
                <!-- Header Band -->
                <div style="background-color: #1a1a1a; padding: 15px 10px; position: relative; border-radius: 10px 10px 0 0;">
                    <div class="row no-gutters">
                        <div class="col-2 col-sm-1 d-flex align-items-center pe-2" style="position: relative; min-width: 60px;">
                            <img src="${postData.headerImg}" alt="" class="img-fluid" 
                                style="border: 2px solid white; border-radius: 10px; object-fit: cover;
                                    min-width: 50px; min-height: 50px; width: 100%; max-height: 80px;"/>
                        </div>
                        <div class="col-10 col-sm-11 d-flex flex-column justify-content-center">
                            <h3 class="font-weight-light" style="margin-bottom: 10px;">${config.template.headerPrefix} ${postData.type}</h3>
                            <p style="margin-bottom: 15px;"><b>Version ${postData.version}</b> - ${postData.date}</p>
                        </div>
                    </div>
                </div>

                <!-- Content Band -->
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
                            ${postData.downloadUrl ? `
                            <a class="btn btn-outline-light" href="${postData.downloadUrl}" target="_blank">Download</a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="my-5"></div>
        `;
    } catch (error) {
        console.error('Error generating blog post:', error);
        return `<div class="alert alert-danger">Error generating blog post: ${error.message}</div>`;
    }
}

function generateBlogPost(postData, blogType, isGenerator = false) {
    try {
        // Only validate if not in generator mode
        if (!isGenerator) {
            validateBlogPost(postData);
        }
        
        const config = BLOG_CONFIGS[blogType];
        const collapseId = `patchnotes_${postData.version?.replace(/\./g, '_') || 'preview'}`;
        
        return `
        ${isGenerator && !validateBlogPost(postData, true) ? 
        '<div class="alert alert-danger mb-3">Missing required fields</div>' : ''}
        <div class="card text-white bg-dark h-100">
            <div class="card-body p-0">
                <!-- Header Band -->
                <div style="background-color: #1a1a1a; padding: 15px 10px; position: relative; border-radius: 10px 10px 0 0;">
                    <div class="row no-gutters">
                        <div class="col-2 col-sm-1 d-flex align-items-center pe-2" style="position: relative; min-width: 60px;">
                            <img src="${postData.headerImg}" alt="" class="img-fluid" 
                                style="border: 2px solid white; border-radius: 10px; object-fit: cover;
                                    min-width: 50px; min-height: 50px; width: 100%; max-height: 80px;"/>
                        </div>
                        <div class="col-10 col-sm-11 d-flex flex-column justify-content-center">
                            <h3 class="font-weight-light" style="margin-bottom: 10px;">${config.template.headerPrefix} ${postData.type}</h3>
                            <p style="margin-bottom: 15px;"><b>Version ${postData.version}</b> - ${postData.date}</p>
                        </div>
                    </div>
                </div>

                <!-- Content Band -->
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
                            ${postData.downloadUrl ? `
                            <a class="btn btn-outline-light" href="${postData.downloadUrl}" target="_blank">Download</a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="my-5"></div>
        `;
    } catch (error) {
        console.error('Error generating blog post:', error);
        if (isGenerator) {
            return `
            <div class="alert alert-danger mb-3">Error generating blog post: ${error.message}</div>
            <div class="card text-white bg-dark h-100">
                <div class="card-body p-0">
                    <!-- Header Band -->
                    <div style="background-color: #1a1a1a; padding: 15px 10px; position: relative; border-radius: 10px 10px 0 0;">
                        <div class="row no-gutters">
                            <div class="col-2 col-sm-1 d-flex align-items-center pe-2" style="position: relative; min-width: 60px;">
                                <img src="${postData.headerImg}" alt="" class="img-fluid" 
                                    style="border: 2px solid white; border-radius: 10px; object-fit: cover;
                                        min-width: 50px; min-height: 50px; width: 100%; max-height: 80px;"/>
                            </div>
                            <div class="col-10 col-sm-11 d-flex flex-column justify-content-center">
                                <h3 class="font-weight-light" style="margin-bottom: 10px;">${config.template.headerPrefix} ${postData.type}</h3>
                                <p style="margin-bottom: 15px;"><b>Version ${postData.version}</b> - ${postData.date}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Content Band -->
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
                                ${postData.downloadUrl ? `
                                <a class="btn btn-outline-light" href="${postData.downloadUrl}" target="_blank">Download</a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="my-5"></div>
            `;
        }
        return `<div class="alert alert-danger">Error generating blog post: ${error.message}</div>`;
    }
}

function validateBlogPost(postData, returnBoolean = false) {
    const required = ['type', 'version', 'date', 'title', 'author', 'devNotes'];
    for (const field of required) {
        if (!postData[field]) {
            if (returnBoolean) return false;
            throw new Error(`Missing required field: ${field}`);
        }
    }
    if (returnBoolean) return true;
}

// Helper function for generating sections
function generateSections(sections) {
    if (!sections?.length) return '';
    
    return sections.map(section => `
        <hr>
        <h5 style="font-weight: 600;">${section.title}:</h5>
        <dl>
            ${section.changes.map(change => `
                <dt>${change.name}</dt>
                <dd>${change.description}</dd>
            `).join('')}
        </dl>
    `).join('');
}

function generateMedia(postData) {
    if (!postData.mediaUrl && !postData.videoUrl) return '';

    const mediaContent = postData.mediaType === 'video' && postData.videoUrl ? `
        <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="rounded"
            src="${postData.videoUrl}"
            frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
        </iframe>
    ` : `
        <img src="${postData.mediaUrl}" alt="..." class="rounded" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"/>
    `;

    return `
    <div style="position: relative; overflow: hidden; padding-top: 56.25%; margin-bottom: 20px;">
        ${mediaContent}
    </div>
    `;
}

// Blog post loading function with configurable blog type
async function loadBlogPosts(blogType = 'hex') {
    try {
        const config = BLOG_CONFIGS[blogType];
        if (!config) {
            throw new Error(`Invalid blog type: ${blogType}`);
        }

        const response = await fetch(config.jsonPath);
        const data = await response.json();

        // Filter out hidden posts
        const visiblePosts = data.posts.filter(post => !post.hidden);
        
        visiblePosts.forEach(postData => {
            const blogPostHTML = generateBlogPost(postData, blogType);
            document.querySelector('#blog-posts-container')
                .insertAdjacentHTML('beforeend', blogPostHTML);
        });

        // Initialize collapse buttons after posts are loaded
        initializeCollapseButtons();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.querySelector('#blog-posts-container').innerHTML = 
            '<div class="alert alert-danger">Error loading blog posts: ${error.message}</div>';
    }
}

async function loadRecentNews() {
    try {
        const response = await fetch(BLOG_CONFIGS.hex.jsonPath);
        const data = await response.json();
        
        // Get most recent non-hidden post
        const recentPost = data.posts.filter(post => !post.hidden)[0];
        if (!recentPost) return;

        const newsHTML = `
            <div class="row g-4">
                <div class="col-12 col-lg-5">
                    <div class="text-white">
                        <h3 class="font-weight-light">${recentPost.title} | ${recentPost.type}</h3>
                        <p class="text-light mb-2" style="font-size: 0.9rem;">
                            <b>Version ${recentPost.version}</b> - ${recentPost.date}
                        </p>
                        <p style="font-size: 1.1rem;">
                            ${recentPost.devNotes} - ${recentPost.author}
                        </p>
                        <a class="btn btn-outline-light px-4" 
                            href="blog_hex.html"
                            style="border-radius: 20px;">Learn More</a>
                    </div>
                </div>
                
                <div class="col-12 col-lg-7">
                    ${generateMedia(recentPost)}
                </div>
            </div>
        `;

        document.querySelector('#recent-news-container')
            .insertAdjacentHTML('beforeend', newsHTML);
    } catch (error) {
        console.error('Error loading recent news:', error);
        document.querySelector('#recent-news-container').innerHTML = 
            '<div class="alert alert-danger">Error loading recent news</div>';
    }
}

// Initialize based on data attribute in the container
document.addEventListener('DOMContentLoaded', () => {
    const blogContainer = document.querySelector('#blog-posts-container');
    if (blogContainer) {
        const blogType = blogContainer.dataset.blogType || 'hex';
        loadBlogPosts(blogType);
    }
    
    const newsContainer = document.querySelector('#recent-news-container');
    if (newsContainer) {
        loadRecentNews();
    }
});