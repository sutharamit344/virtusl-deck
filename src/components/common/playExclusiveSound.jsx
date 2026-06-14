export const playExclusiveSound = (playFn, soundInstance) => {
  if (!soundInstance || typeof soundInstance.stop !== "function") {
    // Fallback if sound instance is not available
    playFn?.();
    return;
  }

  try {
    // Stop any currently playing sound (refresh)
    soundInstance.stop();
    setTimeout(() => {
      soundInstance.play();
    }, 1);
    setTimeout(() => {
      soundInstance.stop();
    }, 2000);
  } catch (err) {
    console.warn("Sound playback failed:", err);
    playFn?.(); // Fallback to play function
  }
};
