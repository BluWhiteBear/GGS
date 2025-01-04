const debouncedUpdatePreview = debounce(updatePreview, 300);

async function buildAssetStructure() {
    // Fetch asset structure from server
    const response = await fetch('js/data/imageDirectory.json');
    if (!response.ok) {
        throw new Error(`Failed to load asset structure: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

function buildFileBrowser(structure, parentPath = '') {
    // Helper function to sanitize IDs for CSS selectors
    const sanitizeId = (str) => str.replace(/[^a-zA-Z0-9-_]/g, '_');

    let html = '<ul class="nav flex-column">';
    
    // Handle the root level files first if they exist
    if (structure.assets?.img?.root?.files) {
        const rootId = 'collapse_root';
        html += '<li class="nav-item">';
        html += `<a class="nav-link text-white d-flex justify-content-between align-items-center" 
                    data-bs-toggle="collapse" 
                    href="#${rootId}" 
                    role="button" 
                    aria-expanded="false">
                    <span><i class="fas fa-folder me-2"></i>Root</span>
                    <i class="fas fa-chevron-down"></i>
                </a>`;
        html += `<div class="collapse" id="${rootId}"><ul class="nav flex-column">`;
        structure.assets.img.root.files.forEach(file => {
            // Don't include special characters in IDs
            const safeId = sanitizeId(file);
            html += `<li class="nav-item">
                <a class="nav-link text-white small py-1" href="#" 
                    id="file_${safeId}"
                    data-file-path="${file}"
                    data-preview-path="assets/img/${file}">
                    <i class="fas fa-file-image me-2"></i>${file}
                </a>
            </li>`;
        });
        html += '</ul></div></li>';
    }

    // Handle subfolders
    Object.entries(structure.assets?.img || {}).forEach(([folder, content]) => {
        if (folder === 'root') return; // Skip root as it's already handled

        // Sanitize folder ID to create valid CSS selector
        const folderId = `collapse_${sanitizeId(folder)}_${Math.random().toString(36).substr(2, 9)}`;
        html += '<li class="nav-item">';
        html += `<a class="nav-link text-white d-flex justify-content-between align-items-center" 
                    data-bs-toggle="collapse" 
                    href="#${folderId}" 
                    role="button" 
                    aria-expanded="false">
                    <span><i class="fas fa-folder me-2"></i>${folder}</span>
                    <i class="fas fa-chevron-down"></i>
                </a>`;
        
        html += `<div class="collapse" id="${folderId}"><ul class="nav flex-column">`;
        content.files.forEach(file => {
            html += `<li class="nav-item">
                <a class="nav-link text-white small py-1" href="#" 
                    data-file-path="${folder}/${file}"
                    data-preview-path="assets/img/${folder}/${file}">
                    <i class="fas fa-file-image me-2"></i>${file}
                </a>
            </li>`;
        });
        html += '</ul></div></li>';
    });
    
    html += '</ul>';
    return html;
}

// Add this new function to initialize preview handlers
function initializeImagePreviews() {
    const preview = document.getElementById('image-preview');
    
    document.querySelectorAll('[data-preview-path]').forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            // Get path from current target instead of target to handle child elements
            const path = e.currentTarget.getAttribute('data-preview-path');
            // Add assets/ prefix if not present
            const fullPath = path.startsWith('assets/') ? path : `assets/${path}`;
            preview.innerHTML = `<img src="${fullPath}" alt="Preview">`;
            preview.style.display = 'block';
            
            const x = e.clientX + 20;
            const y = e.clientY + 20;
            preview.style.left = `${x}px`;
            preview.style.top = `${y}px`;
        });

        // Update mousemove handler
        link.addEventListener('mousemove', (e) => {
            const x = e.clientX + 20;
            const y = e.clientY + 20;
            preview.style.left = `${x}px`;
            preview.style.top = `${y}px`;
        });

        link.addEventListener('mouseleave', () => {
            preview.style.display = 'none';
        });
    });
}

function initializeFileBrowserCollapses() {
    const collapseElements = document.querySelectorAll('[data-bs-toggle="collapse"]');
    
    collapseElements.forEach(button => {
        const targetId = button.getAttribute('href') || button.getAttribute('data-bs-target');
        const target = document.querySelector(targetId);
        
        if (target) {
            const bsCollapse = new bootstrap.Collapse(target, {
                toggle: false
            });

            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                bsCollapse.toggle();
            });

            target.addEventListener('show.bs.collapse', () => {
                button.setAttribute('aria-expanded', 'true');
                const folderIcon = button.querySelector('.fa-folder');
                const chevronIcon = button.querySelector('.fa-chevron-down');
                if (folderIcon) {
                    folderIcon.style.transform = 'rotate(90deg)';
                }
                if (chevronIcon) {
                    chevronIcon.style.transform = 'rotate(180deg)';
                }
            });

            target.addEventListener('hide.bs.collapse', () => {
                button.setAttribute('aria-expanded', 'false');
                const folderIcon = button.querySelector('.fa-folder');
                const chevronIcon = button.querySelector('.fa-chevron-down');
                if (folderIcon) {
                    folderIcon.style.transform = 'rotate(0deg)';
                }
                if (chevronIcon) {
                    chevronIcon.style.transform = 'rotate(0deg)';
                }
            });
        }
    });
}

// Override initializePreviewCollapseButtons for blog post preview
function initializePreviewCollapseButtons() {
    document.querySelectorAll('#preview-container [data-bs-toggle="collapse"]').forEach(button => {
        const target = document.querySelector(button.getAttribute('data-bs-target'));
        if (!target) return;
        
        // Create new collapse instance without text change behavior
        const collapse = new bootstrap.Collapse(target, {
            toggle: false
        });
    });
}

function selectFile(path, event) {
    const fullPath = path.startsWith('assets/') ? path : `assets/img/${path}`;
    
    // Copy to clipboard and show notification
    navigator.clipboard.writeText(fullPath)
        .then(() => {
            showCopyNotification('Path copied to clipboard!', event);
        })
        .catch(err => {
            console.error('Failed to copy path to clipboard:', err);
            alert('Failed to copy path to clipboard');
        });
}

function showCopyNotification(message, event) {
    // Create notification with initial hidden state
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        background: rgba(40, 167, 69, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 999;
        transition: opacity 0.3s ease;
        pointer-events: none;
        opacity: 0;
        z-index: 1000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Position handler considering bounds
    const updatePosition = (e) => {
        let x = e.clientX + 20;
        let y = e.clientY + 20;

        // Ensure notification stays within viewport
        const notificationRect = notification.getBoundingClientRect();
        if (x + notificationRect.width > window.innerWidth) {
            x = window.innerWidth - notificationRect.width - 20;
        }
        if (y + notificationRect.height > window.innerHeight) {
            y = window.innerHeight - notificationRect.height - 20;
        }

        notification.style.left = `${x}px`;
        notification.style.top = `${y}px`;
    };

    // Initial position from event
    updatePosition(event);
    
    // Show notification
    notification.style.opacity = '1';
    
    // Track mouse movement
    document.addEventListener('mousemove', updatePosition);
    
    // Hide and cleanup after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.removeEventListener('mousemove', updatePosition);
        }, 300);
    }, 2000);
}

function initializeFileLinks() {
    document.querySelectorAll('[data-file-path]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = e.currentTarget.getAttribute('data-file-path');
            selectFile(path, e);
        });
    });
}

function updateFormFromJson() {
    try {
        const jsonData = JSON.parse(document.getElementById('outputJson').value);
        
        // Update basic info fields
        document.getElementById('blogType').value = jsonData.blogType || 'hex';
        document.getElementById('headerImg').value = jsonData.headerImg || '';
        document.getElementById('type').value = jsonData.type || '';
        document.getElementById('version').value = jsonData.version || '';
        document.getElementById('date').value = jsonData.date || '';
        document.getElementById('title').value = jsonData.title || '';
        document.getElementById('author').value = jsonData.author || '';
        document.getElementById('devNotes').value = jsonData.devNotes || '';
        
        // Update media fields
        document.getElementById('mediaUrl').value = jsonData.mediaUrl || '';
        document.getElementById('videoUrl').value = jsonData.videoUrl || '';
        document.getElementById('mediaType').value = jsonData.mediaType || 'image';
        document.getElementById('downloadUrl').value = jsonData.downloadUrl || '';
        
        // Clear existing sections
        const sectionsContainer = document.getElementById('sectionsContainer');
        sectionsContainer.innerHTML = '<h3>Sections</h3>';
        
        // Add sections from JSON
        jsonData.sections?.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'section-container';
            sectionElement.innerHTML = `
                <div class="form-group">
                    <label>Section Title</label>
                    <input type="text" class="form-control section-title" value="${section.title || ''}" onchange="updatePreview()">
                </div>
                <div class="changes-container"></div>
                <button class="btn btn-outline-light btn-sm mb-2" onclick="addChange(this)">Add Change</button>
                <button class="btn btn-outline-danger btn-sm" onclick="removeSection(this)">Remove Section</button>
            `;
            
            sectionsContainer.appendChild(sectionElement);
            
            // Add changes to this section
            const changesContainer = sectionElement.querySelector('.changes-container');
            section.changes?.forEach(change => {
                const changeElement = document.createElement('div');
                changeElement.className = 'change-container';
                changeElement.innerHTML = `
                    <div class="form-group">
                        <label>Change Name</label>
                        <input type="text" class="form-control change-name" value="${change.name || ''}" onchange="updatePreview()">
                    </div>
                    <div class="form-group">
                        <label>Change Description</label>
                        <textarea class="form-control change-description" rows="2" onchange="updatePreview()">${change.description || ''}</textarea>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removeChange(this)">Remove Change</button>
                `;
                changesContainer.appendChild(changeElement);
            });
        });
        
        // Update preview
        updatePreview();
    } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Invalid JSON format');
    }
}

// Add event listener for JSON changes
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const structure = await buildAssetStructure();
        const fileBrowser = document.getElementById('file-browser');
        if (fileBrowser) {
            fileBrowser.innerHTML = buildFileBrowser(structure);
            initializeFileLinks();
            initializeFileBrowserCollapses();
            initializeImagePreviews();
        }
    } catch (error) {
        console.error('Error initializing file browser:', error);
    }

    const jsonOutput = document.getElementById('outputJson');
    if (jsonOutput) {
        jsonOutput.addEventListener('input', function() {
            try {
                // Attempt to parse JSON to validate it
                JSON.parse(this.value);
                // If valid, update the form
                updateFormFromJson();
            } catch (error) {
                // Invalid JSON - don't update form
                console.error('Invalid JSON:', error);
            }
        });
    }

    // Initialize preview immediately
    updatePreview();
    
    // Add change listeners to all form inputs with debouncing
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', debouncedUpdatePreview);
        input.addEventListener('change', debouncedUpdatePreview);
    });
    
    // Handle section and change additions/removals
    const originalAddSection = window.addSection;
    window.addSection = function() {
        originalAddSection();
        debouncedUpdatePreview();
    };
    
    const originalRemoveSection = window.removeSection;
    window.removeSection = function(button) {
        originalRemoveSection(button);
        debouncedUpdatePreview();
    };
    
    const originalAddChange = window.addChange;
    window.addChange = function(button) {
        originalAddChange(button);
        debouncedUpdatePreview();
    };
    
    const originalRemoveChange = window.removeChange;
    window.removeChange = function(button) {
        originalRemoveChange(button);
        debouncedUpdatePreview();
    };
});

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


function addSection() {
    const container = document.createElement('div');
    container.className = 'section-container';
    
    container.innerHTML = `
    <div class="form-group">
        <label>Section Title</label>
        <input type="text" class="form-control section-title" onchange="updatePreview()">
    </div>
    <div class="changes-container"></div>
    <div class="d-flex gap-2">
        <button class="btn btn-outline-light btn-sm" onclick="addChange(this)">Add Change</button>
        <button class="btn btn-outline-danger btn-sm" onclick="removeSection(this)">Remove Section</button>
    </div>
`;
    
    document.getElementById('sectionsContainer').appendChild(container);
    updatePreview();
}

function removeSection(button) {
    button.parentElement.remove();
    updatePreview();
}

function addChange(button) {
    const container = document.createElement('div');
    container.className = 'change-container';
    
    container.innerHTML = `
        <div class="form-group">
            <label>Change Name</label>
            <input type="text" class="form-control change-name" onchange="updatePreview()">
        </div>
        <div class="form-group">
            <label>Change Description</label>
            <textarea class="form-control change-description" rows="2" onchange="updatePreview()"></textarea>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeChange(this)">Remove Change</button>
    `;
    
    button.previousElementSibling.appendChild(container);
    updatePreview();
}

function removeChange(button) {
    button.parentElement.remove();
    updatePreview();
}

function updatePreview() {
    try {
        const blogPost = {
            headerImg: document.getElementById('headerImg').value,
            type: document.getElementById('type').value,
            version: document.getElementById('version').value,
            date: document.getElementById('date').value,
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            hidden: false,
            devNotes: document.getElementById('devNotes').value,
            sections: [],
            mediaUrl: document.getElementById('mediaUrl').value,
            videoUrl: document.getElementById('videoUrl').value,
            mediaType: document.getElementById('mediaType').value,
            downloadUrl: document.getElementById('downloadUrl').value
        };

        // Get sections data
        document.querySelectorAll('.section-container').forEach(section => {
            const sectionData = {
                title: section.querySelector('.section-title').value,
                changes: []
            };
            
            section.querySelectorAll('.change-container').forEach(change => {
                sectionData.changes.push({
                    name: change.querySelector('.change-name').value,
                    description: change.querySelector('.change-description').value
                });
            });
            
            blogPost.sections.push(sectionData);
        });

        // Validate the blog post data
        const isValid = validateBlogPost(blogPost, true);
        
        // Update preview and JSON output
        const previewHTML = generateBlogPost(blogPost, document.getElementById('blogType').value, true);
        document.getElementById('preview-container').innerHTML = previewHTML;
        document.getElementById('outputJson').value = JSON.stringify(blogPost, null, 4);
        initializePreviewCollapseButtons();

        // Show/hide action buttons based on JSON validity
        document.getElementById('downloadJsonBtn').style.display = isValid ? 'block' : 'none';
        document.getElementById('copyJsonBtn').style.display = isValid ? 'block' : 'none';
    } catch (error) {
        console.error('Preview generation error:', error);
        document.getElementById('preview-container').innerHTML = 
            `<div class="alert alert-danger">Error generating preview: ${error.message}</div>`;
        
        // Hide action buttons if JSON is invalid
        document.getElementById('downloadJsonBtn').style.display = 'none';
        document.getElementById('copyJsonBtn').style.display = 'none';
    }
}

function generateJson() {
    try {
        // Get blog post data
        const blogPost = {
            headerImg: document.getElementById('headerImg').value,
            type: document.getElementById('type').value,
            version: document.getElementById('version').value,
            date: document.getElementById('date').value,
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            hidden: false,
            devNotes: document.getElementById('devNotes').value,
            sections: [],
            mediaUrl: document.getElementById('mediaUrl').value,
            videoUrl: document.getElementById('videoUrl').value,
            mediaType: document.getElementById('mediaType').value,
            downloadUrl: document.getElementById('downloadUrl').value
        };

        // Get sections data 
        document.querySelectorAll('.section-container').forEach(section => {
            const sectionData = {
                title: section.querySelector('.section-title').value,
                changes: []
            };
            
            section.querySelectorAll('.change-container').forEach(change => {
                sectionData.changes.push({
                    name: change.querySelector('.change-name').value,
                    description: change.querySelector('.change-description').value
                });
            });
            
            blogPost.sections.push(sectionData);
        });

        // Create and download JSON file
        const blogType = document.getElementById('blogType').value;
        const fileName = `blogPost_${blogType}_${blogPost.version}.json`;
        const jsonString = JSON.stringify(blogPost, null, 4);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating JSON:', error);
        alert('Error generating JSON: ' + error.message);
    }
}

async function copyFullJson() {
    try {
        // Get current blog post data
        const currentPost = {
            headerImg: document.getElementById('headerImg').value,
            type: document.getElementById('type').value,
            version: document.getElementById('version').value,
            date: document.getElementById('date').value,
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            hidden: false,
            devNotes: document.getElementById('devNotes').value,
            sections: [],
            mediaUrl: document.getElementById('mediaUrl').value,
            videoUrl: document.getElementById('videoUrl').value,
            mediaType: document.getElementById('mediaType').value,
            downloadUrl: document.getElementById('downloadUrl').value
        };

        // Get sections data
        document.querySelectorAll('.section-container').forEach(section => {
            const sectionData = {
                title: section.querySelector('.section-title').value,
                changes: []
            };
            
            section.querySelectorAll('.change-container').forEach(change => {
                sectionData.changes.push({
                    name: change.querySelector('.change-name').value,
                    description: change.querySelector('.change-description').value
                });
            });
            
            currentPost.sections.push(sectionData);
        });

        // Get existing posts
        const blogType = document.getElementById('blogType').value;
        const response = await fetch(BLOG_CONFIGS[blogType].jsonPath);
        const existingData = await response.json();
        
        // Check if we're updating an existing post or adding a new one
        const selectedOption = document.getElementById('existingPosts').selectedOptions[0];
        if (selectedOption?.value) {
            // Update existing post
            const index = existingData.posts.findIndex(post => post.version === currentPost.version);
            if (index !== -1) {
                existingData.posts[index] = currentPost;
            }
        } else {
            // Add new post to top
            existingData.posts.unshift(currentPost);
        }

        // Try to copy using the clipboard API
        try {
            const jsonString = JSON.stringify(existingData, null, 4);
            await navigator.clipboard.writeText(jsonString);
            const defaultPosition = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
            showCopyNotification('Updated JSON copied to clipboard!', event || defaultPosition);
        } catch (clipboardError) {
            // Fallback to execCommand
            const textarea = document.createElement('textarea');
            textarea.value = jsonString;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                const defaultPosition = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
                showCopyNotification('Updated JSON copied to clipboard!', event || defaultPosition);
            } catch (execError) {
                console.error('All clipboard operations failed:', execError);
                alert('Could not copy to clipboard - please check the console for the updated JSON');
                console.log('Updated JSON:', jsonString);
            } finally {
                document.body.removeChild(textarea);
            }
        }
    } catch (error) {
        console.error('Error generating full JSON:', error);
        alert('Error generating full JSON: ' + error.message);
    }
}

async function downloadFullJson() {
    try {
        // Get current blog post data
        const currentPost = {
            headerImg: document.getElementById('headerImg').value,
            type: document.getElementById('type').value,
            version: document.getElementById('version').value,
            date: document.getElementById('date').value,
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            hidden: false,
            devNotes: document.getElementById('devNotes').value,
            sections: [],
            mediaUrl: document.getElementById('mediaUrl').value,
            videoUrl: document.getElementById('videoUrl').value,
            mediaType: document.getElementById('mediaType').value,
            downloadUrl: document.getElementById('downloadUrl').value
        };

        // Get sections data
        document.querySelectorAll('.section-container').forEach(section => {
            const sectionData = {
                title: section.querySelector('.section-title').value,
                changes: []
            };
            
            section.querySelectorAll('.change-container').forEach(change => {
                sectionData.changes.push({
                    name: change.querySelector('.change-name').value,
                    description: change.querySelector('.change-description').value
                });
            });
            
            currentPost.sections.push(sectionData);
        });

        // Get existing posts
        const blogType = document.getElementById('blogType').value;
        const response = await fetch(BLOG_CONFIGS[blogType].jsonPath);
        const existingData = await response.json();
        
        // Check if we're updating an existing post or adding a new one
        const selectedOption = document.getElementById('existingPosts').selectedOptions[0];
        if (selectedOption?.value) {
            // Update existing post
            const index = existingData.posts.findIndex(post => post.version === currentPost.version);
            if (index !== -1) {
                existingData.posts[index] = currentPost;
            }
        } else {
            // Add new post to top
            existingData.posts.unshift(currentPost);
        }

        // Download full JSON
        const fileName = `blogPosts_${blogType}.json`;
        const jsonString = JSON.stringify(existingData, null, 4);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating full JSON:', error);
        alert('Error generating full JSON: ' + error.message);
    }
}

async function deleteSelectedPost(event) {  // Add event parameter
    const select = document.getElementById('existingPosts');
    const selectedOption = select.selectedOptions[0];
    
    if (!selectedOption?.value) {
        alert('Please select a post to delete');
        return;
    }

    try {
        const blogType = document.getElementById('blogType').value;
        const response = await fetch(BLOG_CONFIGS[blogType].jsonPath);
        const existingData = await response.json();
        
        const currentPost = JSON.parse(selectedOption.dataset.json);
        existingData.posts = existingData.posts.filter(post => 
            !(post.version === currentPost.version && 
              post.title === currentPost.title && 
              post.date === currentPost.date)
        );

        const jsonString = JSON.stringify(existingData, null, 4);

        // Try to copy using the clipboard API first
        try {
            await navigator.clipboard.writeText(jsonString);
            // Use a default position if no event is provided
            const defaultPosition = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
            showCopyNotification('Updated JSON copied to clipboard!', event || defaultPosition);
        } catch (clipboardError) {
            // Fallback to execCommand
            const textarea = document.createElement('textarea');
            textarea.value = jsonString;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                const defaultPosition = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
                showCopyNotification('Updated JSON copied to clipboard!', event || defaultPosition);
            } catch (execError) {
                console.error('All clipboard operations failed:', execError);
                alert('Could not copy to clipboard - please check the console for the updated JSON');
                console.log('Updated JSON:', jsonString);
            } finally {
                document.body.removeChild(textarea);
            }
        }

        clearPostSelection();
        await populateExistingPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post: ' + error.message);
    }
}

// Add event listeners to all form inputs
document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', updatePreview);
});

// Modify existing functions to trigger preview update
const originalAddChange = addChange;
addChange = function(button) {
    originalAddChange(button);
    updatePreview();
}