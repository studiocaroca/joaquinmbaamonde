/* Páginas legales: muestra la versión del idioma elegido y traduce el pie. */
(function () {
    'use strict';

    var FOOTER = {
        es: { legal: 'Aviso legal', privacy: 'Política de privacidad', cookies: 'Política de cookies', cookieSettings: 'Configurar cookies', designedBy: 'Diseñado por', back: 'Volver a la web' },
        en: { legal: 'Legal notice', privacy: 'Privacy policy', cookies: 'Cookie policy', cookieSettings: 'Cookie settings', designedBy: 'Designed by', back: 'Back to website' },
        pt: { legal: 'Aviso legal', privacy: 'Política de privacidade', cookies: 'Política de cookies', cookieSettings: 'Configurar cookies', designedBy: 'Desenvolvido por', back: 'Voltar ao site' }
    };

    function apply(lang) {
        document.querySelectorAll('[data-lang-block]').forEach(function (el) {
            el.hidden = el.getAttribute('data-lang-block') !== lang;
        });
        document.querySelectorAll('.legal-langs button').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-language') === lang ? 'true' : 'false');
        });
        var dict = FOOTER[lang] || FOOTER.es;
        document.querySelectorAll('[data-section="footer"][data-translate]').forEach(function (el) {
            var v = dict[el.getAttribute('data-translate')];
            if (v) el.textContent = v;
        });
        var active = document.querySelector('[data-lang-block="' + lang + '"] h1');
        if (active) document.title = active.textContent + ' | Joaquín M. Baamonde';
    }

    document.addEventListener('DOMContentLoaded', function () {
        apply(JBLang.get());
        document.querySelectorAll('.legal-langs button').forEach(function (b) {
            b.addEventListener('click', function () { JBLang.set(b.getAttribute('data-language')); });
        });
        document.addEventListener('jb:lang', function (e) { apply(e.detail); });
    });
})();
