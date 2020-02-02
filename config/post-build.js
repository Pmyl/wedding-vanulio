const path = require('path');
const fs = require('fs');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');
const exec = require('child_process').exec;

ncp.limit = 16;

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error);
});

const distPath = path.join(__dirname, '..', 'dist');
const basePath = path.join(__dirname, '..');
const rsvpPath = path.join(basePath, 'rsvp');

(async function init() {
  await repairBaseHrefOfIndexes();
  await moveLocaleToBasePath('en');
  await applyRsvpPage();
})();

async function moveLocaleToBasePath(locale) {
  const distLocalePath = path.join(distPath, locale);

  console.info("Moving", distLocalePath, "into main dist.");

  return new Promise((res, rej) => {
    ncp(distLocalePath, distPath, function (err) {
      if (err) {
        return rej(err);
      }
      console.info("Locale", locale, "moved.");
      res();
    });
  }).then(() => {
    console.info("Removing locale folder", distLocalePath);

    return new Promise((res) => {
      rimraf(distLocalePath, () => {
        console.info("Locale folder", distLocalePath, "removed");
        res();
      });
    });
  });
}

async function repairBaseHrefOfIndexes() {
  const some = await (Promise.all(
    getIndexPaths()
      .map(readFileContent)
  ));

  await Promise.all(
    some
      .map(repairBaseHref)
      .map(replaceIndexFile)
  );
}

async function applyRsvpPage() {
  await compileScss();

  const itDistPath = path.join(distPath, 'it');

  const enRsvp = new Promise((res, rej) => {
    ncp(rsvpPath, path.join(distPath, 'rsvp'), function (err) {
      if (err) {
        return rej(err);
      }
      console.info("RSVP en moved.");
      res();
    });
  });

  const itRsvp = new Promise((res, rej) => {
    ncp(rsvpPath, path.join(itDistPath, 'rsvp'), function (err) {
      if (err) {
        return rej(err);
      }
      console.info("RSVP it moved.");
      res();
    });
  });

  return Promise.all([enRsvp, itRsvp]);
}

async function compileScss() {
  console.info('Compiling rsvp scss');
  return new Promise((res) => {
    console.info('Rsvp scss compiled');
    exec(`npx sass --no-source-map ${path.join(rsvpPath, 'rsvp.scss')} ${path.join(rsvpPath, 'rsvp.css')}`, () => {
      res();
    });
  });
}

function getIndexPaths() {
  return [path.join(distPath, 'en', 'index.html'), path.join(distPath, 'it', 'index.html')];
}

async function readFileContent(path) {
  console.info('Reading file', path);

  return {
    path: path,
    content: await fs.promises.readFile(path, 'utf8')
  };
}

function repairBaseHref(indexFile) {
  const regex = /<base href="[\w/.]+">/g;
  const regexExecution = regex.exec(indexFile.content);
  const correctBaseHref = '<base href="./">';

  console.info('Repairing index', indexFile.path);

  if (regexExecution) {
    console.info('Found base href', regexExecution[0], "replacing it with", correctBaseHref);
  } else {
    throw new Error('Base href not found in index');
  }

  return {
    path: indexFile.path,
    content: indexFile.content.replace(regexExecution[0], correctBaseHref)
  };
}

async function replaceIndexFile(indexFile) {
  return await fs.promises.writeFile(indexFile.path, indexFile.content);
}
