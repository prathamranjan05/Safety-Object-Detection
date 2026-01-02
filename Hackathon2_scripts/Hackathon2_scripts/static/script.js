// --- 3D Background Scene ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const stationGroup = new THREE.Group();
const coreGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
const coreMaterial = new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 50 });
const core = new THREE.Mesh(coreGeometry, coreMaterial);
stationGroup.add(core);

const solarPanelGeometry = new THREE.BoxGeometry(5, 2, 0.1);
const solarPanelMaterial = new THREE.MeshPhongMaterial({ color: 0x223388, side: THREE.DoubleSide });
const panel1 = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
panel1.position.x = 3;
const panel2 = panel1.clone();
panel2.position.x = -3;
stationGroup.add(panel1, panel2);

scene.add(stationGroup);

const ambientLight = new THREE.AmbientLight(0x404080, 2);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    stationGroup.rotation.y += 0.002;
    stationGroup.rotation.x += 0.0005;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Modal Functions ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// =========== DASHBOARD LOGIC START ===========
document.addEventListener('DOMContentLoaded', () => {
    // --- State & Constants ---
    const stats = { total: 247, critical: 3, normal: 244 };
    let isLiveActive = false;
    let liveInterval = null;

    const safetyObjects = [
        { name: 'OxygenTank', icon: '🫧', status: 'normal' },
        { name: 'NitrogenTank', icon: '❄️', status: 'normal' },
        { name: 'FirstAidBox', icon: '🏥', status: 'critical' },
        { name: 'FireAlarm', icon: '🔔', status: 'normal' },
        { name: 'SafetySwitchPanel', icon: '⚡', status: 'normal' },
        { name: 'EmergencyPhone', icon: '📞', status: 'normal' },
        { name: 'FireExtinguisher', icon: '🧯', status: 'normal' }
    ];

    // --- Element Selectors ---
    const statsContainer = document.getElementById('detection-stats-container');
    const safetyObjectsContainer = document.getElementById('safety-objects-container');
    const recentDetectionsContainer = document.getElementById('recent-detections-container');
    const uploadedDetectionsList = document.getElementById('uploaded-detections-list');

    const tabs = {
        live: document.getElementById('tab-live'),
        upload: document.getElementById('tab-upload'),
        falcon: document.getElementById('tab-falcon'),
    };
    const contents = {
        live: document.getElementById('content-live'),
        upload: document.getElementById('content-upload'),
        falcon: document.getElementById('content-falcon'),
    };
    
    const toggleLiveBtn = document.getElementById('toggle-live-btn');
    const liveFeedDisplay = document.getElementById('live-feed-display');
    const uploadZone = document.getElementById('upload-drop-zone');
    const imageUploadInput = document.getElementById('imageUpload');
    const uploadImageDisplay = document.getElementById('upload-image-display');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    // --- UI Rendering Functions ---
    function renderStats() {
        statsContainer.innerHTML = `
            <div>
                <div class="flex justify-between text-sm mb-1 text-purple-300"><span>Total Objects</span><span class="font-bold text-white">${stats.total}</span></div>
                <div class="w-full h-2 bg-gray-700 rounded-full"><div class="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-full"></div></div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1 text-red-400"><span>Critical</span><span class="font-bold text-white">${stats.critical}</span></div>
                <div class="w-full h-2 bg-gray-700 rounded-full"><div class="h-full bg-red-500 rounded-full" style="width: ${(stats.critical/stats.total)*100}%"></div></div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1 text-green-400"><span>Normal</span><span class="font-bold text-white">${stats.normal}</span></div>
                <div class="w-full h-2 bg-gray-700 rounded-full"><div class="h-full bg-green-500 rounded-full" style="width: ${(stats.normal/stats.total)*100}%"></div></div>
            </div>
        `;
    }

    function renderSafetyObjects() {
        safetyObjectsContainer.innerHTML = safetyObjects.map(obj => `
            <div class="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">${obj.icon}</span>
                    <span class="text-sm">${obj.name}</span>
                </div>
                <div class="w-2.5 h-2.5 rounded-full ${obj.status === 'critical' ? 'bg-red-500' : 'bg-green-500'}"></div>
            </div>
        `).join('');
    }

    function renderRecentDetections(detections) {
        if (!detections || detections.length === 0) {
            recentDetectionsContainer.innerHTML = `
                <div class="text-center py-8 text-purple-300/60">
                    <i class="fas fa-stream opacity-50 text-3xl mb-2"></i>
                    <p class="text-sm">No recent detections</p>
                </div>`;
            return;
        };
        
        recentDetectionsContainer.innerHTML = detections.map(det => {
            const confidence = det.confidence ? (det.confidence * 100).toFixed(2) : '0.00';
            return `
            <div class="bg-white/5 p-3 rounded-lg border border-white/10 animate-fade-in">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-sm">${det.class}</span>
                    <span class="text-xs text-gray-400">Just now</span>
                </div>
                <div class="flex justify-between items-center text-xs text-purple-300 mb-1">
                    <span>Confidence</span>
                    <span class="font-bold text-green-400">${confidence}%</span>
                </div>
                <div class="w-full h-1.5 bg-gray-700 rounded-full">
                    <div class="h-full bg-green-500 rounded-full" style="width: ${confidence}%"></div>
                </div>
            </div>
        `}).join('');
    }

    function renderUploadedDetections(detections) {
        if (!detections || detections.length === 0) {
            uploadedDetectionsList.innerHTML = `<p class="text-center text-purple-300/60">No objects detected.</p>`;
            return;
        }
        uploadedDetectionsList.innerHTML = detections.map(det => {
            const confidence = det.confidence ? (det.confidence * 100).toFixed(2) : '0.00';
            return `<p>${det.class} - ${confidence}%</p>`;
        }).join('');
    }

    // --- Tab Switching Logic ---
    function switchTab(selectedKey) {
        Object.keys(tabs).forEach(key => {
            const isSelected = key === selectedKey;
            tabs[key].classList.toggle('bg-gradient-to-r', isSelected);
            tabs[key].classList.toggle('from-purple-500', isSelected);
            tabs[key].classList.toggle('to-blue-500', isSelected);
            tabs[key].classList.toggle('shadow-lg', isSelected);
            tabs[key].classList.toggle('hover:bg-white/10', !isSelected);
            contents[key].classList.toggle('hidden', !isSelected);
        });
    }
    
    // --- Bounding Box Functions ---
    function drawBoundingBox(box, label, confidence, imageElement) {
        const [x, y, w, h] = box;
        const parent = imageElement.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();

        const bbox = document.createElement('div');
        bbox.className = 'bbox';
        bbox.style.position = 'absolute';
        bbox.style.border = '2px solid #c026d3';
        bbox.style.boxShadow = '0 0 10px rgba(192, 38, 211, 0.5)';
        bbox.style.left = `${x * parentRect.width}px`;
        bbox.style.top = `${y * parentRect.height}px`;
        bbox.style.width = `${w * parentRect.width}px`;
        bbox.style.height = `${h * parentRect.height}px`;
        bbox.style.transition = 'opacity 0.3s ease';
        bbox.style.opacity = '0';
        
        const labelEl = document.createElement('div');
        labelEl.innerHTML = `<div style="position: absolute; top: -24px; left: -2px; background: #c026d3; color: white; padding: 2px 6px; font-size: 10px; font-weight: bold; white-space: nowrap; border-radius: 4px;">${label} ${confidence}%</div>`;
        bbox.appendChild(labelEl);
        parent.appendChild(bbox);
        setTimeout(() => { bbox.style.opacity = '1'; }, 10);
    }

    function clearBoundingBoxes(imageElement) {
        const parent = imageElement.parentElement;
        if (!parent) return;
        parent.querySelectorAll('.bbox').forEach(box => box.remove());
    }

    // --- Handle File Upload ---
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            uploadImageDisplay.src = reader.result;
            uploadImageDisplay.classList.remove('hidden');
            uploadPlaceholder.classList.add('hidden');

            const formData = new FormData();
            formData.append('image', file);

            fetch('/predict-image', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(detections => {
                    clearBoundingBoxes(uploadImageDisplay);
                    detections.forEach(det => drawBoundingBox(det.box, det.class, (det.confidence*100).toFixed(2), uploadImageDisplay));
                    renderUploadedDetections(detections);
                })
                .catch(err => console.error('Prediction error:', err));
        };
        reader.readAsDataURL(file);
    }

    // --- Live Feed Handling ---
    toggleLiveBtn.addEventListener('click', () => {
        isLiveActive = !isLiveActive;

        if (isLiveActive) {
            toggleLiveBtn.innerHTML = `<i class="fas fa-pause"></i> Stop Live Feed`;
            toggleLiveBtn.classList.remove('btn-primary');
            toggleLiveBtn.classList.add('bg-red-500', 'hover:bg-red-600');

            liveInterval = setInterval(() => {
                const canvas = document.createElement('canvas');
                canvas.width = liveFeedDisplay.videoWidth;
                canvas.height = liveFeedDisplay.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(liveFeedDisplay, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(blob => {
                    const formData = new FormData();
                    formData.append('frame', blob);

                    fetch('/predict-frame', { method: 'POST', body: formData })
                        .then(res => res.json())
                        .then(detections => {
                            renderRecentDetections(detections);
                            clearBoundingBoxes(liveFeedDisplay);
                            detections.forEach(det => drawBoundingBox(det.box, det.class, (det.confidence*100).toFixed(2), liveFeedDisplay));
                        })
                        .catch(err => console.error('Live feed error:', err));
                }, 'image/jpeg');
            }, 1000);
        } else {
            clearInterval(liveInterval);
            toggleLiveBtn.innerHTML = `<i class="fas fa-play"></i> Start Live Feed`;
            toggleLiveBtn.classList.add('btn-primary');
            toggleLiveBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            renderRecentDetections([]);
            clearBoundingBoxes(liveFeedDisplay);
        }
    });

    // --- Upload Zone Listeners ---
    uploadZone.addEventListener('click', () => imageUploadInput.click());
    uploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        uploadZone.classList.add('border-purple-500/80', 'bg-white/5');
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('border-purple-500/80', 'bg-white/5');
    });
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('border-purple-500/80', 'bg-white/5');
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });
    imageUploadInput.addEventListener('change', e => handleFile(e.target.files[0]));

    // --- Tab Switching ---
    Object.keys(tabs).forEach(key => {
        tabs[key].addEventListener('click', () => switchTab(key));
    });

    // --- Initial Render ---
    renderStats();
    renderSafetyObjects();
    switchTab('live');

    // --- Dynamic Card Hover ---
    document.querySelectorAll('.glass-panel').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});
// =========== DASHBOARD LOGIC END ===========

// --- Smooth Scroll ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// --- Console Welcome Message ---
console.log('%c🚀 AstraSafe AI - Space Station Safety Monitor', 'color: #c026d3; font-size: 20px; font-weight: bold;');
console.log('%cGenIgnite 2025 Hackathon Submission', 'color: #4f46e5; font-size: 14px;');
