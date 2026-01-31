import { apiClient, setStoredToken, clearStoredToken } from './client'
import { LoginResponse, SignupResponse, User } from './types'

export interface LoginInput {
    email: string
    password: string
}

export interface SignupInput {
    email: string
    password: string
    name: string
    organizationName: string
}

export const authApi = {
    /**
     * Login with email and password
     */
    async login(input: LoginInput) {
        const response = await apiClient.post<LoginResponse>('/auth/login', input)

        if (response.success && response.data) {
            setStoredToken(response.data.tokens.accessToken)
        }

        return response
    },

    /**
     * Register new user with organization
     */
    async signup(input: SignupInput) {
        const response = await apiClient.post<SignupResponse>('/auth/signup', input)

        if (response.success && response.data) {
            setStoredToken(response.data.tokens.accessToken)
        }

        return response
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        return apiClient.get<User>('/auth/me')
    },

    /**
     * Logout - clear stored token
     */
    logout() {
        clearStoredToken()
    },
}
