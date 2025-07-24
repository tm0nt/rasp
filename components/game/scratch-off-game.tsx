"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, RotateCcw, Eye, Gift } from "lucide-react"
import { Confetti } from "@/components/ui/confetti"

interface Prize {
  id: string
  name: string
  value: string
  image: string
  isWinning?: boolean
}

interface ScratchOffGameProps {
  prizes: Prize[]
  winningPrize?: Prize
  onGameComplete: (isWinner: boolean, prize?: Prize) => void
  onPlayAgain?: () => void
  gamePrice: number
  className?: string
}

/**
 * Enhanced Scratch-Off Game Component
 *
 * Improvements:
 * - Shows scratch card content before starting
 * - Fixed scratching algorithm for complete erasure
 * - Better visual feedback and animations
 */
export function ScratchOffGame({
  prizes,
  winningPrize,
  onGameComplete,
  onPlayAgain,
  gamePrice,
  className = "",
}: ScratchOffGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [scratchPercentage, setScratchPercentage] = useState(0)
  const [gameState, setGameState] = useState<"initial" | "playing" | "completed">("initial")
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [revealedPrizes, setRevealedPrizes] = useState<Prize[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const generateGameGrid = useCallback(() => {
    const grid: Prize[] = []
    const gridSize = 9
    if (winningPrize) {
      for (let i = 0; i < 3; i++) grid.push({ ...winningPrize, id: `win-${i}`, isWinning: true })
      const remainingSlots = gridSize - 3
      for (let i = 0; i < remainingSlots; i++) {
        const randomPrize = prizes[Math.floor(Math.random() * prizes.length)]
        grid.push({ ...randomPrize, id: `prize-${i}` })
      }
    } else {
      for (let i = 0; i < gridSize; i++) {
        const randomPrize = prizes[Math.floor(Math.random() * prizes.length)]
        grid.push({ ...randomPrize, id: `prize-${i}` })
      }
    }
    return grid.sort(() => Math.random() - 0.5)
  }, [prizes, winningPrize])

  useEffect(() => {
    setRevealedPrizes(generateGameGrid())
  }, [generateGameGrid])

  const drawScratchSurface = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create a more realistic scratch surface
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#c0c0c0") // Silver
    gradient.addColorStop(0.3, "#e8e8e8") // Light gray
    gradient.addColorStop(0.7, "#d0d0d0") // Medium gray
    gradient.addColorStop(1, "#a8a8a8") // Darker gray

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Add texture pattern
    ctx.fillStyle = "rgba(180, 180, 180, 0.3)"
    for (let i = 0; i < width; i += 4) {
      for (let j = 0; j < height; j += 4) {
        if (Math.random() > 0.7) {
          ctx.fillRect(i, j, 2, 2)
        }
      }
    }

    // Add scratch instruction text
    ctx.fillStyle = "#666666"
    ctx.font = "bold 18px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("🪙 RASPE AQUI 🪙", width / 2, height / 2 - 10)

    ctx.font = "12px Arial"
    ctx.fillText("Encontre 3 símbolos iguais!", width / 2, height / 2 + 15)
  }

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.scale(dpr, dpr)
    setCanvasSize({ width: rect.width, height: rect.height })
    drawScratchSurface(ctx, rect.width, rect.height)
    setTimeout(() => setIsCanvasReady(true), 50)
  }, [])

  useEffect(() => {
    if (gameState === "playing") initializeCanvas()
    const handleResize = () => {
      if (gameState === "playing") {
        setIsCanvasReady(false)
        setTimeout(initializeCanvas, 100)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [gameState, initializeCanvas])

  const scratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas || gameState !== "playing" || !isCanvasReady) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // FIXED: Use proper destination-out for complete erasure
      const brushSize = 40
      ctx.globalCompositeOperation = "destination-out"
      ctx.globalAlpha = 1.0 // Ensure full opacity for complete erasure

      // Create a solid circular brush
      ctx.beginPath()
      ctx.arc(x, y, brushSize, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(0,0,0,1)" // Solid black for complete removal
      ctx.fill()

      // Calculate scratch percentage more accurately
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      let transparentPixels = 0
      let totalPixels = 0

      // Check every 4th pixel for better performance
      for (let i = 3; i < pixels.length; i += 16) {
        totalPixels++
        if (pixels[i] === 0) {
          // Completely transparent
          transparentPixels++
        }
      }

      const percentage = totalPixels > 0 ? (transparentPixels / totalPixels) * 100 : 0
      setScratchPercentage(percentage)

      if (percentage > 50 && gameState === "playing") {
        setGameState("completed")
        if (winningPrize) {
          setShowConfetti(true)
        }
        onGameComplete(!!winningPrize, winningPrize)
      }
    },
    [gameState, isCanvasReady, winningPrize, onGameComplete],
  )

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (gameState !== "playing" || !isCanvasReady) return
    setIsScratching(true)
    const { x, y } = getCanvasCoordinates(clientX, clientY)
    scratch(x, y)
  }

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (!isScratching || gameState !== "playing" || !isCanvasReady) return
    const { x, y } = getCanvasCoordinates(clientX, clientY)
    scratch(x, y)
  }

  const handleInteractionEnd = () => setIsScratching(false)

  const startGame = () => {
    setGameState("playing")
    setIsCanvasReady(false)
    setScratchPercentage(0)
    setShowConfetti(false)
  }

  const revealAll = () => {
    setScratchPercentage(100)
    setGameState("completed")
    if (winningPrize) setShowConfetti(true)
    onGameComplete(!!winningPrize, winningPrize)
  }

  return (
    <div className={`relative ${className}`}>
      <Confetti isActive={showConfetti} />

      <Card className="bg-gradient-to-b from-gray-900 to-black border-2 border-gray-700 backdrop-blur-sm overflow-hidden shadow-2xl shadow-green-500/10">
        <CardContent className="p-4 sm:p-6">
          {/* Show scratch card content when in initial state */}
          <div
            className="relative"
            ref={containerRef}
            onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleInteractionMove(e.clientX, e.clientY)}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleInteractionEnd}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-gray-900/50 rounded-xl border border-gray-700">
              {revealedPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-500
                    ${
                      prize.isWinning && gameState === "completed"
                        ? "border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20 scale-105"
                        : "border-gray-600 bg-gray-800"
                    }
                  `}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1 sm:p-2">
                    <img
                      src={prize.image || "/placeholder.svg"}
                      alt={prize.name}
                      className="w-full h-8 sm:h-12 object-contain mb-1 sm:mb-2"
                    />
                    <p className="text-white text-[10px] sm:text-xs font-semibold text-center leading-tight">
                      {prize.name}
                    </p>
                    <p className="text-green-400 text-[10px] sm:text-xs font-bold">{prize.value}</p>
                  </div>
                  {prize.isWinning && gameState === "completed" && (
                    <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {gameState !== "initial" && gameState !== "completed" && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none rounded-xl"
                style={{ touchAction: "none" }}
              />
            )}

            {gameState === "playing" && !isCanvasReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
              </div>
            )}

            {gameState === "initial" && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl flex flex-col items-center justify-center text-white p-4">
                <Gift className="w-16 h-16 text-green-400 mb-4 animate-pulse" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">Sua Raspadinha está Pronta!</h3>
                <p className="text-sm text-gray-300 text-center mb-6 max-w-xs">
                  Raspe os 9 quadrados para descobrir o resultado!
                  <br />
                  <span className="text-green-400 font-semibold">Encontre 3 símbolos iguais e ganhe o prêmio!</span>
                </p>
                <Button
                  onClick={startGame}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
                >
                  Começar a Raspar
                </Button>
              </div>
            )}
          </div>

          <div className="text-center mt-4 h-10 flex items-center justify-center">
            {gameState === "playing" && isCanvasReady && (
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${scratchPercentage}%` }}
                ></div>
              </div>
            )}
          </div>

          {gameState === "completed" && (
            <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom duration-500">
              {winningPrize ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-6">
                  <h3 className="text-2xl font-bold text-green-300">🎉 Parabéns! Você Ganhou!</h3>
                  <div className="flex items-center justify-center gap-4 my-4">
                    <img
                      src={winningPrize.image || "/placeholder.svg"}
                      alt={winningPrize.name}
                      className="w-16 h-10 object-contain"
                    />
                    <div>
                      <p className="text-white font-semibold">{winningPrize.name}</p>
                      <p className="text-green-300 font-bold text-2xl">{winningPrize.value}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-red-300">Não foi desta vez!</h3>
                  <p className="text-gray-300 mt-2">Tente novamente, a sorte pode estar ao seu lado!</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-4">
            {gameState === "playing" && (
              <Button
                onClick={revealAll}
                disabled={!isCanvasReady}
                variant="outline"
                className="flex-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 bg-transparent"
              >
                <Eye className="w-4 h-4 mr-2" />
                Revelar Tudo
              </Button>
            )}
            {gameState === "completed" && onPlayAgain && (
              <Button
                onClick={onPlayAgain}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Jogar Novamente (R$ {gamePrice.toFixed(2).replace(".", ",")})
              </Button>
            )}
          </div>
                    {gameState === "initial" && (
            <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
              <h3 className="text-white text-lg font-bold mb-4 text-center">CONTEÚDO DESSA RASPADINHA:</h3>
              <div className="grid grid-cols-4 gap-2 p-4 bg-gray-800/50 rounded-xl border border-gray-600">
                {prizes.map((prize, index) => (
                  <div
                    key={`preview-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-600 bg-gray-700/50 p-1"
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <img
                        src={prize.image || "/placeholder.svg"}
                        alt={prize.name}
                        className="w-full h-6 sm:h-8 object-contain mb-1"
                      />
                      <p className="text-white text-[8px] sm:text-[10px] font-semibold text-center leading-tight">
                        {prize.name}
                      </p>
                      <p className="text-green-400 text-[8px] sm:text-[10px] font-bold">{prize.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}