"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Globe, Upload, Save, ImageIcon, Link, FileText } from "lucide-react"

/**
 * Página de configurações gerais do sistema
 */
export function GeneralSettings() {
  const [siteConfig, setSiteConfig] = useState({
    siteName: "Raspou Ganhou",
    siteUrl: "https://raspouganhou.com.br",
    siteDescription: "A maior plataforma de raspadinhas online do Brasil",
    logo: "/images/logo.png",
    favicon: "/favicon.ico",
    supportEmail: "suporte@raspouganhou.com.br",
    supportPhone: "(11) 99999-9999",
  })

  const [seoConfig, setSeoConfig] = useState({
    metaTitle: "Raspou Ganhou - A Maior Plataforma de Raspadinhas do Brasil",
    metaDescription:
      "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",
    metaKeywords: "raspadinha, jogos online, prêmios, PIX, sorte, ganhar dinheiro",
    googleAnalyticsId: "GA-XXXXXXXXX",
    facebookPixelId: "FB-XXXXXXXXX",
  })

  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const handleSaveConfig = () => {
    console.log("Salvar configurações:", { siteConfig, seoConfig, maintenanceMode })
    // TODO: Implementar API call
    alert("Configurações salvas com sucesso!")
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Implementar upload de arquivo
      console.log("Upload de logo:", file)
      // Simular URL do arquivo
      const newLogoUrl = URL.createObjectURL(file)
      setSiteConfig({ ...siteConfig, logo: newLogoUrl })
    }
  }

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Implementar upload de arquivo
      console.log("Upload de favicon:", file)
      const newFaviconUrl = URL.createObjectURL(file)
      setSiteConfig({ ...siteConfig, favicon: newFaviconUrl })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Configurações Gerais</h1>
        <p className="text-gray-400">Configure informações básicas do site</p>
      </div>

      {/* Informações do Site */}
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

      {/* Upload de Logo e Favicon */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logo e Favicon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Logo do Site</label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full h-32 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                  {siteConfig.logo ? (
                    <img
                      src={siteConfig.logo || "/placeholder.svg"}
                      alt="Logo atual"
                      className="max-h-28 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Nenhum logo</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <Button
                    onClick={() => document.getElementById("logo-upload")?.click()}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Fazer Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Favicon (32x32px)</label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full h-32 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                  {siteConfig.favicon ? (
                    <img
                      src={siteConfig.favicon || "/placeholder.svg"}
                      alt="Favicon atual"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Nenhum favicon</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <Button
                    onClick={() => document.getElementById("favicon-upload")?.click()}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Fazer Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de SEO */}
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

      {/* Modo de Manutenção */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Modo de Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Ativar Modo de Manutenção</h3>
              <p className="text-gray-400 text-sm">Quando ativado, apenas administradores podem acessar o site</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                maintenanceMode ? "bg-red-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSaveConfig} className="bg-green-600 hover:bg-green-700 text-white px-8">
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  )
}
