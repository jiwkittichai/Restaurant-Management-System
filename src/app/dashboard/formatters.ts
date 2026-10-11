export function formatRelativeDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dateKey(date) === dateKey(now)) {
    return `วันนี้ ${date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (dateKey(date) === dateKey(yesterday)) {
    return `เมื่อวาน ${date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const calendarDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.floor(
    (today.getTime() - calendarDate.getTime()) / 86400000,
  );
  if (diffDays > 0 && diffDays < 30) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
