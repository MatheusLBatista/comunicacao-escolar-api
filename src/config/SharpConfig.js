import sharp from 'sharp';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

export default async function compress(file) {
  const metadata = await sharp(file).metadata();

  switch (metadata.format) {
    case 'jpeg' || 'jpeg': {
      const arq = await sharp(file)
        .resize({ width: 1024 })
        .jpeg({ quality: 80, compressionLevel: 9 })
        .toBuffer();

      return [arq, metadata];
    }

    case 'png': {
      const arq = await sharp(file)
        .resize({ width: 1024 })
        .png({ compressionLevel: 9, palette: true })
        .toBuffer();

      return [arq, metadata];
    }

    case 'webp': {
      const arq = await sharp(file)
        .resize({ width: 1024 })
        .webp({ quality: 80 })
        .toBuffer();

      return [arq, metadata];
    }
    default: {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'unsupportedMediaType',
        field: 'Imagem',
        details: [
          {
            path: 'Imagem',
            message: `Formato de arquivo não suportado: ${metadata.format}`,
          },
        ],
        customMessage: `O formato de imagem '${metadata.format}' não é suportado. Use: JPEG, PNG ou WEBP.`,
      });
    }
  }
}
