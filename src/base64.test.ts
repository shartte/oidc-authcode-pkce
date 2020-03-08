import { base64UrlDecode, base64UrlEncode } from "./base64";

describe("URL-safe base64 encoding", function() {
  // Generate a test array pattern containing the full range of 0-255
  const input = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    input[i] = i;
  }

  const expectedWithPadding =
    "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn-AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq-wsbKztLW2t7i5uru8vb6_wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t_g4eLj5OXm5-jp6uvs7e7v8PHy8_T19vf4-fr7_P3-_w==";
  it(`Encodes with padding`, () => {
    expect(base64UrlEncode(input, true)).toBe(expectedWithPadding);
  });

  it(`Decodes with padding`, () => {
    expect(base64UrlDecode(expectedWithPadding)).toEqual(input);
  });

  // Same as above, just missing the trailing ==
  const expectedWithoutPadding =
    "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn-AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq-wsbKztLW2t7i5uru8vb6_wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t_g4eLj5OXm5-jp6uvs7e7v8PHy8_T19vf4-fr7_P3-_w";
  it(`Encodes without padding`, () => {
    expect(base64UrlEncode(input, false)).toBe(expectedWithoutPadding);
  });

  it(`Decodes without padding`, () => {
    expect(base64UrlDecode(expectedWithoutPadding)).toEqual(input);
  });
});
