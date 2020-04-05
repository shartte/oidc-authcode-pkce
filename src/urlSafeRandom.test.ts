import urlSafeRandom from "./urlSafeRandom";
import { base64UrlDecode } from "./base64";

// NOTE: Testing the strength of the browser's randomness is not the point of these tests
//       They act more like smoke tests to figure out when a browser's crypto.getRandomValues function
//       outright doesn't work.

describe("URL-safe random data", function () {
  it(`not the same for consecutive calls`, () => {
    const first = urlSafeRandom(8);
    const second = urlSafeRandom(8);
    expect(first).not.toBe(second);
  });

  it(`matches length of base64 encoding for desired entropy`, () => {
    // Lengths are without padding
    expect(base64UrlDecode(urlSafeRandom(32)).length).toBe(32);
    expect(base64UrlDecode(urlSafeRandom(16)).length).toBe(16);
    expect(base64UrlDecode(urlSafeRandom(8)).length).toBe(8);
  });
});
