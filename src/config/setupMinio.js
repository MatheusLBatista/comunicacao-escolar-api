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

  const publicReadPolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });

  try {
    const exists = await minioClient.bucketExists(bucketName);

    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.info(`Bucket "${bucketName}" criado com sucesso no MinIO/S3.`);
    } else {
      console.info(`Bucket "${bucketName}" já existe no MinIO/S3.`);
    }

    await minioClient.setBucketPolicy(bucketName, publicReadPolicy);
    console.info(`Política de leitura pública aplicada ao bucket "${bucketName}".`);

  } catch (erro) {
    throw new Error(
      `Erro ao verificar/criar o bucket "${bucketName}": ${erro.message}`,
    );
  }
}

export default setupMinio;