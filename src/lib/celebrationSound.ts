/**
 * Plays a subtle, calm completion sound - a soft "pop" with warmth
 * Designed for task completion without being intrusive or gamified
 */
export function playTaskCompleteSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const startTime = audioContext.currentTime;
    
    // Soft pop with a gentle high tone
    const popOsc = audioContext.createOscillator();
    const popGain = audioContext.createGain();
    
    popOsc.connect(popGain);
    popGain.connect(audioContext.destination);
    
    // Soft sine wave for a gentle "pop"
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(880, startTime); // A5
    popOsc.frequency.exponentialRampToValueAtTime(440, startTime + 0.08);
    
    popGain.gain.setValueAtTime(0, startTime);
    popGain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
    popGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
    
    popOsc.start(startTime);
    popOsc.stop(startTime + 0.15);
    
    // Subtle harmonic shimmer for warmth
    const shimmerOsc = audioContext.createOscillator();
    const shimmerGain = audioContext.createGain();
    
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(audioContext.destination);
    
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(1318.51, startTime + 0.02); // E6
    
    shimmerGain.gain.setValueAtTime(0, startTime + 0.02);
    shimmerGain.gain.linearRampToValueAtTime(0.06, startTime + 0.04);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    
    shimmerOsc.start(startTime + 0.02);
    shimmerOsc.stop(startTime + 0.25);
    
    setTimeout(() => audioContext.close(), 400);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

/**
 * Plays a calming "day complete" sound - gentle wind-down chime
 */
export function playDayCompleteSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const startTime = audioContext.currentTime;
    
    // Descending calm chord - signals "rest now"
    const notes = [
      { freq: 783.99, delay: 0, volume: 0.12 },    // G5
      { freq: 659.25, delay: 0.08, volume: 0.1 },  // E5
      { freq: 523.25, delay: 0.16, volume: 0.1 },  // C5
    ];
    
    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, startTime + note.delay);
      
      gain.gain.setValueAtTime(0, startTime + note.delay);
      gain.gain.linearRampToValueAtTime(note.volume, startTime + note.delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.delay + 0.4);
      
      osc.start(startTime + note.delay);
      osc.stop(startTime + note.delay + 0.5);
    });
    
    setTimeout(() => audioContext.close(), 800);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

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
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime + index * noteDuration);
      
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
    sparkleOsc.frequency.setValueAtTime(1318.51, startTime + notes.length * noteDuration);
    
    const sparkleStart = startTime + notes.length * noteDuration;
    sparkleGain.gain.setValueAtTime(0, sparkleStart);
    sparkleGain.gain.linearRampToValueAtTime(0.25, sparkleStart + 0.02);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, sparkleStart + 0.4);
    
    sparkleOsc.start(sparkleStart);
    sparkleOsc.stop(sparkleStart + 0.5);
    
    setTimeout(() => audioContext.close(), 1500);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

/**
 * Generates a grand fanfare sound for completing the entire plan
 */
export function playGrandCelebrationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const startTime = audioContext.currentTime;
    
    // First fanfare phrase - triumphant ascending
    const fanfare1 = [
      { freq: 392.00, dur: 0.15 }, // G4
      { freq: 523.25, dur: 0.15 }, // C5
      { freq: 659.25, dur: 0.15 }, // E5
      { freq: 783.99, dur: 0.3 },  // G5 (held)
    ];
    
    // Second fanfare phrase - even higher
    const fanfare2 = [
      { freq: 659.25, dur: 0.12 }, // E5
      { freq: 783.99, dur: 0.12 }, // G5
      { freq: 1046.50, dur: 0.12 }, // C6
      { freq: 1318.51, dur: 0.5 },  // E6 (held long)
    ];
    
    let currentTime = startTime;
    
    // Play first phrase
    fanfare1.forEach((note) => {
      playNote(audioContext, note.freq, currentTime, note.dur, 0.35, 'triangle');
      currentTime += note.dur;
    });
    
    currentTime += 0.1; // Small pause
    
    // Play second phrase
    fanfare2.forEach((note) => {
      playNote(audioContext, note.freq, currentTime, note.dur, 0.35, 'triangle');
      currentTime += note.dur;
    });
    
    // Add shimmering harmonics at the end
    const shimmerStart = currentTime - 0.3;
    for (let i = 0; i < 5; i++) {
      const shimmerFreq = 1318.51 + (i * 200);
      playNote(audioContext, shimmerFreq, shimmerStart + i * 0.08, 0.4, 0.1, 'sine');
    }
    
    // Final chord
    const chordTime = currentTime + 0.2;
    playNote(audioContext, 523.25, chordTime, 0.8, 0.2, 'sine'); // C5
    playNote(audioContext, 659.25, chordTime, 0.8, 0.2, 'sine'); // E5
    playNote(audioContext, 783.99, chordTime, 0.8, 0.2, 'sine'); // G5
    playNote(audioContext, 1046.50, chordTime, 0.8, 0.25, 'sine'); // C6
    
    setTimeout(() => audioContext.close(), 3000);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

function playNote(
  ctx: AudioContext, 
  freq: number, 
  startTime: number, 
  duration: number, 
  volume: number,
  type: OscillatorType
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

/**
 * Plays a pleasant confirmation sound for calendar additions
 * Two-note ascending chime - soft and friendly
 */
export function playCalendarConfirmSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const startTime = audioContext.currentTime;
    
    // Gentle ascending two-note chime (G5 → C6)
    playNote(audioContext, 783.99, startTime, 0.15, 0.25, 'sine');
    playNote(audioContext, 1046.50, startTime + 0.1, 0.25, 0.2, 'sine');
    
    // Subtle harmonics for warmth
    playNote(audioContext, 1318.51, startTime + 0.15, 0.3, 0.08, 'sine');
    
    setTimeout(() => audioContext.close(), 800);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

/**
 * Plays a soft "retry" sound for denied calendar additions
 * Descending tone - gentle, non-judgmental
 */
export function playCalendarRetrySound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const startTime = audioContext.currentTime;
    
    // Soft descending two-note (E5 → C5)
    playNote(audioContext, 659.25, startTime, 0.12, 0.2, 'sine');
    playNote(audioContext, 523.25, startTime + 0.08, 0.2, 0.15, 'sine');
    
    setTimeout(() => audioContext.close(), 600);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}
