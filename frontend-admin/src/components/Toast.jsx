export default function Toast({ message, tipo }) {
  if (!message) return null
  const clase = 'toast' + (tipo === 'error' ? ' toast--error' : '')
  return <div className={clase}>{message}</div>
}