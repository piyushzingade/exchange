export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};
