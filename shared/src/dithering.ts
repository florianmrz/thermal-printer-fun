export function floydSteinberg({
  data,
  width,
  height,
}: {
  data: Uint8Array;
  width: number;
  height: number;
}): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data);

  const threshold = 128;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = newData[idx] ?? 0;
      const newPixel = oldPixel < threshold ? 0 : 255;
      newData[idx] = newPixel;
      const quantError = oldPixel - newPixel;
      if (x + 1 < width) {
        newData[idx + 1] = (newData[idx + 1] ?? 0) + (quantError / 16) * 7;
      }
      if (x - 1 >= 0 && y + 1 < height) {
        newData[idx + width - 1] = (newData[idx + width - 1] ?? 0) + (quantError / 16) * 3;
      }
      if (y + 1 < height) {
        newData[idx + width] = (newData[idx + width] ?? 0) + (quantError / 16) * 5;
      }
      if (x + 1 < width && y + 1 < height) {
        newData[idx + width + 1] = (newData[idx + width + 1] ?? 0) + (quantError / 16) * 1;
      }
    }
  }
  return newData;
}
