// src/services/transaction.service.ts
import type { ITransaction } from "@/types/admin"

export class TransactionService {
  async getTransactions(
    page = 1, 
    limit = 10, 
    search = '', 
    type = 'all', 
    status = 'all'
  ): Promise<ITransaction[]> {
    const response = await fetch(
      `/api/admin/transactions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&type=${type}&status=${status}`
    )
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch transactions')
    return data.data
  }

  async updateTransaction(
    id: string, 
    updateData: { status: string; admin_note?: string }
  ): Promise<ITransaction> {
    const response = await fetch(`/api/admin/transactions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to update transaction')
    return data.data
  }
}