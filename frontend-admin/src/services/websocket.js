import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client = null
const listeners = new Set()

export function subscribeCitas(onEvent) {
  listeners.add(onEvent)
  ensureConnected()
  return () => listeners.delete(onEvent)
}

function ensureConnected() {
  if (client) return

  client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe('/topic/citas', (message) => {
        try {
          const evento = JSON.parse(message.body)
          listeners.forEach((fn) => fn(evento))
        } catch {
          return
        }
      })
    }
  })
  client.activate()
}