/**
 * Componente para filtros da tabela de usuários
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface UsersTableFiltersProps {
  searchTerm: string
  filterInfluencer: string
  onSearchChange: (term: string) => void
  onInfluencerChange: (value: string) => void
}

/**
 * Componente responsável apenas pelos filtros da tabela de usuários
 */
export function UsersTableFilters({
  searchTerm,
  filterInfluencer,
  onSearchChange,
  onInfluencerChange,
}: UsersTableFiltersProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Buscar por nome ou email..." />
          <InfluencerFilter value={filterInfluencer} onChange={onInfluencerChange} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente para input de busca
 */
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-gray-700 border-gray-600 text-white"
      />
    </div>
  )
}

/**
 * Componente para filtro de influencer
 */
interface InfluencerFilterProps {
  value: string
  onChange: (value: string) => void
}

function InfluencerFilter({ value, onChange }: InfluencerFilterProps) {
  const influencerOptions = [
    { value: "all", label: "Todos" },
    { value: "yes", label: "Apenas Influencer" },
    { value: "no", label: "Sem Influencer" },
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
    >
      {influencerOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
