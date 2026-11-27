if (/^https?:$/.test(location.protocol) && !/(\/|\.html)$/.test(location.pathname)) {
    location.replace(location.pathname + '/' + location.search + location.hash);
}
