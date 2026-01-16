export function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

//rotates data to mm/dd/yyyy format
export function formatMMDDYYYY(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const [yyyy, mm, dd] = yyyyMmDd.split("-");
  return `${mm}-${dd}-${yyyy}`;
}