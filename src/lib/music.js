/**
 * Music Player Module
 *
 * A floating music player that can be toggled on/off from any page.
 * Plays a single "our song" with play/pause controls.
 * Uses a configurable audio URL or a built-in tone.
 */

let audioElement = null;
let isPlaying = false;
let playerEl = null;

const STORAGE_KEY = "dreamyMusicUrl";
const PLAY_STATE_KEY = "dreamyMusicPlaying";

/**
 * Initialize the music player. Creates the floating player UI.
 */
export function initMusicPlayer() {
  // Don't show on login page
  if (window.location.pathname.endsWith("login.html")) return;

  // Create the floating player
  playerEl = document.createElement("div");
  playerEl.className = "music-player";
  playerEl.innerHTML = `
    <button class="music-toggle" id="musicToggleBtn" title="Play our song">
      <span class="music-icon">🎵</span>
    </button>
    <div class="music-panel" id="musicPanel" style="display:none;">
      <div class="music-info">
        <span class="music-now">Our Song</span>
      </div>
      <div class="music-controls">
        <button id="musicPlayBtn" class="music-btn" title="Play/Pause">▶</button>
        <button id="musicStopBtn" class="music-btn" title="Stop">■</button>
        <input type="range" id="musicVolume" class="music-volume" min="0" max="100" value="50" title="Volume">
      </div>
      <div class="music-upload">
        <label for="musicFileInput" class="music-upload-label">Upload Song</label>
        <input type="file" id="musicFileInput" accept="audio/*" class="sr-only">
        <p class="music-hint">Upload your song (mp3, wav)</p>
      </div>
    </div>
  `;
  document.body.appendChild(playerEl);

  // Load saved state
  const wasPlaying = localStorage.getItem(PLAY_STATE_KEY) === "true";
  const savedUrl = localStorage.getItem(STORAGE_KEY);

  // Wire up controls
  const toggleBtn = document.getElementById("musicToggleBtn");
  const panel = document.getElementById("musicPanel");
  const playBtn = document.getElementById("musicPlayBtn");
  const stopBtn = document.getElementById("musicStopBtn");
  const volumeSlider = document.getElementById("musicVolume");
  const fileInput = document.getElementById("musicFileInput");

  toggleBtn.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
  });

  playBtn.addEventListener("click", () => {
    if (!audioElement && !savedUrl) {
      alert("Upload your song first! Click 'Upload Song' below.");
      return;
    }
    if (!audioElement && savedUrl) {
      audioElement = new Audio(savedUrl);
      audioElement.volume = volumeSlider.value / 100;
      audioElement.loop = true;
    }
    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
      playBtn.textContent = "▶";
    } else {
      audioElement.play().catch(() => {});
      isPlaying = true;
      playBtn.textContent = "⏸";
    }
    localStorage.setItem(PLAY_STATE_KEY, isPlaying.toString());
  });

  stopBtn.addEventListener("click", () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    isPlaying = false;
    playBtn.textContent = "▶";
    localStorage.setItem(PLAY_STATE_KEY, "false");
  });

  volumeSlider.addEventListener("input", () => {
    if (audioElement) {
      audioElement.volume = volumeSlider.value / 100;
    }
  });

  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Please upload an audio file.");
      return;
    }
    const url = URL.createObjectURL(file);
    localStorage.setItem(STORAGE_KEY, url);
    audioElement = new Audio(url);
    audioElement.volume = volumeSlider.value / 100;
    audioElement.loop = true;
    playBtn.textContent = "▶";
    isPlaying = false;
    document.querySelector('.music-now').textContent = file.name.replace(/\.[^/.]+$/, "");
  });

  // Auto-play if it was playing before
  if (wasPlaying && savedUrl) {
    audioElement = new Audio(savedUrl);
    audioElement.volume = volumeSlider.value / 100;
    audioElement.loop = true;
    audioElement.play().then(() => {
      isPlaying = true;
      playBtn.textContent = "⏸";
    }).catch(() => {
      // Auto-play blocked by browser - user needs to click
    });
    panel.style.display = "flex";
  }
}
