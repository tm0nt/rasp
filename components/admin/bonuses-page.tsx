"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Gift, DollarSign, TrendingUp, Calendar, Users } from "lucide-react"

/**
 * Página de gerenciamento de bônus
 */
export function BonusesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBonus, setNewBonus] = useState({
    name: "",
    value: "",
    minDeposit: "",
  })

  // Dados simulados - em produção viriam da API
  const bonuses = [
    {
      id: "1",
      name: "Bônus de Boas-vindas",
      value: 50.0,
      minDeposit: 20.0,
      isActive: true,
      createdAt: "2025-01-15",
      usedCount: 125,
    },
    {
      id: "2",
      name: "Bônus de Recarga",
      value: 25.0,
      minDeposit: 50.0,
      isActive: true,
      createdAt: "2025-01-10",
      usedCount: 87,
    },
    {
      id: "3",
      name: "Bônus VIP",
      value: 100.0,
      minDeposit: 200.0,
      isActive: false,
      createdAt: "2025-01-08",
      usedCount: 15,
    },
    {
      id: "4",
      name: "Bônus Fim de Semana",
      value: 30.0,
      minDeposit: 0.0,
      isActive: true,
      createdAt: "2025-01-05",
      usedCount: 203,
    },
  ]

  const handleAddBonus = () => {
    if (newBonus.name && newBonus.value) {
      console.log("Adicionar bônus:", newBonus)
      // TODO: Implementar API call
      setNewBonus({ name: "", value: "", minDeposit: "" })
      setShowAddForm(false)
    }
  }

  const handleEditBonus = (bonusId: string) => {
    console.log("Editar bônus:", bonusId)
    // TODO: Implementar modal de edição
  }

  const handleDeleteBonus = (bonusId: string) => {
    console.log("Deletar bônus:", bonusId)
    // TODO: Implementar confirmação e exclusão
  }

  const handleToggleStatus = (bonusId: string) => {
    console.log("Alternar status do bônus:", bonusId)
    // TODO: Implementar toggle de status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Bônus</h1>
          <p className="text-gray-400">Gerencie bônus e promoções</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Bônus
        </Button>
      </div>

      {/* Formulário de Adicionar Bônus */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Adicionar Novo Bônus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Nome do Bônus</label>
                <Input
                  placeholder="Ex: Bônus de Boas-vindas"
                  value={newBonus.name}
                  onChange={(e) => setNewBonus({ ...newBonus, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Valor do Bônus (R$)</label>
                <Input
                  type="number"
                  placeholder="50.00"
                  value={newBonus.value}
                  onChange={(e) => setNewBonus({ ...newBonus, value: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Depósito Mínimo (R$)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newBonus.minDeposit}
                  onChange={(e) => setNewBonus({ ...newBonus, minDeposit: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={handleAddBonus} className="bg-green-600 hover:bg-green-700">
                Salvar Bônus
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="border-gray-600 text-gray-300">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Bônus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bonuses.map((bonus) => (
          <Card key={bonus.id} className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-white text-lg">{bonus.name}</CardTitle>
                </div>
                <Badge
                  variant={bonus.isActive ? "default" : "secondary"}
                  className={
                    bonus.isActive
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }
                >
                  {bonus.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Valor do Bônus */}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">R$ {bonus.value.toFixed(2).replace(".", ",")}</span>
                </div>

                {/* Depósito Mínimo */}
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">
                    Depósito mín: R$ {bonus.minDeposit.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                {/* Data de Criação */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">Criado em: {bonus.createdAt}</span>
                </div>

                {/* Uso */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Usado {bonus.usedCount} vezes</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(bonus.id)}
                    className="text-blue-400 hover:bg-blue-500/20"
                  >
                    {bonus.isActive ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditBonus(bonus.id)}
                    className="text-yellow-400 hover:bg-yellow-500/20"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteBonus(bonus.id)}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
