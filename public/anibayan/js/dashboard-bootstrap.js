(function () {
    var ready = new Promise(function (done) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', done, { once: true });
        } else {
            done();
        }
    });
    var state = fetch('../api/state', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
    }).then(function (response) {
        return response.ok ? response.json() : null;
    }).catch(function () {
        return null;
    });

    Promise.all([state, ready]).then(function (values) {
        window.anibayanState = values[0];
        var script = document.createElement('script');
        script.src = 'js/dashboards.js?v=20261127-payment-method';
        document.body.appendChild(script);
    });
})();
