// ============================
// CONFIGURACIÓN
// ============================
const ADMIN_PASSWORD = "miGaleria2024"; // ← Cambia esta contraseña
const STORAGE_KEY = 'galeria_fotos_v1';

// ============================
// ESTADO
// ============================
let isAdmin = false;
let photos = [];

// ============================
// INICIALIZACIÓN
// ============================
document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    renderGallery();
    document.getElementById('adminBtn').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('adminPass').focus();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
});

// Cerrar modal al hacer clic fuera
document.getElementById('loginModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('loginModal')) closeLogin();
});

// ============================
// ADMIN LOGIN
// ============================
function checkLogin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('adminBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('uploadPanel').classList.add('active');
        document.getElementById('adminPass').value = '';
        renderGallery();
    } else {
        alert('❌ Contraseña incorrecta');
    }
}

function closeLogin() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('adminPass').value = '';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    isAdmin = false;
    document.getElementById('uploadPanel').classList.remove('active');
    document.getElementById('adminBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    renderGallery();
});

// Enter para login
document.getElementById('adminPass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkLogin();
});

// ============================
// GESTIÓN DE FOTOS
// ============================
function loadPhotos() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) photos = JSON.parse(data);
    } catch (e) { photos = []; }
}

function savePhotos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('⚠️ Selecciona una imagen válida'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('⚠️ Máximo 5 MB permitido'); return; }
}

function uploadPhoto() {
    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('photoTitle');
    const descInput = document.getElementById('photoDesc');
    const file = fileInput.files[0];

    if (!file) { alert('⚠️ Selecciona una foto primero'); return; }
    if (!titleInput.value.trim()) { alert('⚠️ Escribe un título para la foto'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
        const photo = {
            id: Date.now(),
            image: e.target.result,
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            ratings: [],
            comments: [],
            date: new Date().toLocaleString('es-ES')
        };
        photos.unshift(photo);
        savePhotos();
        renderGallery();
        // Reset form
        fileInput.value = '';
        titleInput.value = '';
        descInput.value = '';
    };
    reader.readAsDataURL(file);
}

function deletePhoto(id) {
    if (!confirm('¿Eliminar esta foto permanentemente?')) return;
    photos = photos.filter(p => p.id !== id);
    savePhotos();
    renderGallery();
}

// ============================
// RESEÑAS (ANÓNIMAS)
// ============================
function submitRating(photoId, stars) {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    photo.ratings.push({
        stars: parseInt(stars),
        date: new Date().toISOString()
    });
    savePhotos();
    renderGallery();
}

function submitComment(photoId, inputId) {
    const text = document.getElementById(inputId).value.trim();
    if (!text) return;
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    photo.comments.push({
        text: text,
        date: new Date().toLocaleString('es-ES')
    });
    savePhotos();
    renderGallery();
}

// Enter para comentar
document.addEventListener('keypress', (e) => {
    if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
        const photoId = e.target.dataset.photoid;
        submitComment(parseInt(photoId), e.target.id);
    }
});

// ============================
// RENDER
// ============================
function getAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b.stars, 0);
    return (sum / ratings.length).toFixed(1);
}

function renderStarsDisplay(avg) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(avg)) {
            html += '★';
        } else {
            html += '<span class="empty">★</span>';
        }
    }
    return html;
}

function renderGallery() {
    const gallery = document.getElementById('gallery');
    if (photos.length === 0) {
        gallery.innerHTML = `
            <div class="empty-msg">
                <div class="empty-icon">📭</div>
                <p>No hay fotos aún.</p>
                <p class="empty-sub">Sube la primera desde el panel de admin.</p>
            </div>`;
        return;
    }

    gallery.innerHTML = photos.map(photo => {
        const avg = getAverageRating(photo.ratings);
        const commentsHtml = photo.comments && photo.comments.length > 0
            ? photo.comments.map(c =>
                `<div class="comment-item">${escapeHtml(c.text)}<small>${c.date}</small></div>`
            ).join('')
            : '<div class="no-comments">Sin comentarios aún. ¡Sé el primero!</div>';

        const adminDelete = isAdmin
            ? `<button class="btn btn-delete" onclick="deletePhoto(${photo.id})">🗑 Eliminar</button>`
            : '';

        return `
        <div class="photo-card" data-id="${photo.id}">
            <img src="${photo.image}" alt="${escapeHtml(photo.title)}">
            <div class="photo-info">
                <div class="photo-title">${escapeHtml(photo.title)}</div>
                ${photo.description ? `<div class="photo-desc">${escapeHtml(photo.description)}</div>` : ''}
                <div class="photo-actions">
                    <div>
                        <span class="star-display">${renderStarsDisplay(avg)}</span>
                        <span class="avg-rating">${avg > 0 ? avg + '/5' : 'Sin reseñas'}</span>
                        <span class="reviews-count">(${photo.ratings ? photo.ratings.length : 0})</span>
                    </div>
                    ${adminDelete}
                </div>

                <div class="star-rating" onmouseleave="this.querySelectorAll('input').forEach(i=>i.checked=false)">
                    <input type="radio" id="s5-${photo.id}" name="rate-${photo.id}" value="5" onclick="submitRating(${photo.id}, 5)">
                    <label for="s5-${photo.id}">★</label>
                    <input type="radio" id="s4-${photo.id}" name="rate-${photo.id}" value="4" onclick="submitRating(${photo.id}, 4)">
                    <label for="s4-${photo.id}">★</label>
                    <input type="radio" id="s3-${photo.id}" name="rate-${photo.id}" value="3" onclick="submitRating(${photo.id}, 3)">
                    <label for="s3-${photo.id}">★</label>
                    <input type="radio" id="s2-${photo.id}" name="rate-${photo.id}" value="2" onclick="submitRating(${photo.id}, 2)">
                    <label for="s2-${photo.id}">★</label>
                    <input type="radio" id="s1-${photo.id}" name="rate-${photo.id}" value="1" onclick="submitRating(${photo.id}, 1)">
                    <label for="s1-${photo.id}">★</label>
                </div>
                <span class="rating-hint">Haz clic en una estrella para reseñar (anónimo)</span>

                <div class="comments-section">
                    <h4>💬 Comentarios (${photo.comments ? photo.comments.length : 0})</h4>
                    <div class="comment-list">${commentsHtml}</div>
                    <div class="comment-form">
                        <input type="text" id="comment-${photo.id}" class="comment-input" data-photoid="${photo.id}" placeholder="Escribe un comentario anónimo..." maxlength="200">
                        <button class="btn btn-submit" onclick="submitComment(${photo.id}, 'comment-${photo.id}')">Enviar</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
