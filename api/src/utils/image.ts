import sharp from 'sharp';
import { env } from '../env.js';
import { floydSteinberg } from '@thermal-printer-fun/shared';

const MAX_FILE_WIDTH = 72 * 8; // 576px for 72mm printer at 8px/mm

export async function convertImageToPrintData(
  imageData: Uint8Array<ArrayBuffer>,
  ditherAlgorithm: 'floyd-steinberg' = 'floyd-steinberg'
): Promise<Uint8Array<ArrayBuffer>[]> {
  const { data: sharpData, info: sharpInfo } = await sharp(imageData)
    .resize({ width: MAX_FILE_WIDTH, fit: 'inside', background: 'white' })
    .flatten({ background: 'white' }) // Removes alpha channel if present, filling with white
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const imageDataArray = new Uint8Array(sharpData);
  const ditheredData =
    ditherAlgorithm === 'floyd-steinberg'
      ? floydSteinberg({
          data: imageDataArray,
          width: sharpInfo.width,
          height: sharpInfo.height,
        })
      : imageDataArray;

  if (env.ENV === 'development') {
    sharp(ditheredData, {
      raw: {
        width: sharpInfo.width,
        height: sharpInfo.height,
        channels: 1,
      },
    }).toFile('./last-dithered.png');
  }

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
