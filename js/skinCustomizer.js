// 3D Model Rendering and Interaction for Skin Customizer
document.addEventListener('DOMContentLoaded', function() {
    // Make sure the model container exists
    const container = document.getElementById('model-container');
    if (!container) {
        console.error('Could not find model-container element');
        return;
    }
    
    // Gradient texture overlay
    let gradientTexture = new Image();
    gradientTexture.src = 'assets/textures/player_colors_gradient.png';
    let gradientTextureLoaded = false;
    
    gradientTexture.onload = function() {
        gradientTextureLoaded = true;
        updateTexturePreview(); // Update the preview once the gradient is loaded
    };
    
    gradientTexture.onerror = function() {
        console.error('Failed to load gradient overlay texture');
    };
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
      // Camera setup
    const camera = new THREE.PerspectiveCamera(
        45,                                                // Field of view
        container.clientWidth / container.clientHeight,    // Aspect ratio
        0.1,                                               // Near clipping plane (not too small to avoid z-fighting)
        2000                                               // Far clipping plane (increased for better visibility)
    );camera.position.set(-50, 100, 200);
    camera.lookAt(0, 20, 0); // Match initial lookAt with the orbit target    // Renderer setup with enhanced settings for better outline visibility
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        logarithmicDepthBuffer: true  // Better depth handling
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.sortObjects = true;  // Force sorting of transparent objects
    renderer.autoClear = true;    // Clear buffer before rendering
    container.appendChild(renderer.domElement);
    console.log("Renderer configured with special settings for outline visibility");      // We'll use a post-processing outline effect
    // No need to track outline meshes separately// Model position variables
    let modelBaseY = 0;        // Base Y position before adjustment
    const modelHeightOffset = -41.5; // Fixed height adjustment based on testing
    
    // Camera target for orbit controls
    const orbitTarget = new THREE.Vector3(0, 20, 0); // Adjustable orbit center (x, y, z)
    
    // Orbit controls for camera
    let controls;    try {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true; // Enable screen space panning for better control
        controls.minDistance = 10;
        controls.maxDistance = 70;
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.DOLLY // This is typically zoom
        };
        
        // Prevent mouse events from propagating to the page
        renderer.domElement.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, false);
        
        // Prevent touch events from scrolling the page
        renderer.domElement.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Prevent page scrolling when using mouse wheel inside the renderer
        renderer.domElement.addEventListener('wheel', function(e) {
            if (controls.enabled) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Add focus handling to enable/disable controls when entering/leaving the canvas
        renderer.domElement.addEventListener('mouseenter', function() {
            controls.enabled = true;
        });
        
        renderer.domElement.addEventListener('mouseleave', function() {
            controls.enabled = false;
        });
        
        controls.target.copy(orbitTarget); // Set the orbit center to our configurable target
        controls.update();
    } catch (e) {
        console.error('Failed to initialize OrbitControls:', e);
    }
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, .4);
    directionalLight.position.set(0, 1, 0.5);
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemisphereLight);
    
    // Create a grid for reference
    const gridHelper = new THREE.GridHelper(100, 10, 0x888888, 0x444444);
    scene.add(gridHelper);
    
    // Load FBX model
    let model; // Reference to store the loaded model
    
    try {
        const loader = new THREE.FBXLoader();
        loader.load(
        'assets/models/Armor_New_Mesh.fbx',  // Path to your FBX model
        function(object) {
            // Success callback
            model = object;
              // Store original materials and prepare for texture application
            model.traverse(function(child) {
                if (child.isMesh) {
                    // Store original material type for reference
                    child.originalMaterial = child.material.type || 'MeshPhongMaterial';
                    
                    // Check for UV coordinates
                    if (!child.geometry.attributes.uv) {
                        console.warn('Mesh does not have UV coordinates');
                        // If BufferGeometryUtils is available, try to compute UVs
                        if (THREE.BufferGeometryUtils && THREE.BufferGeometryUtils.computeUVs) {
                            try {
                                THREE.BufferGeometryUtils.computeUVs(child.geometry);
                                console.log('Generated default UVs for mesh');
                            } catch (e) {
                                console.error('Failed to compute UVs:', e);
                            }
                        }
                    }
                    
                    // Make sure material can accept our texture
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x7a7a7a,
                        shininess: 30,
                        specular: 0x111111
                    });
                }
            });
            
            // Apply our custom texture
            updateMaterial();
            
            // Scale to reasonable size (60% of the original scaled size)
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
              // Scale to reasonable size (60% of the original scaled size)
            const maxDim = Math.max(size.x, size.y, size.z);
            const baseFactor = 100 / maxDim;
            const scaleFactor = baseFactor * 0.45; // Apply 60% scaling
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            // Recompute bounding box after scaling
            model.updateMatrixWorld(true);
            const scaledBox = new THREE.Box3().setFromObject(model);
            
            // Position the model directly on the grid
            model.position.x = 0;
            modelBaseY = -scaledBox.min.y;  // Store base Y position
            updateModelPosition();          // Apply position with any offset
            model.position.z = 0;
            
            // Create a bounding sphere for the model to ensure it stays visible
            const boundingSphere = new THREE.Sphere();
            scaledBox.getBoundingSphere(boundingSphere);            // First, just set frustum culling to false
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.frustumCulled = false;
                }
            });            // FIXED: Geometric outline approach using inverted hull with proper positioning
            console.log("Setting up geometric outline using inverted hull with corrected positioning");
            
            // Create a container to hold all outline meshes
            const outlineGroup = new THREE.Group();
            // Add the outline group to the scene at the same level as the main model
            scene.add(outlineGroup);
            
            // Array to store outline mesh parts
            const outlineMeshes = [];
            
            // Create a single combined outline mesh for the entire model
            // Create a buffer to hold all the geometry
            let combinedGeometry = new THREE.BufferGeometry();
            let meshIndex = 0;
            let totalVertices = 0;
            
            // First pass - count vertices to allocate buffer
            model.traverse(function(child) {
                if (child.isMesh) {
                    totalVertices += child.geometry.attributes.position.count;
                    meshIndex++;
                }
            });
            
            console.log(`Found ${meshIndex} meshes with ${totalVertices} total vertices`);
            
            // Create outline material
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,  // Pure black outline
                side: THREE.BackSide,
                depthTest: true,
                transparent: false,
                opacity: 1.0
            });
            
            // Clone the entire model to create the outline
            const outlineModel = model.clone();
            
            // Process the outline model
            outlineModel.traverse(function(child) {
                if (child.isMesh) {
                    // Apply outline material
                    child.material = outlineMaterial;
                    
                    // Add to our outline mesh list
                    outlineMeshes.push(child);
                    
                    console.log(`Created outline mesh for ${child.name || 'unnamed mesh'}`);
                }
            });
            
            // Scale the outline model slightly larger
            const outlineScale = 1.03; // 3% larger than original
            outlineModel.scale.multiplyScalar(outlineScale);
            
            // Set render order to ensure outline renders behind the model
            outlineModel.renderOrder = 0;
            outlineModel.traverse(function(child) {
                if (child.isMesh) {
                    child.renderOrder = 0;
                }
            });
            
            // Add outline model to the scene
            scene.add(outlineModel);
            
            console.log(`Created outline model with scale ${outlineScale}`);
            
            // Store reference to outline model
            window.outlineModel = outlineModel;
              // Configure the outline pass with stronger parameters            // Store reference to outline model for later access
            window.outlineEffect = {
                model: outlineModel,
                meshes: outlineMeshes,
                scale: 1.03, // Default outline scale
                color: 0x000000, // Default outline color (black)
                visible: true, // Whether outlines are visible
                baseScale: model.scale.clone() // Store the base model scale for reference
            };
            
            console.log("Geometric outline configured with parameters:");
            console.log(`- Outline meshes count: ${outlineMeshes.length}`);
            console.log(`- Original model position:`, model.position);
            console.log(`- Outline model position:`, outlineModel.position);
            console.log(`- Outline scale: ${window.outlineEffect.scale}`);
            console.log(`- Outline color: #${window.outlineEffect.color.toString(16).padStart(6, '0')}`);
            
            // Set model render order to ensure it renders after outline
            model.renderOrder = 1;
            model.traverse(child => {
                if (child.isMesh) {
                    child.renderOrder = 1;
                }
            });
            
            // Function to toggle outline visibility
            window.toggleOutline = function(visible) {
                if (window.outlineEffect && window.outlineEffect.model) {
                    window.outlineEffect.visible = visible !== undefined ? visible : !window.outlineEffect.visible;
                    window.outlineEffect.model.visible = window.outlineEffect.visible;
                    console.log(`Outline visibility set to: ${window.outlineEffect.visible}`);
                }
            };
            
            // Function to change outline color
            window.setOutlineColor = function(colorHex) {
                if (window.outlineEffect && window.outlineEffect.model) {
                    window.outlineEffect.color = colorHex;
                    window.outlineEffect.model.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.color.set(colorHex);
                        }
                    });
                    console.log(`Outline color set to: #${colorHex.toString(16).padStart(6, '0')}`);
                }
            };
            
            // Function to change outline thickness
            window.setOutlineThickness = function(scale) {
                if (window.outlineEffect && window.outlineEffect.model) {
                    // Store the new scale value
                    window.outlineEffect.scale = scale;
                    
                    // Reset to model scale
                    const baseScale = model.scale.clone();
                    
                    // Apply the new scale to the outline model
                    window.outlineEffect.model.scale.copy(baseScale);
                    window.outlineEffect.model.scale.multiplyScalar(scale);
                    
                    console.log(`Outline thickness set to: ${scale}`);
                    console.log(`- Model scale:`, model.scale);
                    console.log(`- Outline model scale:`, window.outlineEffect.model.scale);
                }
            };
              model.traverse(child => {
                if (child.isMesh) {
                    child.renderOrder = 1;
                }
            });
            
            // Add model to scene (outlinePass already configured to work with it)
            scene.add(model);
            
            // Remove loading spinner
            const loadingSpinner = document.querySelector('.loading-spinner');
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        },
        function(xhr) {
            // Progress callback
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function(error) {
            // Error callback
            console.error('An error happened during model loading:', error);
            
            // Remove loading spinner and display error
            const loadingSpinner = document.querySelector('.loading-spinner');            
            if (loadingSpinner) {
                loadingSpinner.innerHTML = '<div class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error loading model. Please try refreshing.</div>';
            }
        }
    );
    } catch (e) {
        console.error('Failed to initialize FBXLoader:', e);
        alert('There was a problem loading the 3D model. Check the console for details.');
    }    // Function to update model position with fixed height offset
    function updateModelPosition() {
        if (!model) return;
        
        // Update main model position
        model.position.y = modelBaseY + modelHeightOffset;
        
        // If we have an outline model, update its position too
        if (window.outlineEffect && window.outlineEffect.model) {
            window.outlineEffect.model.position.copy(model.position);
            console.log("Updated outline model position to match main model:", model.position.y);
        }
    }// Handle window resize
    function onWindowResize() {
        // Get the current dimensions of the container
        const width = container.clientWidth;
        const height = container.clientHeight;
          // Update camera aspect ratio
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        // Resize renderer
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
          // No need to resize anything for our geometric outline approach
    }
      window.addEventListener('resize', onWindowResize);
    
    // Prevent page scrolling when using mouse wheel inside the renderer
    renderer.domElement.addEventListener('wheel', function(e) {
        if (controls.enabled) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Add focus handling to enable/disable controls when entering/leaving the canvas
    renderer.domElement.addEventListener('mouseenter', function() {
        controls.enabled = true;
    });
    
    renderer.domElement.addEventListener('mouseleave', function() {
        controls.enabled = false;
    });
    
    // Initially enable controls
    controls.enabled = true;    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (controls) {
            controls.update(); // Update controls
        }          // Make sure the model and outlines are properly updated
        if (model) {
            // Force update matrix to ensure correct position
            model.updateMatrixWorld(true);
            
            // Ensure outline model follows the main model
            if (window.outlineEffect && window.outlineEffect.model) {
                // Copy position from main model to outline model
                window.outlineEffect.model.position.copy(model.position);
                window.outlineEffect.model.rotation.copy(model.rotation);
                
                // Apply the outline scale while preserving the model's own scale
                const baseScale = model.scale.clone();
                window.outlineEffect.model.scale.copy(baseScale);
                window.outlineEffect.model.scale.multiplyScalar(window.outlineEffect.scale);
                
                // Update outline model matrix
                window.outlineEffect.model.updateMatrixWorld(true);
            }
            
            // Debug log (once every ~30 seconds)
            if (Math.floor(Date.now() / 1000) % 30 === 0) {
                if (window.outlineEffect && window.outlineEffect.model) {
                    console.log("Using geometric outline effect with model positions:");
                    console.log(`- Main model: x=${model.position.x.toFixed(2)}, y=${model.position.y.toFixed(2)}, z=${model.position.z.toFixed(2)}`);
                    console.log(`- Outline model: x=${window.outlineEffect.model.position.x.toFixed(2)}, y=${window.outlineEffect.model.position.y.toFixed(2)}, z=${window.outlineEffect.model.position.z.toFixed(2)}`);
                }
            }
        }
        
        // Use standard rendering - our outline meshes are part of the scene
        renderer.render(scene, camera);
    }
    
    // Start animation loop
    animate();
      // Initialize texture preview canvas
    const previewCanvas = document.getElementById('texture-preview');
    const previewCtx = previewCanvas.getContext('2d');
    
    // Store grid colors for easy access
    const gridColors = {
        rows: 2,
        cols: 10,
        getColor: function(row, col) {
            const input = document.getElementById(`color-${row}-${col}`);
            return input ? input.value : '#ffffff';
        },
        getColorInputs: function() {
            return document.querySelectorAll('.grid-color');
        }
    };
    
    // Default color values - storing these for the reset functionality
    const defaultColors = {
        '0-0': '#9A9AB7',
        '0-1': '#3A7595',
        '0-2': '#7E584A',
        '0-3': '#EFAC75',
        '0-4': '#2B2B2B',
        '0-5': '#65FFFF',
        '0-6': '#000000',
        '0-7': '#000000',
        '0-8': '#000000',
        '0-9': '#000000',
        '1-0': '#73738B',
        '1-1': '#193D51',
        '1-2': '#633F3A',
        '1-3': '#D8A46B',
        '1-4': '#171718',
        '1-5': '#000000',
        '1-6': '#000000',
        '1-7': '#000000',
        '1-8': '#000000',
        '1-9': '#F4F4FF'
    };
      // Material and color customization
    function updateMaterial() {
        if (!model) return;
        
        // First update our preview canvas
        updateTexturePreview();
        
        // Create a Three.js texture from our preview canvas
        const texture = new THREE.CanvasTexture(previewCanvas);
        
        // Ensure texture wrapping and filtering are set correctly
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter; // Use nearest neighbor for crisp pixel textures
        texture.needsUpdate = true;
        
        // Apply the texture to the model
        model.traverse(function(child) {
            if (child.isMesh) {
                // Create a new material with our texture
                if (!child.originalMaterial) {
                    // Store the original material type for reference
                    child.originalMaterial = child.material.type;
                }
                
                // Create the appropriate material type based on original material
                if (child.originalMaterial === 'MeshPhongMaterial' || !child.originalMaterial) {
                    child.material = new THREE.MeshPhongMaterial({
                        map: texture,
                        shininess: 0,
                        specular: new THREE.Color(0x111111)
                    });
                } else if (child.originalMaterial === 'MeshStandardMaterial') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        metalness: 0,
                        roughness: 0
                    });
                } else {
                    // Default case - basic material with texture
                    child.material = new THREE.MeshBasicMaterial({ map: texture });
                }
            }
        });
        
        // Also ensure outline model materials are using the current color
        if (window.outlineEffect && window.outlineEffect.model) {
            // Make sure outline model uses the current outline color
            const currentColor = window.outlineEffect.color || 0x000000;
            window.outlineEffect.model.traverse(function(child) {
                if (child.isMesh && child.material) {
                    child.material.color.set(currentColor);
                }
            });
        }
    }
    
    // Update the texture preview canvas
    function updateTexturePreview() {
        const cellWidth = previewCanvas.width / gridColors.cols;
        const cellHeight = previewCanvas.height / gridColors.rows;
        
        // Clear canvas
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Draw the grid
        for (let row = 0; row < gridColors.rows; row++) {
            for (let col = 0; col < gridColors.cols; col++) {
                const color = gridColors.getColor(row, col);
                
                // Fill cell with color
                previewCtx.fillStyle = color;
                previewCtx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
                
                // Draw cell border for better visibility
                previewCtx.strokeStyle = 'rgba(0,0,0,0.3)';
                previewCtx.lineWidth = 1;
                previewCtx.strokeRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }
        }        // If gradient texture is loaded, draw it on top
        if (gradientTextureLoaded) {
            // Draw the gradient texture over the entire canvas
            previewCtx.drawImage(gradientTexture, 0, 0, previewCanvas.width, previewCanvas.height);
        }
        
        return previewCanvas;
    }
      // Randomize colors function
    function randomizeColors() {
        const colorInputs = gridColors.getColorInputs();
        colorInputs.forEach(input => {
            // Skip hidden or readonly inputs
            if (input.hasAttribute('hidden') || input.hasAttribute('readonly') || 
                input.parentElement.hasAttribute('hidden')) {
                return;
            }
            
            // Get row and col from data attributes to check if this is a field that should be skipped
            const col = parseInt(input.dataset.col);
            if (col >= 6 && col <= 9) {
                // Skip columns 6, 7, 8, 9 as they should remain unchanged
                return;
            }
            
            // Generate random color
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const randomColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            input.value = randomColor;
        });
        
        updateMaterial();
    }
      // Reset colors to default function
    function resetColors() {
        const colorInputs = gridColors.getColorInputs();
        colorInputs.forEach(input => {
            // Skip hidden or readonly inputs for visual consistency with randomize
            // Though technically reset would work fine on these, we'll keep behavior consistent
            if (input.hasAttribute('hidden') || input.hasAttribute('readonly') || 
                input.parentElement.hasAttribute('hidden')) {
                return;
            }
            
            // Get row and col from data attributes
            const row = input.dataset.row;
            const col = input.dataset.col;
            
            // Skip columns 6-9 to be consistent with randomize
            if (parseInt(col) >= 6 && parseInt(col) <= 9) {
                return;
            }
            
            const key = `${row}-${col}`;
            
            // Set to default color if available
            if (defaultColors[key]) {
                input.value = defaultColors[key];
            }
        });
        
        updateMaterial();
    }
    
    // Set up event listeners for controls
    const colorInputs = gridColors.getColorInputs();
    colorInputs.forEach(input => {
        input.addEventListener('input', updateMaterial);
    });    
    document.getElementById('randomize-colors').addEventListener('click', randomizeColors);
    document.getElementById('reset-colors').addEventListener('click', resetColors);
    
    // Set up outline control listeners
    const outlineToggle = document.getElementById('outline-toggle');
    if (outlineToggle) {
        outlineToggle.addEventListener('change', function() {
            if (window.toggleOutline) {
                window.toggleOutline(this.checked);
            }
        });
    }
    
    const outlineThickness = document.getElementById('outline-thickness');
    if (outlineThickness) {
        outlineThickness.addEventListener('input', function() {
            if (window.setOutlineThickness) {
                window.setOutlineThickness(parseFloat(this.value));
            }
        });
    }
    
    const outlineColor = document.getElementById('outline-color');
    if (outlineColor) {
        outlineColor.addEventListener('input', function() {
            if (window.setOutlineColor) {
                // Convert hex string to integer
                const colorHex = parseInt(this.value.substring(1), 16);
                window.setOutlineColor(colorHex);
            }
        });
    }
    
    // Initialize preview
    updateTexturePreview();

    // Generate and download texture
    document.getElementById('generate-texture').addEventListener('click', function() {
        if (!model) {
            alert('Please wait for the model to load first');
            return;
        }
        
        // Create a high-resolution canvas for the texture
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set sizes as specified (2048x410)
        canvas.width = 2048;
        canvas.height = 410;
        
        // Calculate cell size
        const cellWidth = canvas.width / gridColors.cols;
        const cellHeight = canvas.height / gridColors.rows;
        
        // Draw the grid with high-quality rendering
        for (let row = 0; row < gridColors.rows; row++) {
            for (let col = 0; col < gridColors.cols; col++) {
                const color = gridColors.getColor(row, col);
                
                // Fill with base color
                ctx.fillStyle = color;
                ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }
        }
        
        // Add a subtle pixel border between grid cells for better definition
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        
        // Draw vertical lines
        for (let col = 1; col < gridColors.cols; col++) {
            ctx.beginPath();
            ctx.moveTo(col * cellWidth, 0);
            ctx.lineTo(col * cellWidth, canvas.height);
            ctx.stroke();
        }
          // Draw horizontal line between the two rows
        ctx.beginPath();
        ctx.moveTo(0, cellHeight);
        ctx.lineTo(canvas.width, cellHeight);
        ctx.stroke();
          // Apply gradient overlay if it's loaded
        if (gradientTextureLoaded) {
            // Draw the gradient overlay with proper dimensions for high-res texture
            ctx.drawImage(gradientTexture, 0, 0, canvas.width, canvas.height);
        }
          
        // Convert to data URL and trigger download
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'hex-skin-texture.png';
        link.href = dataURL;
        link.click();
    });
    
    // No outline customization controls - using static inverted hull outline
    
    // Initialize preview
    updateTexturePreview();
});
