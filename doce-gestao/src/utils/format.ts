export const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))

export const todayISO = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`