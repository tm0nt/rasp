"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Key, Settings, Eye, EyeOff, Save, TestTube } from "lucide-react"

/**
 * Página de configurações do gateway de pagamento
 */
export function GatewaySettings() {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [gatewayConfig, setGatewayConfig] = useState({
    publicToken: "pk_test_abc123456789",
    privateToken: "sk_test_xyz987654321",
    webhookUrl: "https://raspouganhou.com.br/api/webhook",
    environment: "sandbox", // sandbox ou production
  })

  const [isTestMode, setIsTestMode] = useState(true)
  const [testResults, setTestResults] = useState("")

  const handleSaveConfig = () => {
    console.log("Salvar configurações do gateway:", gatewayConfig)
    // TODO: Implementar API call
    alert("Configurações salvas com sucesso!")
  }

  const handleTestConnection = async () => {
    setTestResults("Testando conexão...")

    // Simular teste de conexão
    setTimeout(() => {
      const success = Math.random() > 0.3 // 70% de chance de sucesso
      if (success) {
        setTestResults("✅ Conexão bem-sucedida! Gateway funcionando corretamente.")
      } else {
        setTestResults("❌ Falha na conexão. Verifique as credenciais.")
      }
    }, 2000)
  }

  const supportedGateways = [
    {
      name: "Mercado Pago",
      status: "Ativo",
      methods: ["PIX", "Cartão de Crédito", "Cartão de Débito"],
      commission: "2.99%",
    },
    {
      name: "PagSeguro",
      status: "Inativo",
      methods: ["PIX", "Cartão de Crédito", "Boleto"],
      commission: "3.49%",
    },
    {
      name: "Stripe",
      status: "Ativo",
      methods: ["Cartão de Crédito", "Cartão de Débito"],
      commission: "2.49%",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Gateway de Pagamento</h1>
        <p className="text-gray-400">Configure os métodos de pagamento</p>
      </div>

      {/* Configurações Principais */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modo de Operação */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Modo de Operação</label>
            <div className="flex gap-4">
              <button
                onClick={() => setIsTestMode(true)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  isTestMode
                    ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                    : "border-gray-600 bg-gray-700 text-gray-300"
                }`}
              >
                Teste (Sandbox)
              </button>
              <button
                onClick={() => setIsTestMode(false)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  !isTestMode
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-gray-600 bg-gray-700 text-gray-300"
                }`}
              >
                Produção (Live)
              </button>
            </div>
          </div>

          {/* Token Público */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Token Público</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="pk_test_..."
                value={gatewayConfig.publicToken}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, publicToken: e.target.value })}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Token Privado */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Token Privado</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type={showPrivateKey ? "text" : "password"}
                placeholder="sk_test_..."
                value={gatewayConfig.privateToken}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, privateToken: e.target.value })}
                className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">URL do Webhook</label>
            <Input
              type="url"
              placeholder="https://seusite.com/api/webhook"
              value={gatewayConfig.webhookUrl}
              onChange={(e) => setGatewayConfig({ ...gatewayConfig, webhookUrl: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button onClick={handleSaveConfig} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
            <Button
              onClick={handleTestConnection}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600/20 bg-transparent"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Testar Conexão
            </Button>
          </div>

          {/* Resultado do Teste */}
          {testResults && (
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-white text-sm">{testResults}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gateways Suportados */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Gateways Suportados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedGateways.map((gateway, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{gateway.name}</h3>
                  <Badge
                    variant={gateway.status === "Ativo" ? "default" : "secondary"}
                    className={
                      gateway.status === "Ativo"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {gateway.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    <strong>Métodos:</strong> {gateway.methods.join(", ")}
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Comissão:</strong> {gateway.commission}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Configurações Avançadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Timeout de Transação (segundos)</label>
            <Input
              type="number"
              placeholder="30"
              defaultValue="30"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Tentativas de Retry</label>
            <Input type="number" placeholder="3" defaultValue="3" className="bg-gray-700 border-gray-600 text-white" />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Configurações Personalizadas (JSON)</label>
            <Textarea
              placeholder='{"custom_setting": "value"}'
              className="bg-gray-700 border-gray-600 text-white"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
