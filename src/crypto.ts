let getRandomValues: Crypto["getRandomValues"];
let digest: SubtleCrypto["digest"];

// The following mumbo-jumbo is only needed to support IE11
if (window.crypto) {
  getRandomValues = window.crypto.getRandomValues.bind(window.crypto);
  digest = window.crypto.subtle.digest.bind(window.crypto.subtle);
} else {
  // No types are available for this, sadly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msCrypto = (window as any).msCrypto;
  if (!msCrypto) {
    throw new Error("WebCrypto API not supported.");
  }

  // This function does not need to be adapted
  getRandomValues = msCrypto.getRandomValues.bind(msCrypto);

  // digest will return a "CryptoOperation"
  // most info on MSDN is gone
  // See i.e.: https://github.com/aws/aws-sdk-js-crypto-helpers/blob/master/packages/ie11-detection/src/CryptoOperation.ts
  digest = (algorithm, data): ReturnType<typeof digest> => {
    // Note that we DO rely on a Promise polyfill for this
    return new Promise((resolve, reject) => {
      const op = msCrypto.subtle.digest(algorithm, data);
      op.onabort = reject;
      op.onerror = reject;
      op.oncomplete = (): void => resolve(op.result);
    });
  };
}

export { getRandomValues, digest };
