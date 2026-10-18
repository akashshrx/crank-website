// Glide is a Mac app. On a phone or tablet a Download button can't do anything useful (a .dmg
// won't open there), so on those devices the buttons open a small sheet that sends the link on
// to the visitor's Mac instead: the system share sheet where the browser has one, copy otherwise.
// Macs and other desktops are untouched and download as before.
(function () {
  var ua = navigator.userAgent || '';
  // iPadOS reports itself as a Mac; touch points give it away.
  var isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (!/iPhone|iPad|iPod|Android|Mobile/i.test(ua) && !isIPadOS) return;

  var LINK = 'https://justglide.app/';
  var sheet = null;
  var lastFocus = null;

  function build() {
    sheet = document.createElement('div');
    sheet.className = 'mac-only-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'mac-only-title');
    sheet.innerHTML =
      '<div class="mac-only-backdrop" data-close></div>' +
      '<div class="mac-only-card">' +
        '<h2 id="mac-only-title">Glide is made for Mac</h2>' +
        '<p>Send yourself the link and open it on your Mac to download Glide.</p>' +
        '<div class="mac-only-actions">' +
          (navigator.share ? '<button type="button" class="btn btn-primary mac-only-share">Send link to my Mac</button>' : '') +
          '<button type="button" class="btn ' + (navigator.share ? 'btn-secondary' : 'btn-primary') + ' mac-only-copy">Copy link</button>' +
          '<button type="button" class="mac-only-close" data-close>Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(sheet);

    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });
    var share = sheet.querySelector('.mac-only-share');
    if (share) {
      share.addEventListener('click', function () {
        navigator.share({ title: 'Glide for Mac', text: 'Download Glide on my Mac', url: LINK })
          .then(close)
          .catch(function () { /* the visitor dismissed the share sheet; leave ours open */ });
      });
    }
    var copy = sheet.querySelector('.mac-only-copy');
    copy.addEventListener('click', function () {
      var done = function () { copy.textContent = 'Link copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(LINK).then(done, function () { copy.textContent = LINK; });
      } else {
        copy.textContent = LINK;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) close();
    });
  }

  function open() {
    if (!sheet) build();
    lastFocus = document.activeElement;
    var copy = sheet.querySelector('.mac-only-copy');
    copy.textContent = 'Copy link';
    sheet.classList.add('open');
    (sheet.querySelector('.mac-only-share') || copy).focus();
  }

  function close() {
    sheet.classList.remove('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href$="/download/mac"]');
    if (!a) return;
    // Nothing downloads on a phone, so the click stops here: no navigation, and the buttons' own
    // handlers (the "Download started" toast in app.js) never hear about it.
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);
})();
