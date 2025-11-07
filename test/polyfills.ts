try {
  const { FormData } = require('undici');
  if (!global.FormData) {
    // @ts-ignore
    global.FormData = FormData;
  }
} catch {
  require('formdata-polyfill/auto');
}
