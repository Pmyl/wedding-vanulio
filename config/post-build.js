const path = require('path');
const fs = require('fs');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');

ncp.limit = 16;

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error);
});

const distPath = path.join(__dirname, '..', 'dist');

(async function init() {
  await repairBaseHrefOfIndexes();
  await moveLocaleToBasePath('en');
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
