"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  Gift,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export function BonusesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [bonuses, setBonuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newBonus, setNewBonus] = useState({ name: "", value: "", minDeposit: "" })

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editBonus, setEditBonus] = useState(null)

  const fetchBonuses = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/bonuses")
      if (!response.ok) throw new Error("Erro ao buscar bônus")
      const data = await response.json()
      setBonuses(data.bonuses || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBonuses()
  }, [])

  const handleAddBonus = async () => {
    if (newBonus.name && newBonus.value) {
      try {
        const response = await fetch("/api/admin/bonuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newBonus.name,
            value: parseFloat(newBonus.value),
            minDeposit: parseFloat(newBonus.minDeposit || 0),
          }),
        })
        if (!response.ok) throw new Error("Erro ao adicionar bônus")
        setNewBonus({ name: "", value: "", minDeposit: "" })
        setShowAddForm(false)
        fetchBonuses()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleEditBonus = (bonus) => {
    setEditBonus(bonus)
    setEditModalOpen(true)
  }

  const submitEditBonus = async () => {
    try {
      const response = await fetch("/api/admin/bonuses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editBonus.id,
          name: editBonus.name,
          value: parseFloat(editBonus.value),
          minDeposit: parseFloat(editBonus.minDeposit || 0),
          isActive: editBonus.isActive,
        }),
      })
      if (!response.ok) throw new Error("Erro ao editar bônus")
      setEditModalOpen(false)
      setEditBonus(null)
      fetchBonuses()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteBonus = async (bonusId) => {
    if (confirm("Confirmar exclusão?")) {
      try {
        const response = await fetch("/api/admin/bonuses", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: bonusId }),
        })
        if (!response.ok) throw new Error("Erro ao deletar bônus")
        fetchBonuses()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleToggleStatus = async (bonus) => {
    try {
      const response = await fetch("/api/admin/bonuses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bonus.id,
          name: bonus.name,
          value: parseFloat(bonus.value),
          minDeposit: parseFloat(bonus.minDeposit),
          isActive: !bonus.isActive,
        }),
      })
      if (!response.ok) throw new Error("Erro ao alternar status")
      fetchBonuses()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Carregando...</p>
  if (error) return <p>Erro: {error}</p>

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Bônus</h1>
          <p className="text-gray-400">Gerencie bônus e promoções</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Bônus
        </Button>
      </div>

      {/* Formulário de novo bônus */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Adicionar Novo Bônus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Nome"
                value={newBonus.name}
                onChange={(e) => setNewBonus({ ...newBonus, name: e.target.value })}
                className="bg-gray-700 text-white"
              />
              <Input
                type="number"
                placeholder="Valor"
                value={newBonus.value}
                onChange={(e) => setNewBonus({ ...newBonus, value: e.target.value })}
                className="bg-gray-700 text-white"
              />
              <Input
                type="number"
                placeholder="Depósito Mínimo"
                value={newBonus.minDeposit}
                onChange={(e) =>
                  setNewBonus({ ...newBonus, minDeposit: e.target.value })
                }
                className="bg-gray-700 text-white"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={handleAddBonus} className="bg-green-600 hover:bg-green-700">
                Salvar Bônus
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de bônus */}
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
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">
                    R$ {parseFloat(bonus.value).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">
                    Depósito mín: R$ {parseFloat(bonus.minDeposit).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">Criado em: {bonus.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Usado {bonus.usedCount} vezes</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(bonus)}
                    className="text-blue-400 hover:bg-blue-500/20"
                  >
                    {bonus.isActive ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditBonus(bonus)}
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

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Editar Bônus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editBonus?.name || ""}
              onChange={(e) =>
                setEditBonus({ ...editBonus, name: e.target.value })
              }
              placeholder="Nome"
              className="bg-gray-700 text-white"
            />
            <Input
              type="number"
              value={editBonus?.value || ""}
              onChange={(e) =>
                setEditBonus({ ...editBonus, value: e.target.value })
              }
              placeholder="Valor"
              className="bg-gray-700 text-white"
            />
            <Input
              type="number"
              value={editBonus?.minDeposit || ""}
              onChange={(e) =>
                setEditBonus({ ...editBonus, minDeposit: e.target.value })
              }
              placeholder="Depósito Mínimo"
              className="bg-gray-700 text-white"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button onClick={submitEditBonus} className="bg-green-600">
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="text-white border-gray-600"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
