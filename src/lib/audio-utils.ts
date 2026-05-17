/**
 * Audio utility functions for PCM encoding/decoding and Web Audio API management.
 */

export const SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;

/**
 * Converts a Float32Array of audio samples to a Base64 encoded Int16 PCM string.
 */
export function float32ToInt16PCM(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return btoa(String.fromCharCode(...new Uint8Array(int16Array.buffer)));
}

/**
 * Converts a Base64 encoded Int16 PCM string to a Float32Array of audio samples.
 */
export function int16PCMToFloat32(base64Data: string): Float32Array {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

/**
 * Creates an AudioContext and handles common setup.
 */
export function createAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: OUTPUT_SAMPLE_RATE,
  });
}
