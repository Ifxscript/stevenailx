/**
 * Shared ImgBB upload utility for admin components.
 * Reads the API key from .env (VITE_IMGBB_API_KEY).
 */
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const uploadToImgBB = async (file) => {
  if (!IMGBB_API_KEY) {
    throw new Error("ImgBB API key not found. Check your .env file.");
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (!result.success) throw new Error("ImgBB upload failed");

  // Use medium (compressed) URL when ImgBB generates one — significantly smaller
  // file size for mobile users. Falls back to original if medium isn't generated.
  return result.data.medium?.url || result.data.url;
};
