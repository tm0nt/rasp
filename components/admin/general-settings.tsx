"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Globe, Upload, Save, ImageIcon, Link, FileText } from "lucide-react"
import { useToast } from "@/contexts/toast-context"  // Alterado para usar o custom toast context

export function GeneralSettings() {
  const { showToast } = useToast()  // Usando showToast do context custom
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  
  // State for all configurations
  const [siteConfig, setSiteConfig] = useState({
    siteName: "",
    siteUrl: "",
    siteDescription: "",
    logo: "",
    favicon: "",
    banner: "",
    supportEmail: "",
    supportPhone: "",
  })

  const [seoConfig, setSeoConfig] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
  })

  const [rtpValue, setRtpValue] = useState(0)
  const [minSpinsForWithdrawal, setMinSpinsForWithdrawal] = useState(0)
  const [minWithdrawal, setMinWithdrawal] = useState(0)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load settings with cache busting
  useEffect(() => {
    const loadSettings = async () => {
      if (!isOnline) {
        showToast({
          type: "info",
          title: "⚠️ Você está offline",
          message: "Algumas funcionalidades podem não estar disponíveis",
          duration: 5000,
        })
        setIsLoading(false)
        return
      }

      try {
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/admin/settings?t=${timestamp}`)
        const data = await response.json()
        
        if (data.success) {
          setSiteConfig(data.data.siteConfig)
          setSeoConfig(data.data.seoConfig)
          setMaintenanceMode(data.data.maintenanceMode)
          setRtpValue(parseInt(data.data.rtpValue) || 0)
          setMinSpinsForWithdrawal(parseInt(data.data.minSpinsForWithdrawal) || 0)
          setMinWithdrawal(parseFloat(data.data.minWithdrawal) || 0)
        } else {
          showToast({
            type: "error",
            title: "❌ Erro ao carregar",
            message: data.error || "Falha ao carregar configurações",
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("Error:", error)
        showToast({
          type: "error",
          title: "❌ Erro de conexão",
          message: "Falha ao conectar ao servidor",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSettings()
  }, [showToast, isOnline])

  // Handle RTP value change with validation
  const handleRtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setRtpValue(0);
      return;
    }
    
    const numValue = parseInt(value);
    
    if (!isNaN(numValue)) {
      if (numValue >= 0 && numValue <= 100) {
        setRtpValue(numValue);
      } else {
        showToast({
          type: "error",
          title: "Valor inválido",
          message: "O RTP deve estar entre 0 e 100",
          duration: 3000,
        })
      }
    }
  };

  // Handle min spins change with validation
  const handleMinSpinsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setMinSpinsForWithdrawal(0);
      return;
    }
    
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setMinSpinsForWithdrawal(numValue);
    } else {
      showToast({
        type: "error",
        title: "Valor inválido",
        message: "O mínimo de giros deve ser maior ou igual a 0",
        duration: 3000,
      })
    }
  };

  // Handle min withdrawal change with validation
  const handleMinWithdrawalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setMinWithdrawal(0);
      return;
    }
    
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setMinWithdrawal(numValue);
    } else {
      showToast({
        type: "error",
        title: "Valor inválido",
        message: "O saque mínimo deve ser maior ou igual a 0",
        duration: 3000,
      })
    }
  };

  // Save all configurations
  const handleSaveConfig = async () => {
    if (!isOnline) {
      showToast({
        type: "info",
        title: "⚠️ Você está offline",
        message: "Não é possível salvar sem conexão",
        duration: 5000,
      })
      return
    }

    setIsSaving(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/settings?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            siteConfig,
            seoConfig,
            maintenanceMode,
            rtpValue,
            minSpinsForWithdrawal,
            minWithdrawal
          }
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar")
      }

      showToast({
        type: "success",
        title: "✅ Sucesso",
        message: "Configurações salvas com sucesso",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error:", error)
      showToast({
        type: "error",
        title: "❌ Erro ao salvar",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Unified file upload handler for mobile
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'banner') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isOnline) {
      showToast({
        type: "info",
        title: "⚠️ Você está offline",
        message: "Não é possível fazer upload sem conexão",
        duration: 5000,
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/upload?t=${timestamp}`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Falha no upload")
      }

      setSiteConfig(prev => ({ ...prev, [type]: data.fileUrl }))
      showToast({
        type: "success",
        title: `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} atualizado`,
        message: `O ${type} foi atualizado com sucesso!`,
        duration: 3000,
      })
    } catch (error) {
      console.error(`Error uploading ${type}:`, error)
      showToast({
        type: "error",
        title: `❌ Falha no upload do ${type}`,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
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
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Configurações Gerais</h1>
        <p className="text-gray-400">Configure informações básicas do site</p>
      </div>

      {/* Game Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Configurações de Jogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Valor do RTP (0-100)
              </label>
              <Input
                type="number"
                value={rtpValue || ''}
                onChange={handleRtpChange}
                min="0"
                max="100"
                className="bg-gray-700 border-gray-600 text-white"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-400 mt-1">
                O RTP (Return to Player) determina a porcentagem de retorno aos jogadores.
              </p>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Mínimo de giros para saque
              </label>
              <Input
                type="number"
                value={minSpinsForWithdrawal || ''}
                onChange={handleMinSpinsChange}
                min="0"
                className="bg-gray-700 border-gray-600 text-white"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-400 mt-1">
                Número mínimo de giros necessários para permitir saque.
              </p>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Saque mínimo
              </label>
              <Input
                type="number"
                value={minWithdrawal || ''}
                onChange={handleMinWithdrawalChange}
                min="0"
                step="0.01"
                className="bg-gray-700 border-gray-600 text-white"
                inputMode="decimal"
              />
              <p className="text-xs text-gray-400 mt-1">
                Valor mínimo permitido para saque (em R$).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Informações do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Nome do Site</label>
              <Input
                type="text"
                value={siteConfig.siteName}
                onChange={(e) => setSiteConfig({ ...siteConfig, siteName: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">URL do Site</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="url"
                  value={siteConfig.siteUrl}
                  onChange={(e) => setSiteConfig({ ...siteConfig, siteUrl: e.target.value })}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Descrição do Site</label>
            <Textarea
              value={siteConfig.siteDescription}
              onChange={(e) => setSiteConfig({ ...siteConfig, siteDescription: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email de Suporte</label>
              <Input
                type="email"
                value={siteConfig.supportEmail}
                onChange={(e) => setSiteConfig({ ...siteConfig, supportEmail: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Telefone de Suporte</label>
              <Input
                type="tel"
                value={siteConfig.supportPhone}
                onChange={(e) => setSiteConfig({ ...siteConfig, supportPhone: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo, Favicon, and Banner Upload */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logo, Favicon e Banner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['logo', 'favicon', 'banner'] as const).map((type) => (
              <div key={type}>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {type === 'logo' ? 'Logo do Site' : type === 'favicon' ? 'Favicon (32x32px)' : 'Banner do Site'}
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full h-32 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                    {siteConfig[type] ? (
                      <img
                        src={siteConfig[type]}
                        alt={`${type.charAt(0).toUpperCase() + type.slice(1)} atual`}
                        className={type === 'favicon' ? "w-8 h-8 object-contain" : "max-h-28 max-w-full object-contain"}
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          Nenhum {type}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, type)}
                      className="hidden"
                      id={`${type}-upload`}
                      capture={type === 'logo' ? undefined : 'environment'}
                    />
                    <Button
                      onClick={() => document.getElementById(`${type}-upload`)?.click()}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Fazer Upload
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Configurações de SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Título Meta (SEO)</label>
            <Input
              type="text"
              value={seoConfig.metaTitle}
              onChange={(e) => setSeoConfig({ ...seoConfig, metaTitle: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Descrição Meta (SEO)</label>
            <Textarea
              value={seoConfig.metaDescription}
              onChange={(e) => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Palavras-chave (separadas por vírgula)
            </label>
            <Input
              type="text"
              value={seoConfig.metaKeywords}
              onChange={(e) => setSeoConfig({ ...seoConfig, metaKeywords: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Google Analytics ID</label>
              <Input
                type="text"
                placeholder="GA-XXXXXXXXX"
                value={seoConfig.googleAnalyticsId}
                onChange={(e) => setSeoConfig({ ...seoConfig, googleAnalyticsId: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Facebook Pixel ID</label>
              <Input
                type="text"
                placeholder="FB-XXXXXXXXX"
                value={seoConfig.facebookPixelId}
                onChange={(e) => setSeoConfig({ ...seoConfig, facebookPixelId: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button with Connection Status */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveConfig} 
          className="bg-green-600 hover:bg-green-700 text-white px-8"
          disabled={isSaving || !isOnline}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          ) : !isOnline ? (
            "Offline - Não é possível salvar"
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Todas as Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}