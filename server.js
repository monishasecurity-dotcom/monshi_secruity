const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
require('dotenv').config()

const root = __dirname
const port = Number(process.env.PORT) || 5176
const host = process.env.HOST || '0.0.0.0'

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

const sendStaticFile = (url, response) => {
  let requestedPath

  try {
    requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Bad request')
    return
  }

  const filePath = path.resolve(root, `.${requestedPath}`)
  const relativePath = path.relative(root, filePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Forbidden')
    return
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Not found')
      return
    }

    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' })
    response.end(content)
  })
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  sendStaticFile(url, response)
})

server.listen(port, host, () => {
  console.log(`Monisha Security Agency site running on http://${host}:${port}`)
})
