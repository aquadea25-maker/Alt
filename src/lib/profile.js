import { getSession, setSession } from './auth.js';

/**
 * Profile module for managing user display names and avatars.
 *
 * Profiles are stored in localStorage so each registered user
 * can customize their display name and avatar without needing
 * a Supabase auth table. This keeps the app simple while still
 * letting both partners personalize their identity.
 *
 * Storage format (localStorage key "dreamyProfiles"):
 *   {
 *     "melil": { display_name: "Melil", avatar_url: "", bio: "" },
 *     "marlie": { display_name: "Marlie", avatar_url: "", bio: "" }
 *   }
 */

const STORAGE_KEY = "dreamyProfiles";

/** Default profiles for the two registered users */
const DEFAULT_PROFILES = {
  melil: { display_name: "Melil", avatar_url: "", bio: "" },
  marlie: { display_name: "Marlie", avatar_url: "", bio: "" },
};

/**
 * Get all profiles from localStorage.
 * @returns {Record<string, {display_name: string, avatar_url: string, bio: string}>}
 */
function getAllProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored && typeof stored === "object") {
      return stored;
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_PROFILES };
}

/**
 * Save all profiles to localStorage.
 * @param {Record<string, {display_name: string, avatar_url: string, bio: string}>} profiles
 */
function saveAllProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

/**
 * Get a single user's profile.
 * @param {string} username
 * @returns {{display_name: string, avatar_url: string, bio: string} | null}
 */
export function getProfile(username) {
  if (!username) return null;
  const all = getAllProfiles();
  return all[username] || null;
}

/**
 * Save a user's profile.
 * @param {string} username
 * @param {{display_name: string, avatar_url: string, bio: string}} profileData
 */
export function saveProfile(username, profileData) {
  const all = getAllProfiles();
  all[username] = { ...profileData };
  saveAllProfiles(all);
}

/**
 * Get the display name for a user.
 * Falls back to username if no profile exists.
 * @param {string} username
 * @returns {string}
 */
export function getDisplayName(username) {
  const profile = getProfile(username);
  if (profile?.display_name) return profile.display_name;
  return username;
}

/**
 * Initialize the profile page.
 */
export function initProfile() {
  const form = document.getElementById("profileForm");
  if (!form) return;

  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const username = session.username;
  const profile = getProfile(username);

  // Pre-fill form
  const nameInput = document.getElementById("profileName");
  const bioInput = document.getElementById("profileBio");
  const avatarInput = document.getElementById("profileAvatar");
  const avatarPreview = document.getElementById("avatarPreview");
  const msgEl = document.getElementById("profileMsg");

  if (profile) {
    if (nameInput) nameInput.value = profile.display_name;
    if (bioInput) bioInput.value = profile.bio || "";
    if (avatarInput && profile.avatar_url) {
      avatarPreview.src = profile.avatar_url;
    }
  }

  // Handle avatar file selection
  if (avatarInput) {
    avatarInput.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        if (msgEl) {
          msgEl.style.color = "#e67fae";
          msgEl.textContent = "Please select an image file.";
        }
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        if (msgEl) {
          msgEl.style.color = "#e67fae";
          msgEl.textContent = "Image must be under 2MB.";
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        avatarPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const displayName = (nameInput?.value || "").trim();
    const bio = (bioInput?.value || "").trim();

    if (!displayName) {
      if (msgEl) {
        msgEl.style.color = "#e67fae";
        msgEl.textContent = "Display name is required.";
      }
      return;
    }

    const updatedProfile = {
      display_name: displayName,
      avatar_url: avatarPreview.src || "",
      bio: bio,
    };

    saveProfile(username, updatedProfile);

    // Sync session display name
    session.display = displayName;
    setSession(session);

    if (msgEl) {
      msgEl.style.color = "#7f5fc3";
      msgEl.textContent = "Profile updated successfully!";
    }

    // Show a brief success animation
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = "Saved!";
      setTimeout(() => {
        submitBtn.textContent = "Save Profile";
      }, 2000);
    }
  });
}
