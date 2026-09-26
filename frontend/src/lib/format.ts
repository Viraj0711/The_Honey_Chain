const pad2 = (n: number) => String(n).padStart(2, '0')

export function clockTime(value: Date | number | string) {
  const x = new Date(value)
  return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`
}

export function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
