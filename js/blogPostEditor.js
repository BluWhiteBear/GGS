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
    `;
    notification.textContent = 'Path copied to clipboard!';
    document.body.appendChild(notification);

    // Position handler considering bounds
    const updatePosition = (e) => {
        const imagePreview = document.getElementById('image-preview');
        const isPreviewVisible = imagePreview.style.display !== 'none';
        
        // Get cursor position
        let x = e.clientX + 20;
        let y = e.clientY + 20;

        // Adjust for preview if visible
        if (isPreviewVisible) {
            const previewRect = imagePreview.getBoundingClientRect();
            y = previewRect.bottom + 10;
        }

        // Set position immediately
        notification.style.left = `${x}px`;
        notification.style.top = `${y}px`;
    };

    // Copy to clipboard and show notification
    navigator.clipboard.writeText(fullPath)
        .then(() => {
            // Initial position from click event
            updatePosition(event);
            
            // Show notification after position is set
            notification.style.opacity = '1';
            
            // Start tracking mouse movement
            document.addEventListener('mousemove', updatePosition);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                    document.removeEventListener('mousemove', updatePosition);
                }, 300);
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy path to clipboard:', err);
            document.body.removeChild(notification);
            document.removeEventListener('mousemove', updatePosition);
            alert('Failed to copy path to clipboard');
        });
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
        // Existing file browser initialization
        const structure = await buildAssetStructure();
        if (structure) {
            document.getElementById('file-browser').innerHTML = buildFileBrowser(structure);
            initializeFileBrowserCollapses();
            initializeImagePreviews();
            initializeFileLinks();
        } else {
            document.getElementById('file-browser').innerHTML = 
                '<div class="alert alert-danger">Error loading assets</div>';
        }

        // Initialize JSON textarea
        const outputJson = document.getElementById('outputJson');
        if (outputJson) {
            outputJson.removeAttribute('readonly');
            outputJson.addEventListener('input', debounce(updateFormFromJson, 500));
        }

        // Initialize blog post generator
        if (typeof generateBlogPost !== 'function') {
            console.error('generateBlogPost function not found');
            document.getElementById('preview-container').innerHTML = 
                '<div class="alert alert-danger">Error: Blog post generator not initialized</div>';
        }
        
        updatePreview();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
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

        const previewHTML = generateBlogPost(blogPost, document.getElementById('blogType').value, true);
        document.getElementById('preview-container').innerHTML = previewHTML;
        document.getElementById('outputJson').value = JSON.stringify(blogPost, null, 4);
        initializePreviewCollapseButtons();
    } catch (error) {
        console.error('Preview generation error:', error);
        document.getElementById('preview-container').innerHTML = 
            `<div class="alert alert-danger">Error generating preview: ${error.message}</div>`;
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