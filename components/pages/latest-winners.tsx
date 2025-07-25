// components/pages/latest-winners.tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import "swiper/css"
import "swiper/css/autoplay"

interface Winner {
  id: string
  username: string
  prize: string
  prizeType: "PIX" | "PRODUTO"
  timeAgo: string
  avatar: string
}

const rawWinners: Omit<Winner, 'id' | 'avatar'>[] = [
  { username: "***Maria", prize: "R$ 50", prizeType: "PIX", timeAgo: "há 5 min" },
  { username: "***Joao", prize: "R$ 100", prizeType: "PIX", timeAgo: "há 8 min" },
  { username: "***Ana", prize: "Apple Watch", prizeType: "PRODUTO", timeAgo: "há 12 min" },
  { username: "***Luis", prize: "R$ 250", prizeType: "PIX", timeAgo: "há 20 min" },
  { username: "***Bia", prize: "iPhone 14", prizeType: "PRODUTO", timeAgo: "há 25 min" },
  { username: "***Pedro", prize: "R$ 500", prizeType: "PIX", timeAgo: "há 32 min" },
  { username: "***Lara", prize: "PlayStation 5", prizeType: "PRODUTO", timeAgo: "há 40 min" },
  { username: "***Rafa", prize: "R$ 1000", prizeType: "PIX", timeAgo: "há 1h" },
  { username: "***Carlos", prize: "R$ 200", prizeType: "PIX", timeAgo: "há 45 min" },
  { username: "***Sara", prize: "Xbox Series X", prizeType: "PRODUTO", timeAgo: "há 50 min" },
  { username: "***Miguel", prize: "R$ 300", prizeType: "PIX", timeAgo: "há 55 min" },
  { username: "***Julia", prize: "AirPods Pro", prizeType: "PRODUTO", timeAgo: "há 1h 5 min" },
  { username: "***Felipe", prize: "R$ 150", prizeType: "PIX", timeAgo: "há 1h 10 min" },
  { username: "***Isabela", prize: "Nintendo Switch", prizeType: "PRODUTO", timeAgo: "há 1h 15 min" },
  { username: "***Gabriel", prize: "R$ 400", prizeType: "PIX", timeAgo: "há 1h 20 min" },
  { username: "***Marcos", prize: "R$ 75", prizeType: "PIX", timeAgo: "há 1h 25 min" },
  { username: "***Aline", prize: "Samsung Galaxy S22", prizeType: "PRODUTO", timeAgo: "há 1h 30 min" },
  { username: "***Bruno", prize: "R$ 600", prizeType: "PIX", timeAgo: "há 1h 35 min" },
  { username: "***Deborah", prize: "Smart TV 50''", prizeType: "PRODUTO", timeAgo: "há 1h 40 min" },
  { username: "***Lucas", prize: "R$ 90", prizeType: "PIX", timeAgo: "há 1h 45 min" },
  { username: "***Renata", prize: "Kindle Paperwhite", prizeType: "PRODUTO", timeAgo: "há 1h 50 min" },
  { username: "***Thiago", prize: "R$ 850", prizeType: "PIX", timeAgo: "há 1h 55 min" },
  { username: "***Carla", prize: "iPad 9ª Geração", prizeType: "PRODUTO", timeAgo: "há 2h" },
  { username: "***Eduardo", prize: "R$ 120", prizeType: "PIX", timeAgo: "há 2h 5 min" },
  { username: "***Patricia", prize: "Câmera GoPro", prizeType: "PRODUTO", timeAgo: "há 2h 10 min" },
  { username: "***Rodrigo", prize: "R$ 700", prizeType: "PIX", timeAgo: "há 2h 15 min" },
  { username: "***Natalia", prize: "Echo Dot", prizeType: "PRODUTO", timeAgo: "há 2h 20 min" },
  { username: "***Vinicius", prize: "R$ 50", prizeType: "PIX", timeAgo: "há 2h 25 min" },
  { username: "***Tamires", prize: "Fone JBL", prizeType: "PRODUTO", timeAgo: "há 2h 30 min" },
  { username: "***Henrique", prize: "R$ 180", prizeType: "PIX", timeAgo: "há 2h 35 min" },
]


export function LatestWinners() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [totalPrizes] = useState("R$ 1.589.896,56")

  useEffect(() => {
    const timestamp = Date.now()
    const withAvatars: Winner[] = rawWinners.map((w, i) => ({
      ...w,
      id: `${i + 1}-${timestamp}`,
      avatar: `https://avatar.iran.liara.run/public?id=${i}-${timestamp}`,
    }))

    const duplicatedWinners: Winner[] = withAvatars.map((winner, index) => ({
      ...winner,
      id: `${winner.id}-copy-${index}`,
    }))

    setWinners([...withAvatars, ...duplicatedWinners])
  }, [])

  return (
    <section className="py-6">
      <div className="rounded-xl p-6 backdrop-blur-sm shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎉 Últimos Ganhadores
          </h2>
          <div className="text-right">
            <p className="text-sm text-gray-400">Prêmios Distribuídos</p>
            <p className="text-2xl font-bold text-green-400">{totalPrizes}</p>
          </div>
        </div>

        {/* Swiper com carrossel fluido */}
        <Swiper
          slidesPerView="auto"
          spaceBetween={16}
          loop={true}
          freeMode={true}
          modules={[Autoplay]}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={4000}
          className="!overflow-visible"
        >
          {winners.map((winner) => (
            <SwiperSlide key={winner.id} style={{ width: "260px" }}>
              <div className="bg-[#161b22] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600">
                    <Image
                      src={winner.avatar}
                      alt={winner.username}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{winner.username}</p>
                    <p className="text-gray-400 text-xs">{winner.timeAgo}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p
                    className={`font-bold ${
                      winner.prizeType === "PIX" ? "text-green-400" : "text-orange-400"
                    }`}
                  >
                    {winner.prize}
                  </p>
                  <span className="text-xs text-gray-400 uppercase">{winner.prizeType}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-center text-sm text-gray-400">
            🤑 Seja o próximo ganhador! Jogue agora e concorra a prêmios incríveis
          </p>
        </div>
      </div>
    </section>
  )
}