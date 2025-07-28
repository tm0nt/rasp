// pix-gateway.js
const express = require('express')
const axios = require('axios')
const https = require('https')
const dns = require('dns')

const app = express()
app.use(express.json())

// Força o uso de IPv4 via lookup
const ipv4Agent = new https.Agent({
  lookup: (hostname, options, callback) => {
    return dns.lookup(hostname, { family: 4 }, callback)
  }
})

// Endpoint local
app.post('/payment', async (req, res) => {
  const authHeader = req.headers['authorization']
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader
    : null

  if (!bearerToken) {
    return res.status(400).json({ error: 'Token Bearer ausente ou inválido' })
  }

  try {
    const response = await axios.post('https://api.pixupbr.com/v2/pix/payment', req.body, {
      headers: {
        'Authorization': bearerToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      httpsAgent: ipv4Agent,
      validateStatus: () => true  // Para não lançar erros em status HTTP >= 400, similar ao fetch
    })

    const data = response.data

    res.status(response.status).json(data)
  } catch (error) {
    console.error('Erro ao fazer proxy para PIXUP:', error)
    res.status(500).json({ error: 'Erro interno ao fazer proxy para PIXUP', details: error.message })
  }
})

// Inicia servidor
const PORT = 4141
app.listen(PORT, () => {
  console.log(`Servidor de proxy PixUp rodando em http://localhost:${PORT}`)
})