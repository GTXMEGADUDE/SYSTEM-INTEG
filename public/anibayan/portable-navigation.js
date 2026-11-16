// Keeps main-application links from becoming broken local-file URLs.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || !/^\/(?!\/)/.test(link.getAttribute('href'))) return;
  event.preventDefault();
  const origin = window.ANIBAYAN_APP_ORIGIN || '';
  if (/^https?:\/\//.test(origin)) {
    location.href = origin.replace(/\/$/, '') + link.getAttribute('href');
    return;
  }
  let notice = document.getElementById('application-link-notice');
  if (!notice) {
    notice = document.createElement('dialog');
    notice.id = 'application-link-notice';
    notice.setAttribute('aria-labelledby', 'application-link-title');
    notice.style.cssText = 'padding:32px;max-width:500px;width:90%;border:1px solid #dce5d7;border-radius:20px;color:#214c35;background:white;font:16px/1.6 Arial,sans-serif;box-sizing:border-box';
    notice.innerHTML = '<h2 id="application-link-title" style="font:600 23px/1.3 Arial,sans-serif;margin:0 0 16px">Continue in the AniBayan app</h2><p style="margin:0 0 24px">This package contains design previews only. The marketplace and account services belong to the main AniBayan application.</p><form method="dialog"><button style="padding:12px 20px;border:0;border-radius:24px;background:#214c35;color:white;cursor:pointer;font:16px Arial,sans-serif">Back to preview</button></form>';
    document.body.appendChild(notice);
  }
  notice.showModal();
}, true);
