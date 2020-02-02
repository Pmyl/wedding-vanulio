const path = require('path');
const fs = require('fs');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');
const exec = require('child_process').exec;

ncp.limit = 16;

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error);
  process.exit(1);
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
  const enLanguageFolder = path.join(distPath, 'rsvp', 'language');
  const itLanguageFolder = path.join(itDistPath, 'rsvp', 'language');

  return copyBaseRsvpFiles(path.join(distPath, 'rsvp'), 'en')
    .then(() => copyBaseRsvpFiles(path.join(itDistPath, 'rsvp'), 'it'))
    .then(() => createFolder(enLanguageFolder))
    .then(() => copy(path.join(rsvpPath, 'language', 'en.json'), path.join(enLanguageFolder, 'language.json'), 'en language moved'))
    .then(() => createFolder(itLanguageFolder))
    .then(() => copy(path.join(rsvpPath, 'language', 'it.json'), path.join(itLanguageFolder, 'language.json'), 'it language moved'));
}

function copyBaseRsvpFiles(destination, language) {
  const baseFiles = ['index.html', 'rsvp.js', 'rsvp.css', 'favicon.gif'];
  const baseFolders = ['assets'];

  return createFolder(destination)
    .then(() => baseFiles.map(name => {
      return copy(path.join(rsvpPath, name), path.join(destination, name), `RSVP ${name} for ${language} moved`);
    }))
    .then(() => baseFolders.map(name => {
      return createFolder(path.join(destination, name))
        .then(() => copy(path.join(rsvpPath, name), path.join(destination, name), `RSVP ${name} for ${language} moved`));
    }));
}

function createFolder(dir) {
  console.info('Creating folder', dir);

  return new Promise(res => {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    res();
  });
}

function copy(from, to, successMessage) {
  console.info(`Copying from ${from} to ${to}`);
  return new Promise((res, rej) => {
    ncp(from, to, function (err) {
      if (err) {
        console.error(`Error copying from ${from} to ${to}`);
        return rej(err);
      }
      console.info(successMessage);
      res();
    });
  });
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
