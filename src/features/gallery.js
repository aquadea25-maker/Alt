import { supabase } from '../lib/supabase.js';
import { getSession } from '../lib/auth.js';
import { escapeHtml, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

// Default placeholder photos shown when no user uploads exist
const DEFAULT_PHOTOS = [
  {
    image_url: "https://images.pexels.com/photos/30016033/pexels-photo-30016033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    caption: "A couple romantically embracing in an open field",
    isUpload: false,
  },
  {
    image_url: "https://images.pexels.com/photos/1174958/pexels-photo-1174958.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    caption: "A couple enjoying a cozy moment on a park bench",
    isUpload: false,
  },
  {
    image_url: "https://images.pexels.com/photos/29189812/pexels-photo-29189812.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    caption: "A romantic couple embracing outdoors in warm sunlight",
    isUpload: false,
  },
];

/**
 * Initialize the Gallery page.
 */
export function initGallery() {
  const galleryGrid = document.getElementById("galleryGrid");
  const uploadForm = document.getElementById("uploadForm");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const uploadMsg = document.getElementById("uploadMsg");

  if (uploadForm) {
    const ses = getSession();
    if (!ses) {
      if (uploadMsg) uploadMsg.textContent = "Please log in to upload photos.";
    }
    uploadForm.addEventListener("submit", handleUploadSubmit);
  }

  if (galleryGrid) {
    loadGallery();
  }

  if (lightbox && lightboxClose) {
    lightboxClose.addEventListener("click", function () {
      lightbox.classList.remove("open");
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.classList.remove("open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") lightbox.classList.remove("open");
    });
  }
}

/**
 * Handle gallery upload form submission.
 * @param {Event} e
 */
async function handleUploadSubmit(e) {
  e.preventDefault();
  const ses = getSession();
  if (!ses) {
    const uploadMsg = document.getElementById("uploadMsg");
    if (uploadMsg) uploadMsg.textContent = "Please log in first.";
    return;
  }

  const fileInput = document.getElementById("photoFile");
  const captionInput = document.getElementById("photoCaption");
  const uploadMsg = document.getElementById("uploadMsg");
  const file = fileInput.files[0];
  if (!file) return;

  if (uploadMsg) uploadMsg.textContent = "Uploading...";
  const ext = file.name.split(".").pop();
  const fileName = `photo_${Date.now()}.${ext}`;
  const filePath = `${ses.username}/${fileName}`;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const { error: uploadError } = await supabase.storage
    .from("gallery-photos")
    .upload(filePath, file);

  if (submitBtn) submitBtn.disabled = false;

  if (uploadError) {
    if (uploadMsg) uploadMsg.textContent = "Upload failed. Please try again.";
    console.error(uploadError.message);
    return;
  }

  const { data: urlData } = supabase.storage
    .from("gallery-photos")
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;
  const caption = captionInput.value.trim();

  const { error: dbError } = await supabase.from("gallery_uploads").insert({
    uploaded_by: ses.username,
    display_name: ses.display,
    image_url: imageUrl,
    caption: caption,
  });

  if (dbError) {
    if (uploadMsg) uploadMsg.textContent = "Could not save photo info. Please try again.";
    console.error(dbError.message);
    return;
  }

  if (uploadMsg) uploadMsg.textContent = "Photo uploaded!";
  fileInput.value = "";
  captionInput.value = "";
  loadGallery();
}

/**
 * Load gallery photos from Supabase and render them.
 */
async function loadGallery() {
  const galleryGrid = document.getElementById("galleryGrid");
  if (!galleryGrid) return;

  const ses = getSession();
  galleryGrid.innerHTML = "";
  galleryGrid.appendChild(createLoadingSpinner());

  const { data: photos, error } = await supabase
    .from("gallery_uploads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    galleryGrid.innerHTML = "";
    galleryGrid.appendChild(
      createErrorDisplay("Could not load gallery.", () => loadGallery())
    );
    console.error(error.message);
    return;
  }

  galleryGrid.innerHTML = "";

  const allPhotos = [
    ...(photos || []).map((p) => ({ ...p, isUpload: true })),
    ...DEFAULT_PHOTOS.map((d) => ({ ...d, isUpload: false })),
  ];

  allPhotos.forEach((photo) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = photo.image_url;
    img.alt = photo.caption || "Our photo";
    img.loading = "lazy";
    img.addEventListener("click", function () {
      const lightbox = document.getElementById("lightbox");
      const lightboxImg = document.getElementById("lightboxImg");
      const lightboxCaption = document.getElementById("lightboxCaption");
      if (lightbox && lightboxImg) {
        // Use Supabase transform API for higher-res version when available
        lightboxImg.src = getFullSizeUrl(photo.image_url);
        lightboxImg.alt = img.alt;
        if (lightboxCaption) lightboxCaption.textContent = photo.caption || "";
        lightbox.classList.add("open");
      }
    });
    item.appendChild(img);

    if (photo.caption) {
      const cap = document.createElement("p");
      cap.className = "gallery-caption";
      cap.textContent = photo.caption;
      item.appendChild(cap);
    }

    if (photo.isUpload && ses && photo.uploaded_by === ses.username) {
      const del = document.createElement("button");
      del.className = "gallery-delete";
      del.innerHTML = "&times;";
      del.title = "Delete photo";
      del.addEventListener("click", async function (e) {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this photo?")) return;
        await supabase.from("gallery_uploads").delete().eq("id", photo.id);
        loadGallery();
      });
      item.appendChild(del);
    }

    galleryGrid.appendChild(item);
  });
}

/**
 * Get a full-size URL for the lightbox view.
 * Handles both Pexels URLs (parameter-based) and Supabase storage URLs.
 * @param {string} url
 * @returns {string}
 */
function getFullSizeUrl(url) {
  // Pexels-style URL parameters
  if (url.includes("pexels.com")) {
    return url.replace("h=650&w=940", "h=1200&w=1600");
  }
  // Supabase storage — use transform API for full size
  if (url.includes("supabase.co/storage")) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      // Reconstruct path: /storage/v1/object/public/gallery-photos/{filePath}
      const bucketIndex = pathParts.indexOf("gallery-photos");
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join("/");
        return `${urlObj.origin}/storage/v1/object/public/gallery-photos/${filePath}?width=1200&height=1600`;
      }
    } catch {
      // Fallback: return original URL
    }
  }
  return url;
}
