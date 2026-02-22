import sharp from "sharp";

export default async function compress(arquivo){
    const novoArquivo = await sharp(arquivo)
            .resize({ width: 1024 })
            .jpeg({ quality: 80, compressionLevel: 9})
            .toBuffer();


    return novoArquivo;
}
