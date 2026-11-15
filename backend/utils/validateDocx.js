const yauzl = require('yauzl');
const httpError = require('./httpError');
module.exports = function validateDocx(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error) return reject(httpError(400, 'Invalid DOCX archive'));
      let bytes = 0,
        entries = 0,
        hasDocument = false,
        settled = false;
      function fail(status, message) {
        if (!settled) {
          settled = true;
          zip.close();
          reject(httpError(status, message));
        }
      }
      zip.on('error', () => fail(400, 'Invalid DOCX archive'));
      zip.on('entry', (entry) => {
        if (
          ++entries > 2000 ||
          entry.uncompressedSize > 20 * 1024 * 1024 ||
          entry.generalPurposeBitFlag & 1
        )
          return fail(413, 'DOCX archive is too large or encrypted');
        if (entry.fileName === 'word/document.xml') hasDocument = true;
        if (/\/$/.test(entry.fileName)) return zip.readEntry();
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return fail(400, 'Invalid DOCX archive');
          stream.on('data', (chunk) => {
            bytes += chunk.length;
            if (bytes > 20 * 1024 * 1024) {
              stream.destroy();
              fail(413, 'DOCX expanded content is too large');
            }
          });
          stream.on('error', () => fail(400, 'Invalid DOCX archive'));
          stream.on('end', () => {
            if (!settled) zip.readEntry();
          });
        });
      });
      zip.on('end', () => {
        if (!settled) {
          settled = true;
          hasDocument
            ? resolve()
            : reject(httpError(400, 'Archive does not contain a Word document'));
        }
      });
      zip.readEntry();
    });
  });
};
