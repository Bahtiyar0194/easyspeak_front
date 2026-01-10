export function formatSecondsToTime(totalSeconds) {
  if (!isFinite(totalSeconds)) return "00:00";

  const sign = totalSeconds < 0 ? "-" : "";
  totalSeconds = Math.abs(Math.floor(totalSeconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = n => String(n).padStart(2, "0");

  if (hours > 0) {
    return sign + `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    return sign + `${pad(minutes)}:${pad(seconds)}`;
  }
}