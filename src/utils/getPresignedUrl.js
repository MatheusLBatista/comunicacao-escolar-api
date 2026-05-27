const PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT;

const getPresignedUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (!PUBLIC_ENDPOINT) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const publicEndpoint = new URL(PUBLIC_ENDPOINT);
    url.hostname = publicEndpoint.hostname;
    url.port = publicEndpoint.port;
    url.protocol = publicEndpoint.protocol;
    return url.toString();
  } catch {
    return rawUrl;
  }
};

export default getPresignedUrl;
