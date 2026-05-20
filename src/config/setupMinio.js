import minioClient from './MinIO.js';

async function setupMinio() {
  const bucketName = process.env.MINIO_BUCKET;

  if (!bucketName) {
    throw new Error(
      'A variável de ambiente do nome do bucket do MinIO não está definida.',
    );
  }

  if (!minioClient) {
    throw new Error(
      'A variável de ambiente do cliente do MinIO não está definida.',
    );
  }

  try {
    const exists = await minioClient.bucketExists(bucketName);

    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.info(`Bucket "${bucketName}" criado com sucesso no MinIO.`);
    } else {
      console.info(`Bucket "${bucketName}" já existe no MinIO.`);
    }

    const avatarsPolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/avatars/*`],
        },
      ],
    });
    await minioClient.setBucketPolicy(bucketName, avatarsPolicy);
    console.info(`Política de leitura pública aplicada em "${bucketName}/avatars/".`);
  } catch (erro) {
    throw new Error(
      `Erro ao verificar/criar o bucket "${bucketName}": ${erro.message}`,
    );
  }
}

export default setupMinio;
