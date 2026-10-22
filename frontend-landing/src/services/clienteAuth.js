const TOKEN_KEY = 'dc_cliente_token'

export const clienteAuth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  save(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
  },
  isAuth() {
    return !!this.getToken()
  }
}
