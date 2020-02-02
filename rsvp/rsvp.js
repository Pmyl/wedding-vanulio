document.addEventListener("DOMContentLoaded", async () => {
  const language = await fetch('./language/language.json').then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return fetch('./language/it.json').then(r => r.json());
    }
  });

  const names = await getNames();

  setText('rsvp-respondez', language.respondez);
  setText('rsvp-time', language.time);
  setText('rsvp-name', language.name1 + humanize(names, language.and) + (names.length === 1 ? language.name2 : language.name2_p));
  setText('rsvp-send', language.send);
  setText('rsvp-privately', language.privately);
  setText('rsvp-website-visit', language.visit);
  setText('rsvp-website-link', language.website);
  setHref('rsvp-website-link', language.link);
});

function getNames() {
  const urlParams = new URLSearchParams(window.location.search);
  const myParam = urlParams.get('w');
  const payload = JSON.stringify({ token: myParam });

  return fetch('https://wedding-vanulio.glitch.me/sendmethedata', {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error('Something happened fetching data');
    }
  }).then(names => names.map(n => `${n.firstName} ${n.lastName}`));
}

function setText(elementClassName, text) {
  document.getElementsByClassName(elementClassName)[0].innerHTML = text;
}

function setHref(elementClassName, href) {
  document.getElementsByClassName(elementClassName)[0].href = href;
}

function humanize(names, finalSeparator) {
  const allButLast = names.slice(0, names.length - 1);

  return [allButLast.join(', '), names[names.length - 1]].filter(Boolean).join(` ${finalSeparator} `);
}
