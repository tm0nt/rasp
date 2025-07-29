"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UserCheck, DollarSign, TrendingUp, Calendar, Users, Settings, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Affiliate {
  id: string
  name: string
  email: string
  referrals: number
  totalEarned: number
  pendingEarned: number
  totalDeposits: number
  joinDate: string
  status: string
}

interface AffiliateStats {
  totalAffiliates: number
  totalReferrals: number
  totalEarned: number
  totalPending: number
  totalDeposits: number
}

interface AffiliateSettings {
  minDeposit: string
  cpaValue: string
}

export function AffiliatesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [stats, setStats] = useState<AffiliateStats>({
    totalAffiliates: 0,
    totalReferrals: 0,
    totalEarned: 0,
    totalPending: 0,
    totalDeposits: 0
  })
  
  const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings>({
    minDeposit: "20.00",
    cpaValue: "5.00"
  })

  // Carregar dados ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/admin/affiliates')
        const data = await response.json()
        
        if (data.success) {
          setAffiliates(data.data.affiliates)
          setStats(data.data.stats)
          setAffiliateSettings(data.data.settings)
        } else {
          toast({
            title: "Erro",
            description: "Falha ao carregar afiliados",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading affiliates:", error)
        toast({
          title: "Erro",
          description: "Falha ao carregar afiliados",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [toast])

  const handleUpdateSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_settings',
          data: affiliateSettings
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        })
        setShowSettings(false)
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha ao atualizar configurações",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar configurações",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePayAffiliate = async (affiliateId: string) => {
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'pay_affiliate',
          data: { affiliateId }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        })
        // Recarregar dados para atualizar a lista
        const refreshResponse = await fetch('/api/admin/affiliates')
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setAffiliates(refreshData.data.affiliates)
          setStats(refreshData.data.stats)
        }
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha ao processar pagamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error paying affiliate:", error)
      toast({
        title: "Erro",
        description: "Falha ao processar pagamento",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Afiliados</h1>
          <p className="text-gray-400">Gerencie o programa de afiliados</p>
        </div>
        <Button onClick={() => setShowSettings(!showSettings)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Configurações dos Afiliados */}
      {showSettings && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Configurações do Programa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Depósito Mínimo (R$)</label>
                <Input
                  type="number"
                  placeholder="20.00"
                  value={affiliateSettings.minDeposit}
                  onChange={(e) => setAffiliateSettings({ ...affiliateSettings, minDeposit: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Valor CPA (R$)</label>
                <Input
                  type="number"
                  placeholder="5.00"
                  value={affiliateSettings.cpaValue}
                  onChange={(e) => setAffiliateSettings({ ...affiliateSettings, cpaValue: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={handleUpdateSettings} className="bg-blue-600 hover:bg-blue-700">
                Salvar Configurações
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Afiliados</p>
                <p className="text-2xl font-bold text-white">{stats?.totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Indicações</p>
                <p className="text-2xl font-bold text-white">{stats?.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Pago</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.totalEarned.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Pendente</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.totalPending.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Depósitos</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.totalDeposits.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Afiliados */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Afiliados com Indicações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Afiliado</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Indicações</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Total Ganho</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Pendente</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Total Depósitos</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data Ingresso</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{affiliate.name}</p>
                        <p className="text-gray-400 text-sm">{affiliate.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{affiliate.referrals}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">
                          R$ {affiliate.totalEarned.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">
                          R$ {affiliate.pendingEarned.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400 font-medium">
                          R$ {affiliate.totalDeposits.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{affiliate.joinDate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{affiliate.status}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        size="sm"
                        onClick={() => handlePayAffiliate(affiliate.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={affiliate.pendingEarned === 0}
                      >
                        Pagar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}