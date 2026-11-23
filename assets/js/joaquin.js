/*!
=========================================================
* Creative Design Landing page
=========================================================

* Copyright: 2019 DevCRUD (https://devcrud.com)
* Licensed: (https://devcrud.com/licenses)
* Coded by www.devcrud.com

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/ 

// Video background — half speed native playback
document.addEventListener('DOMContentLoaded', function () {
    var video = document.querySelector('.auricular-bg');
    if (video) {
        video.playbackRate = 0.5;
    }
});

// smooth scroll
$(document).ready(function(){
    $(".navbar .nav-link").on('click', function(event) {

        if (this.hash !== "") {

            event.preventDefault();

            var hash = this.hash;

            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 700, function(){
                window.location.hash = hash;
            });
        } 
    });
}); 



//modal
document.addEventListener('DOMContentLoaded', function () {
    // Datos del proveedor de un vídeo a partir de su data-src
    function videoInfo(src) {
        var vimeo = src.match(/player\.vimeo\.com\/video\/(\d+)/);
        if (vimeo) return { name: 'Vimeo', url: 'https://vimeo.com/' + vimeo[1] };
        var yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
        if (yt) return { name: 'YouTube', url: 'https://www.youtube.com/watch?v=' + yt[1] };
        return { name: 'el proveedor', url: src };
    }

    function removePlaceholder(modal) {
        var ph = modal.querySelector('.video-consent');
        if (ph) ph.remove();
    }

    // Los vídeos de terceros solo se cargan si el visitante aceptó las cookies de vídeo
    function loadVideo(modal) {
        var iframe = modal.querySelector('iframe[data-src]');
        if (!iframe) return;
        var src = iframe.getAttribute('data-src');

        if (window.JBConsent && JBConsent.has('video')) {
            removePlaceholder(modal);
            iframe.hidden = false;
            iframe.setAttribute('src', src);
            return;
        }

        iframe.hidden = true;
        iframe.setAttribute('src', '');
        removePlaceholder(modal);
        var info = videoInfo(src);
        var t = window.JBConsent ? JBConsent.t : function (k) { return k; };
        var ph = document.createElement('div');
        ph.className = 'video-consent';
        ph.innerHTML =
            '<p>' + t('videoBlocked').replace('{p}', info.name) + '</p>' +
            '<div class="video-consent__actions">' +
            '<button type="button" class="cc-btn" data-video-accept>' + t('videoAccept') + '</button>' +
            '<a class="cc-btn" href="' + info.url + '" target="_blank" rel="noopener noreferrer">' +
            t('videoExternal').replace('{p}', info.name) + '</a>' +
            '</div>';
        ph.querySelector('[data-video-accept]').addEventListener('click', function () {
            JBConsent.set({ video: true });
        });
        iframe.parentNode.appendChild(ph);
    }

    function openModal(modal) {
        modal.style.display = 'block';
        loadVideo(modal);
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        var iframe = modal.querySelector('iframe[data-src]');
        if (iframe) {
            iframe.setAttribute('src', '');
        }
        removePlaceholder(modal);
    }

    // Si cambia el consentimiento o el idioma con un vídeo abierto, se actualiza
    function refreshOpenModals() {
        document.querySelectorAll('.modal').forEach(function (modal) {
            if (modal.style.display === 'block') loadVideo(modal);
        });
    }
    document.addEventListener('jb:consent', refreshOpenModals);
    document.addEventListener('jb:lang', refreshOpenModals);

    // Get all links that open modals
    var links = document.querySelectorAll('.openModalLink');
    links.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            var modalId = this.getAttribute('data-modal');
            var modal = document.getElementById(modalId);
            if (modal) openModal(modal);
        });
    });

    // Get all span elements that close modals
    var spans = document.querySelectorAll('.close');
    spans.forEach(function (span) {
        span.addEventListener('click', function () {
            var modalId = this.getAttribute('data-modal');
            var modal = document.getElementById(modalId);
            if (modal) closeModal(modal);
        });
    });

    // Close the modal if user clicks outside of it
    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    };
});


//translation
document.addEventListener('DOMContentLoaded', function () {
    const langCurrent = document.getElementById('lang-current');
    const langDropdown = document.getElementById('lang-dropdown');

    function updateTranslations(translations, language) {
        const translation = translations[language];
        if (translation) {
            document.querySelectorAll('[data-section][data-translate]').forEach(element => {
                const section = element.getAttribute('data-section');
                const key = element.getAttribute('data-translate');
                if (translation[section] && translation[section][key]) {
                    const value = translation[section][key];
                    if (element.hasAttribute('data-translate-html')) {
                        element.innerHTML = value;
                    } else if (element.hasAttribute('data-translate-placeholder')) {
                        element.setAttribute('placeholder', value);
                    } else if (element.hasAttribute('data-translate-value')) {
                        element.setAttribute('value', value);
                    } else {
                        element.textContent = value;
                    }
                }
            });
        }
    }

    async function fetchTranslations() {
        try {
            const response = await fetch('translations.json');
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const translations = await response.json();

            const allLanguages = ['es', 'en', 'pt'];
            let currentLanguage = window.JBLang ? JBLang.get() : 'es';

            function setLanguage(lang, remember) {
                currentLanguage = lang;
                updateTranslations(translations, lang);
                if (window.JBLang) {
                    if (remember) JBLang.set(lang);
                    else document.documentElement.setAttribute('lang', lang);
                }
                langCurrent.textContent = lang.toUpperCase();
                langDropdown.innerHTML = allLanguages
                    .filter(l => l !== lang)
                    .map(l => `<div class="lang-selector__option" data-language="${l}">${l.toUpperCase()}</div>`)
                    .join('');
            }

            setLanguage(currentLanguage);

            langCurrent.addEventListener('click', function (e) {
                e.stopPropagation();
                langDropdown.classList.toggle('open');
            });

            langDropdown.addEventListener('click', function (e) {
                const option = e.target.closest('.lang-selector__option');
                if (option) {
                    setLanguage(option.getAttribute('data-language'), true);
                    langDropdown.classList.remove('open');
                }
            });

            document.addEventListener('click', function () {
                langDropdown.classList.remove('open');
            });

        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    fetchTranslations();
});

// Contact form — AJAX submit via Formspree
(function () {
    const successMessages = {
        en: 'Your message has been sent',
        es: 'Su mensaje ha sido enviado',
        pt: 'Sua mensagem foi enviada'
    };

    const form = document.querySelector('.contact-form');
    const successEl = document.getElementById('form-success');

    if (!form || !successEl) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const data = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const lang = (document.getElementById('lang-current')?.textContent || 'en').toLowerCase();
                successEl.textContent = successMessages[lang] || successMessages.en;
                successEl.style.display = 'block';
                form.reset();
            }
        } catch (err) {
            console.error('Form submission error:', err);
        }
    });
})();
