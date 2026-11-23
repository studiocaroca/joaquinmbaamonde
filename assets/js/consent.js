/*
 * Idioma + consentimiento de cookies (RGPD / LSSI-CE / guía AEPD)
 *
 * - JBLang: idioma de la web. Usa el elegido por el visitante; si no hay,
 *   el del navegador (es / pt / en) y, por defecto, español.
 * - JBConsent: guarda la elección de cookies y bloquea los vídeos de
 *   Vimeo / YouTube hasta que el visitante acepte la categoría "vídeo".
 *   Aceptar, Rechazar y Configurar se muestran con el mismo peso visual.
 *
 * Almacenamiento propio (técnico, no requiere consentimiento):
 *   jb_cookie_consent  -> elección de cookies (caduca a los 12 meses)
 *   jb_lang            -> idioma elegido
 */
(function () {
    'use strict';

    var LANGS = ['es', 'en', 'pt'];
    var LANG_KEY = 'jb_lang';
    var CONSENT_KEY = 'jb_cookie_consent';
    var CONSENT_VERSION = 1;
    var CONSENT_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 12 meses

    function store(key, value) {
        try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch (e) { /* modo privado o almacenamiento bloqueado */ }
    }

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    /* ---------------- Idioma ---------------- */

    function detectLang() {
        var list = navigator.languages || [navigator.language || ''];
        for (var i = 0; i < list.length; i++) {
            var code = String(list[i]).slice(0, 2).toLowerCase();
            if (LANGS.indexOf(code) !== -1) return code;
        }
        return 'es';
    }

    var JBLang = {
        list: LANGS.slice(),
        get: function () {
            var saved = read(LANG_KEY);
            return LANGS.indexOf(saved) !== -1 ? saved : detectLang();
        },
        set: function (lang) {
            if (LANGS.indexOf(lang) === -1) return;
            store(LANG_KEY, lang);
            document.documentElement.setAttribute('lang', lang);
            document.dispatchEvent(new CustomEvent('jb:lang', { detail: lang }));
        }
    };
    window.JBLang = JBLang;
    document.documentElement.setAttribute('lang', JBLang.get());

    /* ---------------- Textos ---------------- */

    var T = {
        es: {
            title: 'Cookies',
            text: 'Usamos cookies propias, técnicas, para el funcionamiento de la web y, si lo aceptas, cookies de terceros (Vimeo y YouTube) para mostrar contenido de vídeo. Puedes aceptarlas, rechazarlas o configurarlas. Más información en la <a href="politica-cookies.html">Política de cookies</a>.',
            accept: 'Aceptar', reject: 'Rechazar', configure: 'Configurar', save: 'Guardar selección',
            settingsTitle: 'Configurar cookies',
            settingsText: 'Elige qué cookies permites. Puedes cambiar tu decisión en cualquier momento desde el enlace «Configurar cookies» del pie de página.',
            techName: 'Técnicas (necesarias)',
            techDesc: 'Recuerdan tu elección de cookies y tu idioma. Son imprescindibles y no se pueden desactivar.',
            videoName: 'Vídeo de terceros (Vimeo y YouTube)',
            videoDesc: 'Permiten reproducir los vídeos de los proyectos. Vimeo y YouTube pueden instalar sus propias cookies al reproducirlos.',
            alwaysOn: 'Siempre activas',
            close: 'Cerrar',
            videoBlocked: 'Este vídeo está alojado en {p}, que puede instalar cookies de terceros. Para verlo aquí, acepta las cookies de vídeo.',
            videoAccept: 'Aceptar cookies de vídeo',
            videoExternal: 'Ver en {p}'
        },
        en: {
            title: 'Cookies',
            text: 'We use our own technical cookies to make the website work and, if you accept, third-party cookies (Vimeo and YouTube) to show video content. You can accept, reject or configure them. More information in the <a href="politica-cookies.html">Cookie Policy</a>.',
            accept: 'Accept', reject: 'Reject', configure: 'Configure', save: 'Save selection',
            settingsTitle: 'Cookie settings',
            settingsText: 'Choose which cookies you allow. You can change your decision at any time from the “Cookie settings” link in the footer.',
            techName: 'Technical (necessary)',
            techDesc: 'They remember your cookie choice and your language. They are essential and cannot be disabled.',
            videoName: 'Third-party video (Vimeo and YouTube)',
            videoDesc: 'They allow the project videos to play. Vimeo and YouTube may set their own cookies when playing them.',
            alwaysOn: 'Always active',
            close: 'Close',
            videoBlocked: 'This video is hosted on {p}, which may set third-party cookies. To watch it here, accept video cookies.',
            videoAccept: 'Accept video cookies',
            videoExternal: 'Watch on {p}'
        },
        pt: {
            title: 'Cookies',
            text: 'Usamos cookies próprios, técnicos, para o funcionamento do site e, se você aceitar, cookies de terceiros (Vimeo e YouTube) para mostrar conteúdo de vídeo. Você pode aceitá-los, rejeitá-los ou configurá-los. Mais informações na <a href="politica-cookies.html">Política de cookies</a>.',
            accept: 'Aceitar', reject: 'Rejeitar', configure: 'Configurar', save: 'Salvar seleção',
            settingsTitle: 'Configurar cookies',
            settingsText: 'Escolha quais cookies você permite. Você pode mudar sua decisão a qualquer momento pelo link “Configurar cookies” no rodapé.',
            techName: 'Técnicos (necessários)',
            techDesc: 'Lembram sua escolha de cookies e seu idioma. São imprescindíveis e não podem ser desativados.',
            videoName: 'Vídeo de terceiros (Vimeo e YouTube)',
            videoDesc: 'Permitem reproduzir os vídeos dos projetos. Vimeo e YouTube podem instalar seus próprios cookies ao reproduzi-los.',
            alwaysOn: 'Sempre ativos',
            close: 'Fechar',
            videoBlocked: 'Este vídeo está hospedado no {p}, que pode instalar cookies de terceiros. Para assisti-lo aqui, aceite os cookies de vídeo.',
            videoAccept: 'Aceitar cookies de vídeo',
            videoExternal: 'Ver no {p}'
        }
    };

    function t(key) {
        var lang = JBLang.get();
        return (T[lang] && T[lang][key]) || T.es[key];
    }

    /* ---------------- Consentimiento ---------------- */

    function loadConsent() {
        var raw = read(CONSENT_KEY);
        if (!raw) return null;
        try {
            var c = JSON.parse(raw);
            if (c.v !== CONSENT_VERSION) return null;
            if (!c.date || Date.now() - new Date(c.date).getTime() > CONSENT_MAX_AGE) return null;
            return c;
        } catch (e) { return null; }
    }

    var JBConsent = {
        get: loadConsent,
        has: function (category) {
            var c = loadConsent();
            return !!(c && c[category]);
        },
        set: function (choices) {
            var c = { v: CONSENT_VERSION, video: !!choices.video, date: new Date().toISOString() };
            store(CONSENT_KEY, JSON.stringify(c));
            hideBanner();
            closeSettings();
            document.dispatchEvent(new CustomEvent('jb:consent', { detail: c }));
        },
        acceptAll: function () { JBConsent.set({ video: true }); },
        rejectAll: function () { JBConsent.set({ video: false }); },
        openSettings: function () { openSettings(); },
        t: t
    };
    window.JBConsent = JBConsent;

    /* ---------------- Interfaz ---------------- */

    var banner, settings, lastFocus;

    function buttons(withSave) {
        return '' +
            '<div class="cc-actions">' +
            '<button type="button" class="cc-btn" data-cc="accept">' + t('accept') + '</button>' +
            '<button type="button" class="cc-btn" data-cc="reject">' + t('reject') + '</button>' +
            (withSave
                ? '<button type="button" class="cc-btn" data-cc="save">' + t('save') + '</button>'
                : '<button type="button" class="cc-btn" data-cc="configure">' + t('configure') + '</button>') +
            '</div>';
    }

    function renderBanner() {
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'cc-banner';
            banner.setAttribute('role', 'region');
            banner.setAttribute('aria-label', 'Cookies');
            document.body.appendChild(banner);
            banner.addEventListener('click', onAction);
        }
        banner.innerHTML =
            '<div class="cc-banner__inner">' +
            '<p class="cc-text">' + t('text') + '</p>' +
            buttons(false) +
            '</div>';
    }

    function renderSettings() {
        if (!settings) {
            settings = document.createElement('div');
            settings.className = 'cc-settings';
            settings.setAttribute('role', 'dialog');
            settings.setAttribute('aria-modal', 'true');
            settings.setAttribute('aria-labelledby', 'cc-settings-title');
            document.body.appendChild(settings);
            settings.addEventListener('click', function (e) {
                if (e.target === settings) closeSettings();
                onAction(e);
            });
            settings.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeSettings();
            });
        }
        var current = loadConsent();
        var videoOn = current ? current.video : false;
        settings.innerHTML =
            '<div class="cc-settings__box">' +
            '<button type="button" class="cc-close" data-cc="close" aria-label="' + t('close') + '">&times;</button>' +
            '<h2 id="cc-settings-title">' + t('settingsTitle') + '</h2>' +
            '<p>' + t('settingsText') + '</p>' +
            '<div class="cc-cat">' +
            '<div class="cc-cat__head"><strong>' + t('techName') + '</strong><span class="cc-always">' + t('alwaysOn') + '</span></div>' +
            '<p>' + t('techDesc') + '</p>' +
            '</div>' +
            '<div class="cc-cat">' +
            '<label class="cc-cat__head" for="cc-video"><strong>' + t('videoName') + '</strong>' +
            '<span class="cc-switch"><input type="checkbox" id="cc-video"' + (videoOn ? ' checked' : '') + '><span class="cc-switch__ui" aria-hidden="true"></span></span>' +
            '</label>' +
            '<p>' + t('videoDesc') + '</p>' +
            '</div>' +
            buttons(true) +
            '</div>';
    }

    function onAction(e) {
        var btn = e.target.closest('[data-cc]');
        if (!btn) return;
        var action = btn.getAttribute('data-cc');
        if (action === 'accept') JBConsent.acceptAll();
        else if (action === 'reject') JBConsent.rejectAll();
        else if (action === 'configure') openSettings();
        else if (action === 'close') closeSettings();
        else if (action === 'save') {
            var box = document.getElementById('cc-video');
            JBConsent.set({ video: !!(box && box.checked) });
        }
    }

    function showBanner() { renderBanner(); banner.hidden = false; }
    function hideBanner() { if (banner) banner.hidden = true; }

    function openSettings() {
        lastFocus = document.activeElement;
        renderSettings();
        settings.classList.add('is-open');
        var first = settings.querySelector('input, button');
        if (first) first.focus();
    }

    function closeSettings() {
        if (!settings || !settings.classList.contains('is-open')) return;
        settings.classList.remove('is-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function init() {
        // Año del pie de página
        document.querySelectorAll('[data-year]').forEach(function (el) {
            el.textContent = new Date().getFullYear();
        });

        // Enlaces "Configurar cookies"
        document.addEventListener('click', function (e) {
            var link = e.target.closest('[data-cookie-settings]');
            if (link) { e.preventDefault(); openSettings(); }
        });

        if (!loadConsent()) showBanner();

        // Re-traducir banner / panel al cambiar de idioma
        document.addEventListener('jb:lang', function () {
            if (banner && !banner.hidden) renderBanner();
            if (settings && settings.classList.contains('is-open')) renderSettings();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
