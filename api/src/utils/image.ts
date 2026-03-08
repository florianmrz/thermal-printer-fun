import sharp from 'sharp';

const MAX_FILE_WIDTH = 72 * 8; // 576px for 72mm printer at 8px/mm

export async function convertImageToPrintData(imageData: Uint8Array<ArrayBuffer>, ditherAlgorithm: 'floyd-steinberg' = 'floyd-steinberg'): Promise<Uint8Array<ArrayBuffer>[]> {
  const { data: sharpData, info: sharpInfo } = await sharp(imageData)
    .resize({ width: MAX_FILE_WIDTH, fit: 'inside', background: 'white' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const imageDataArray = new Uint8Array(sharpData);
  const ditheredData = ditherAlgorithm === 'floyd-steinberg' ? floydSteinberg({
    data: imageDataArray,
    width: sharpInfo.width,
    height: sharpInfo.height,
  }) : imageDataArray;

  sharp(ditheredData, {
    raw: {
      width: sharpInfo.width,
      height: sharpInfo.height,
      channels: 1,
    },
  }).toFile('./last-print.png');

  const rasterData: Uint8Array<ArrayBuffer>[] = [];
  const rasterDataChunkSize = sharpInfo.width / 8; // We can represent 8 pixels per byte

  for (let y = 0; y < sharpInfo.height; y++) {
    const rasterRow = new Uint8Array(rasterDataChunkSize);

    // Go through each chunk of 8 pixels
    for (let x = 0; x < rasterDataChunkSize; x++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const pixelIndex = y * sharpInfo.width + x * 8 + bit;
        const bitValue = ditheredData[pixelIndex] === 255 ? 0 : 1; // Black pixel -> 0, White pixel -> 1
        byte |= bitValue << (7 - bit);
      }
      rasterRow[x] = byte;
    }

    rasterData.push(rasterRow);
  }

  return rasterData;
}

function floydSteinberg({ data, width, height }: { data: Uint8Array; width: number; height: number }): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data);

  const threshold = 128;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = newData[idx];
      const newPixel = oldPixel < threshold ? 0 : 255;
      newData[idx] = newPixel;
      const quantError = oldPixel - newPixel;
      if (x + 1 < width) {
        newData[idx + 1] += (quantError / 16) * 7;
      }
      if (x - 1 >= 0 && y + 1 < height) {
        newData[idx + width - 1] += (quantError / 16) * 3;
      }
      if (y + 1 < height) {
        newData[idx + width] += (quantError / 16) * 5;
      }
      if (x + 1 < width && y + 1 < height) {
        newData[idx + width + 1] += (quantError / 16) * 1;
      }
    }
  }
  return newData;
}
