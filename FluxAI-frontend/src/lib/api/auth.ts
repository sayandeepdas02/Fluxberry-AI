import { apiClient } from './client'
import { LoginResponse, SignupResponse, User } from './types'

export interface LoginInput {
    email: string
    password: string
}

export interface SignupInput {
    email: string
    password: string
    firstName: string
    lastName: string
    organizationName: string
}

export const authApi = {
    async login(input: LoginInput) {
        return apiClient.post<LoginResponse>('/auth/login', input)
    },

    async signup(input: SignupInput) {
        return apiClient.post<SignupResponse>('/auth/signup', input)
    },

    async getCurrentUser() {
        return apiClient.get<User>('/auth/me')
    },

    async googleLogin(credential: string) {
        return apiClient.post<LoginResponse>('/auth/google', { credential })
    },

    async logout() {
        try {
            await apiClient.post('/auth/logout')
        } catch {
            // ignore
        }
    },
}
