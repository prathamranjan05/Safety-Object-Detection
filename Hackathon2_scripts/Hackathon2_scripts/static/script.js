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

scene.add(new THREE.AmbientLight(0x404080, 2));
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

camera.position.z = 5;

(function animate() {
    requestAnimationFrame(animate);
    stationGroup.rotation.y += 0.002;
    stationGroup.rotation.x += 0.0005;
    renderer.render(scene, camera);
})();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Modal Functions ---
function openModal(id) {
    document.getElementById(id)?.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ================= DASHBOARD =================
document.addEventListener('DOMContentLoaded', () => {

    let isLiveActive = false;
    let liveInterval = null;
    let cameraStream = null;
    
    const detectionStatsContainer = document.getElementById('detection-stats-container');
    const safetyObjectsContainer = document.getElementById('safety-objects-container');

    // ----- Model Performance Summary -----
    const modelPerformance = [
        { metric: 'Precision', value: '84.1%', meaning: "Model’s ability to avoid false positives — it’s accurately identifying safety objects without confusion." },
        { metric: 'Recall', value: '68.2%', meaning: "Model’s ability to find all true positives — it’s catching most safety items in frames." },
        { metric: 'mAP@0.5', value: '74.2%', meaning: "Main benchmark metric for NASA challenge — detection accuracy at 50% IoU." },
        { metric: 'mAP@0.5–0.95', value: '59.6%', meaning: "Shows robustness across stricter IoU thresholds (harder metric)." },
        { metric: 'Fitness', value: '59.6%', meaning: "Matches overall mean mAP across IoUs — indicates balanced performance." }
    ];

    detectionStatsContainer.innerHTML = modelPerformance.map(m => `
        <div class="bg-purple-900/10 rounded-md p-2 mb-2">
            <div class="flex justify-between items-center">
                <span class="text-gray-300 text-sm font-semibold">${m.metric}</span>
                <span class="text-white font-bold text-sm">${m.value}</span>
            </div>
            <p class="text-gray-400 text-xs mt-1">${m.meaning}</p>
        </div>
    `).join('');

    // Optional: Add a small interpretation section
    const interpretationHTML = `
        <div class="bg-purple-900/20 rounded-md p-3 mt-4">
            <p class="text-white font-semibold mb-1">🧠 Interpretation for Genignite Challenge:</p>
            <ul class="text-gray-300 text-xs list-disc pl-5 space-y-1">
                <li>It can confidently identify most safety-critical objects (OxygenTank, Extinguisher, etc.)</li>
                <li>Achieves solid generalization — no massive overfitting</li>
                <li>Ready for inference & submission demo</li>
            </ul>
            <p class="text-gray-400 text-xs mt-2">✅ Target thresholds: mAP@0.5 ≥ 0.7, mAP@0.5–0.95 ≥ 0.55 — We’re above both 🎯</p>
        </div>
    `;
    detectionStatsContainer.insertAdjacentHTML('beforeend', interpretationHTML);

    // ----- Safety Objects (all 7) -----
    const safetyObjects = [
        'OxygenTank',
        'NitrogenTank',
        'FirstAidBox',
        'FireAlarm',
        'SafetySwitchPanel',
        'EmergencyPhone',
        'FireExtinguisher'
    ];

    safetyObjectsContainer.innerHTML = safetyObjects.map(obj => `
        <div class="flex items-center gap-2 text-purple-300 text-sm">
            <i class="fas fa-check-circle text-green-400"></i> ${obj}
        </div>
    `).join('');
    // ---------- TAB ELEMENTS ----------
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
    const recentDetectionsContainer = document.getElementById('recent-detections-container');

    // ---------- TAB SWITCH (FIXED) ----------
    Object.keys(tabs).forEach(key => {
        tabs[key].addEventListener('click', () => switchTab(key));
    });

    function switchTab(active) {
        Object.keys(contents).forEach(k => {
            contents[k].classList.toggle('hidden', k !== active);
        });
    }

    // ---------- DETECTIONS UI ----------
    function renderRecentDetections(detections) {
        if (!detections || detections.length === 0) {
            recentDetectionsContainer.innerHTML = `<p class="text-gray-400">No detections</p>`;
            return;
        }

        recentDetectionsContainer.innerHTML = detections.map(d =>
            `<p>${d.class} — ${(d.confidence * 100).toFixed(1)}%</p>`
        ).join('');
    }

    function drawBoundingBox(box, label, confidence, mediaEl) {
        const [x, y, w, h] = box;
        const parent = mediaEl.parentElement;
        const rect = parent.getBoundingClientRect();

        const el = document.createElement('div');
        el.className = 'bbox';
        el.style.position = 'absolute';
        el.style.border = '2px solid magenta';
        el.style.left = `${x * rect.width}px`;
        el.style.top = `${y * rect.height}px`;
        el.style.width = `${w * rect.width}px`;
        el.style.height = `${h * rect.height}px`;
        el.innerHTML = `<span>${label} ${confidence}%</span>`;
        parent.appendChild(el);
    }

    function clearBoundingBoxes(el) {
        el.parentElement.querySelectorAll('.bbox').forEach(b => b.remove());
    }

    // ================= LIVE FEED =================
    async function startCamera() {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        liveFeedDisplay.srcObject = cameraStream;
        liveFeedDisplay.onloadedmetadata = () => liveFeedDisplay.play();
    }

    function stopCamera() {
        cameraStream?.getTracks().forEach(t => t.stop());
        liveFeedDisplay.srcObject = null;
    }

    toggleLiveBtn.addEventListener('click', async () => {
        isLiveActive = !isLiveActive;

        if (isLiveActive) {
            toggleLiveBtn.innerText = 'Stop Live Feed';
            await startCamera();

            liveInterval = setInterval(() => {
                if (!liveFeedDisplay.videoWidth) return;

                const canvas = document.createElement('canvas');
                canvas.width = liveFeedDisplay.videoWidth;
                canvas.height = liveFeedDisplay.videoHeight;
                canvas.getContext('2d').drawImage(liveFeedDisplay, 0, 0);

                canvas.toBlob(blob => {
                    const fd = new FormData();
                    fd.append('frame', blob);

                    fetch('/predict-frame', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(dets => {
                            clearBoundingBoxes(liveFeedDisplay);
                            renderRecentDetections(dets);
                            dets.forEach(d =>
                                drawBoundingBox(d.box, d.class, (d.confidence * 100).toFixed(2), liveFeedDisplay)
                            );
                        });
                }, 'image/jpeg');
            }, 1000);
        } else {
            clearInterval(liveInterval);
            stopCamera();
            clearBoundingBoxes(liveFeedDisplay);
            renderRecentDetections([]);
            toggleLiveBtn.innerText = 'Start Live Feed';
        }
    });

    // ================= IMAGE UPLOAD (FIXED) =================
    const uploadBox = document.getElementById('upload-drop-zone');
    const uploadInput = document.getElementById('imageUpload');
    const uploadedImage = document.getElementById('upload-image-display');
    const uploadedDetectionsList = document.getElementById('uploaded-detections-list');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    function handleFile(file) {
        uploadedImage.src = URL.createObjectURL(file);
        uploadedImage.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');

        const fd = new FormData();
        fd.append('image', file);

        fetch('/predict-image', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(dets => {
                clearBoundingBoxes(uploadedImage);
                renderRecentDetections(dets);

                dets.forEach(d =>
                    drawBoundingBox(d.box, d.class, (d.confidence * 100).toFixed(2), uploadedImage)
                );

                uploadedDetectionsList.innerHTML = dets.length > 0
                    ? dets.map(d => `<p class="text-white">${d.class} — ${(d.confidence * 100).toFixed(1)}%</p>`).join('')
                    : `<p class="text-gray-400">No detections</p>`;
            });
    }

    // Click to open file picker
    uploadBox?.addEventListener('click', () => uploadInput.click());

    // Input change
    uploadInput?.addEventListener('change', e => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Drag & Drop
    uploadBox?.addEventListener('dragover', e => {
        e.preventDefault();
        uploadBox.classList.add('border-purple-500');
    });
    uploadBox?.addEventListener('dragleave', e => {
        e.preventDefault();
        uploadBox.classList.remove('border-purple-500');
    });
    uploadBox?.addEventListener('drop', e => {
        e.preventDefault();
        uploadBox.classList.remove('border-purple-500');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    switchTab('live');
});

// --- Console ---
console.log('%c🚀 AstraSafe AI - Space Station Safety Monitor', 'color:#c026d3;font-size:20px');
console.log('%cGenIgnite 2025 Hackathon Submission', 'color:#4f46e5');
console.log('%cDeveloped by Team CODE2AIM', 'color:#10b981;font-size:14px');
