const TOKEN_KEY = 'dc_token'
const USER_KEY = 'dc_user'

export const auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  },
  save(login) {
    localStorage.setItem(TOKEN_KEY, login.token)
    localStorage.setItem(USER_KEY, JSON.stringify(login))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  isAuth() {
    return !!this.getToken()
  }
}