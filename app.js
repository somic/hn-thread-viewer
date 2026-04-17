const API_BASE = 'https://hacker-news.firebaseio.com/v0';
const cache = new Map();

const elements = {
    input: document.getElementById('hn-input'),
    loadBtn: document.getElementById('load-btn'),
    card: document.getElementById('comment-card'),
    author: document.getElementById('author'),
    time: document.getElementById('time'),
    depthIndicator: document.getElementById('depth-indicator'),
    commentText: document.getElementById('comment-text'),
    modal: document.getElementById('modal'),
    modalText: document.getElementById('full-comment-text'),
    closeModal: document.getElementById('close-modal'),
    loader: document.getElementById('loader')
};

let currentState = {
    currentItem: null,
    depth: 0,
    parentItem: null,
    siblings: [],
    siblingIndex: -1
};

async function fetchItem(id) {
    if (cache.has(id)) return cache.get(id);
    showLoader();
    try {
        const response = await fetch(`${API_BASE}/item/${id}.json`);
        const data = await response.json();
        cache.set(id, data);
        return data;
    } catch (e) {
        console.error('Fetch failed', e);
        return null;
    } finally {
        hideLoader();
    }
}

function showLoader() { elements.loader.classList.remove('hidden'); }
function hideLoader() { elements.loader.classList.add('hidden'); }

async function loadThread(idOrUrl) {
    let id = idOrUrl.trim();
    if (!id) id = '1'; // Fallback to item 1

    if (idOrUrl.includes('id=')) {
        id = idOrUrl.split('id=')[1].split('&')[0];
    } else if (idOrUrl.includes('item/')) {
        id = idOrUrl.split('item/')[1].split('/')[0].split('?')[0];
    }
    
    const item = await fetchItem(id);
    if (item) {
        // If it's a story, load the first comment if available
        if (item.type === 'story' && item.kids && item.kids.length > 0) {
            await navigateTo(item.kids[0], 1, item);
        } else {
            await navigateTo(item.id, 0, null);
        }
    }
}

async function navigateTo(id, depth, parentItem) {
    const item = await fetchItem(id);
    if (!item) return;

    currentState.currentItem = item;
    currentState.depth = depth;
    
    // If parentItem is not provided but exists in item, fetch it to restore context
    if (!parentItem && item.parent) {
        parentItem = await fetchItem(item.parent);
    }
    
    currentState.parentItem = parentItem;
    
    if (parentItem && parentItem.kids) {
        currentState.siblings = parentItem.kids;
        currentState.siblingIndex = parentItem.kids.indexOf(item.id);
    } else {
        currentState.siblings = [];
        currentState.siblingIndex = -1;
    }

    renderCurrentItem();
}

function renderCurrentItem() {
    const item = currentState.currentItem;
    elements.author.textContent = item.by || '[deleted]';
    elements.time.textContent = new Date(item.time * 1000).toLocaleTimeString();
    elements.depthIndicator.textContent = `Depth: ${currentState.depth}`;
    elements.commentText.innerHTML = item.text || (item.title ? `<strong>${item.title}</strong><br>${item.url || ''}` : '[no text]');
    
    // Update visual cue
    const hue = 20; // Base orange
    const lightness = Math.min(50 + currentState.depth * 5, 90);
    document.documentElement.style.setProperty('--depth-color', `hsl(${hue}, 100%, ${lightness - 20}%)`);
    document.documentElement.style.setProperty('--card-bg', `hsl(${hue}, 30%, ${lightness + 35}%)`);

    // Reset animations
    elements.card.className = 'card';

    // Check for overflow after render
    setTimeout(() => {
        if (elements.commentText.scrollHeight > elements.commentText.clientHeight) {
            document.getElementById('tap-hint').style.display = 'block';
        } else {
            document.getElementById('tap-hint').style.display = 'none';
        }
    }, 0);
}

// Gestures
const hammer = new Hammer(elements.card);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

hammer.on('swipeleft', async () => {
    // Child
    if (currentState.currentItem.kids && currentState.currentItem.kids.length > 0) {
        animateSwipe('swipe-left');
        await navigateTo(currentState.currentItem.kids[0], currentState.depth + 1, currentState.currentItem);
    } else {
        shakeCard();
    }
});

hammer.on('swiperight', async () => {
    // Parent
    if (currentState.parentItem) {
        animateSwipe('swipe-right');
        let grandparent = null;
        if (currentState.parentItem.parent) {
            grandparent = await fetchItem(currentState.parentItem.parent);
        }
        await navigateTo(currentState.parentItem.id, currentState.depth - 1, grandparent);
    } else {
        shakeCard();
    }
});

hammer.on('swipeup', async () => {
    // Next Sibling
    if (currentState.siblings && currentState.siblingIndex < currentState.siblings.length - 1) {
        animateSwipe('swipe-up');
        await navigateTo(currentState.siblings[currentState.siblingIndex + 1], currentState.depth, currentState.parentItem);
    } else {
        shakeCard();
    }
});

hammer.on('swipedown', async () => {
    // Prev Sibling
    if (currentState.siblings && currentState.siblingIndex > 0) {
        animateSwipe('swipe-down');
        await navigateTo(currentState.siblings[currentState.siblingIndex - 1], currentState.depth, currentState.parentItem);
    } else {
        shakeCard();
    }
});

function animateSwipe(className) {
    elements.card.classList.add(className);
}

function shakeCard() {
    elements.card.classList.add('shake');
    setTimeout(() => elements.card.classList.remove('shake'), 400);
}

// Double tap for modal
hammer.on('doubletap', () => {
    elements.modalText.innerHTML = currentState.currentItem.text || currentState.currentItem.title;
    elements.modal.classList.remove('hidden');
});

elements.closeModal.onclick = () => {
    elements.modal.classList.add('hidden');
};

window.onclick = (event) => {
    if (event.target == elements.modal) {
        elements.modal.classList.add('hidden');
    }
};

elements.loadBtn.onclick = () => {
    loadThread(elements.input.value);
};

elements.input.onkeypress = (e) => {
    if (e.key === 'Enter') loadThread(elements.input.value);
};

// Initial load if hash exists
if (window.location.hash) {
    loadThread(window.location.hash.substring(1));
}
