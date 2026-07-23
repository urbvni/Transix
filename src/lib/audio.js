/**
 * Legge la durata (in secondi) di un file audio nel browser senza upload.
 * Usa un elemento <audio> temporaneo + URL.createObjectURL.
 * Risolve con la durata in secondi, oppure rifiuta se il file non è leggibile.
 */
export function readAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('File audio non leggibile.'));
    };

    audio.src = url;
  });
}
