document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // Personal photo slots accept either .jpg or .jpeg. The website starts
  // with the .jpg filename and automatically checks .jpeg if needed.
  document.querySelectorAll("img[data-photo-fallback]").forEach(img => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackTried === "true") {
        img.classList.add("photo-slot-missing");
        return;
      }
      img.dataset.fallbackTried = "true";
      img.src = img.src.replace(/\.jpg(?=$|[?#])/i, ".jpeg");
    });
  });

  const isEmbedded = window.parent !== window;

  // Pages loaded inside the main site's frame only show their content.
  if (isEmbedded) {
    document.body.classList.add("embedded-page");

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return;

      link.addEventListener('click', event => {
        event.preventDefault();
        if (window.parent && window.parent !== window) {
          // Use postMessage so navigation also works reliably when the site is
          // opened locally (file://) in browsers that restrict direct iframe access.
          window.parent.postMessage({ type: 'navigate', page: href }, '*');
        } else {
          window.location.href = href;
        }
      });
    });

    // Keep the iframe at a stable height on GitHub Pages.
    // The parent page already provides the iframe height.

    // Contact/demo form support if the page contains one.
    setupContactForm();
    return;
  }

  // Main shell: persistent music and in-page navigation.
  const frame = document.getElementById('pageFrame');
  const music = document.getElementById('backgroundMusic');
  const musicButton = document.getElementById('musicButton');
  const musicStatus = document.getElementById('musicStatus');

  const pageMap = {
  'index.html': 'home.html',
  'home.html': 'home.html',
  'about.html': 'about.html',
  'resume.html': 'resume.html',
  'services.html': 'services.html',
  'gallery.html': 'gallery.html',
  'testi.html': 'testi.html'
};

  function setActiveNav(page) {
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  }

  window.navigateToPage = function(page, pushState = true) {
    const cleanPage = pageMap[page] || pageMap[page.split('#')[0]] || 'home.html';
    frame.src = cleanPage;
    setActiveNav(cleanPage);

    const titleMap = {
      'home.html': 'Home',
      'about.html': 'About',
      'resume.html': 'Education',
      'services.html': 'Interests',
      'gallery.html': 'Gallery',
      'testi.html': 'Reflection'
    };
    document.title = `${titleMap[cleanPage]} | Adrian Philippe E. Rom`;

    if (pushState) {
      const urlPage = cleanPage === 'home.html' ? 'index.html' : cleanPage;
      history.pushState({ page: cleanPage }, '', urlPage);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Receive navigation requests from pages loaded inside the iframe.
  window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'navigate') return;
    const requestedPage = String(event.data.page || '');
    navigateToPage(requestedPage);
  });

  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      navigateToPage(link.dataset.page);
    });
  });

  window.addEventListener('popstate', () => {
    const page = location.pathname.split('/').pop() || 'index.html';
    navigateToPage(page, false);
  });

  frame.addEventListener('load', () => {
    const page = Object.keys(pageMap).find(key => pageMap[key] === frame.contentWindow.location.pathname.split('/').pop()) || 'home.html';
    setActiveNav(pageMap[page] || page);
  });

  function updateMusicButton() {
    const playing = !music.paused;
    musicButton.textContent = playing ? '♫ Pause Music' : '♪ Play Music';
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    musicStatus.textContent = playing ? 'Now playing: Muli (Secret Verse)' : 'Music is off';
  }

  musicButton.addEventListener('click', async () => {
    try {
      if (music.paused) {
        await music.play();
      } else {
        music.pause();
      }
      updateMusicButton();
    } catch (error) {
      musicStatus.textContent = 'Click Play Music to start';
    }
  });

  music.addEventListener('play', updateMusicButton);
  music.addEventListener('pause', updateMusicButton);
  music.addEventListener('ended', updateMusicButton);
  updateMusicButton();

  // Optional: remember whether the visitor last had music enabled.
  // The browser may still require a click after a fresh page load.
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.setItem('musicWasPlaying', String(!music.paused));
    } catch (_) {}
  });
});

function setupContactForm() {
  const form = document.querySelector('#contact-form');
  const message = document.querySelector('#form-message');
  if (!form || !message) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#name').value.trim();
    message.textContent = name
      ? `Thank you, ${name}! Your message has been prepared for this demo website.`
      : 'Thank you! Your message has been prepared for this demo website.';
    form.reset();
  });
}
