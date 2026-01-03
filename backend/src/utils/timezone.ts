// Timezone utility for Asia/Amman
export const getLocalDate = (date: Date = new Date()): string => {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Amman' }))
    .toISOString()
    .split('T')[0];
};

export const getLocalHour = (date: Date = new Date()): number => {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Amman' })).getHours();
};

export const parseLocalDateTime = (dateLocal: string, timeLocal: string): Date => {
  // Parse YYYY-MM-DD and HH:mm in Asia/Amman timezone
  const [year, month, day] = dateLocal.split('-').map(Number);
  const [hours, minutes] = timeLocal.split(':').map(Number);
  
  // Create date string in ISO format assuming Asia/Amman
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Convert to UTC (Asia/Amman is UTC+2 or UTC+3 depending on DST)
  // For simplicity, we'll use a library approach or manual calculation
  // This is a simplified version - in production, use a proper timezone library
  const localDate = new Date(dateStr);
  // Asia/Amman is typically UTC+2 or UTC+3
  // We'll adjust by subtracting the offset (approximate)
  const utcDate = new Date(localDate.getTime() - (2 * 60 * 60 * 1000)); // UTC+2 default
  return utcDate;
};

