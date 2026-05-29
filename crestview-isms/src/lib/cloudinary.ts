export function cloudinaryImageUrl(publicId: string, width = 640, height = 640) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return "";
  }

  const params = `c_fill,g_auto,w_${width},h_${height},f_auto,q_auto`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${params}/${publicId}`;
}
