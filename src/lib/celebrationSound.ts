/**
 * Generates a celebratory chime sound using Web Audio API
 * No external dependencies or API keys required
 */
export function playCelebrationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create a sequence of ascending notes for a "celebration" feel
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.15;
    const startTime = audioContext.currentTime;
    
    notes.forEach((frequency, index) => {
      // Create oscillator for each note
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Use a pleasant sine wave
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime + index * noteDuration);
      
      // Envelope for each note
      const noteStart = startTime + index * noteDuration;
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(0.3, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration);
      
      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteDuration + 0.1);
    });
    
    // Add a final longer "sparkle" note
    const sparkleOsc = audioContext.createOscillator();
    const sparkleGain = audioContext.createGain();
    
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(audioContext.destination);
    
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(1318.51, startTime + notes.length * noteDuration); // E6
    
    const sparkleStart = startTime + notes.length * noteDuration;
    sparkleGain.gain.setValueAtTime(0, sparkleStart);
    sparkleGain.gain.linearRampToValueAtTime(0.25, sparkleStart + 0.02);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, sparkleStart + 0.4);
    
    sparkleOsc.start(sparkleStart);
    sparkleOsc.stop(sparkleStart + 0.5);
    
    // Clean up after sounds finish
    setTimeout(() => {
      audioContext.close();
    }, 1500);
  } catch (error) {
    // Silently fail if audio context isn't available
    console.debug('Audio playback not available:', error);
  }
}
