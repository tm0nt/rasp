// src/services/user.service.ts
import type { IUser } from "@/types/admin"

export class UserService implements IUserService {
  async getUsers(page = 1, limit = 10, search = '', status = 'all'): Promise<IUser[]> {
    const response = await fetch(
      `/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`
    )
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch users')
    return data.data
  }

  async getUserById(id: string): Promise<IUser> {
    const response = await fetch(`/api/admin/users/${id}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch user')
    return data.data
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser> {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to update user')
    return data.data
  }

  async deleteUser(id: string): Promise<boolean> {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to delete user')
    return data.success
  }

  async searchUsers(term: string): Promise<IUser[]> {
    const response = await fetch(`/api/admin/users?search=${encodeURIComponent(term)}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to search users')
    return data.data
  }
}