/**
 * Formats a timestamp into a human-readable "time ago" string.
 * e.g., "5m ago", "1h ago", "3d ago"
 * @param timestamp - The timestamp in milliseconds (e.g., from Date.now()).
 * @returns A formatted time ago string.
 */
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) {
    return `${Math.floor(interval)}y ago`;
  }
  interval = seconds / 2592000; // months
  if (interval > 1) {
    return `${Math.floor(interval)}mo ago`;
  }
  interval = seconds / 86400; // days
  if (interval > 1) {
    return `${Math.floor(interval)}d ago`;
  }
  interval = seconds / 3600; // hours
  if (interval > 1) {
    return `${Math.floor(interval)}h ago`;
  }
  interval = seconds / 60; // minutes
  if (interval > 1) {
    return `${Math.floor(interval)}m ago`;
  }
  return "Just now";
};