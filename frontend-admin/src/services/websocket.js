import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client = null
const topicListeners = new Map()

export function subscribe(topic, onEvent) {
  if (!topicListeners.has(topic)) topicListeners.set(topic, new Set())
  topicListeners.get(topic).add(onEvent)
  ensureConnected()
  return () => {
    const set = topicListeners.get(topic)
    if (set) set.delete(onEvent)
  }
}

export function subscribeCitas(onEvent) {
  return subscribe('/topic/citas', onEvent)
}

export function subscribeRecordatorios(onEvent) {
  return subscribe('/topic/recordatorios', onEvent)
}

function ensureConnected() {
  if (client) return

  client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      topicListeners.forEach((listeners, topic) => {
        client.subscribe(topic, (message) => {
          try {
            const evento = JSON.parse(message.body)
            listeners.forEach((fn) => fn(evento))
          } catch {
            return
          }
        })
      })
    }
  })
  client.activate()
}