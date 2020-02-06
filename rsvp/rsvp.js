document.addEventListener("DOMContentLoaded", async () => {
  const startTime = Date.now();

  try {
    const language = await fetch('./language/language.json').then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return fetch('./language/it.json').then(r => {
          if (r.ok) {
            return r.json();
          } else {
            throw new Error();
          }
        });
      }
    });
    setText('rsvp-respondez', language.respondez);
    setText('rsvp-time', language.time);
    setText('rsvp-send', language.send);
    setText('rsvp-privately', language.privately);
    setText('rsvp-website-visit', language.visit);
    setText('rsvp-website-link', language.website);
    setText('rsvp-error-message', language.error);
    setHref('rsvp-website-link', language.link);

    const names = await getNames();

    setText('rsvp-name', language.name1 + bold(humanize(names, language.and)) + '!' + newLine() +  (names.length === 1 ? language.name2 : language.name2_p));
    runAtLeastAfter(startTime, 3000, () => addClass('rsvp-card', 'data-loaded'));
  } catch {
    addClass('rsvp-error-message', 'show');
  }
});

function runAtLeastAfter(startTime, delayInMs, toRun) {
  const timePassed = Date.now() - startTime;
  const delay = delayInMs - timePassed < 0 ? 0 : delayInMs - timePassed;
  setTimeout(toRun, delay);
}

function getNames() {
  const urlParams = new URLSearchParams(window.location.search);
  const myParam = urlParams.get('w');
  const payload = JSON.stringify({ token: myParam });

  return fetch('https://wedding-vanulio.herokuapp.com/sendmethedata', {
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

function addClass(elementClassName, classToAdd) {
  document.getElementsByClassName(elementClassName)[0].classList.add(classToAdd);
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

function bold(content) {
  return `<b>${content}</b>`;
}

function newLine() {
  return '<br />';
}
