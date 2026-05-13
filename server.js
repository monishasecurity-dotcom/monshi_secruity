const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const nodemailer = require('nodemailer')
require('dotenv').config()

const root = __dirname
const port = Number(process.env.PORT) || 5176
const enquiryTo = 'monisha.security@gmail.com'
const maxBodySize = 100_000
const enquiryWindowMs = 15 * 60 * 1000
const maxEnquiriesPerWindow = 5
const enquiryAttempts = new Map()
const allowedPurposes = new Set([
  'Security Service',
  'Office Housekeeping',
  'Industrial Cleaning',
  'Manpower Outsourcing',
  'Facility Management',
  'Sanitation Services',
])

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

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk

      if (body.length > maxBodySize) {
        request.destroy()
        reject(new Error('Request body too large'))
      }
    })

    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (error) {
        reject(error)
      }
    })

    request.on('error', reject)
  })

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

const getClientIp = (request) => request.socket.remoteAddress || 'unknown'

const isRateLimited = (request) => {
  const now = Date.now()
  const ip = getClientIp(request)
  const attempts = enquiryAttempts.get(ip) || []
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < enquiryWindowMs)

  if (recentAttempts.length >= maxEnquiriesPerWindow) {
    enquiryAttempts.set(ip, recentAttempts)
    return true
  }

  recentAttempts.push(now)
  enquiryAttempts.set(ip, recentAttempts)
  return false
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const cleanText = (value, maxLength) => String(value || '').trim().slice(0, maxLength)

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

  if (request.method === 'POST' && url.pathname === '/api/enquiry') {
    ;(async () => {
      if (isRateLimited(request)) {
        sendJson(response, 429, { ok: false, message: 'Too many enquiries. Please try again later.' })
        return
      }

      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        sendJson(response, 500, { ok: false, message: 'Email service is not configured.' })
        return
      }

      const enquiry = await readJsonBody(request)
      const name = cleanText(enquiry.name, 80)
      const email = cleanText(enquiry.email, 120)
      const phone = cleanText(enquiry.phone, 30)
      const purpose = cleanText(enquiry.purpose, 60)
      const message = cleanText(enquiry.message, 1500)

      if (!name || !isValidEmail(email)) {
        sendJson(response, 400, { ok: false, message: 'A valid name and email are required.' })
        return
      }

      if (purpose && !allowedPurposes.has(purpose)) {
        sendJson(response, 400, { ok: false, message: 'Please choose a valid service.' })
        return
      }

      const text = [
        'New enquiry from the Monisha Security Agency website:',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        `Service: ${purpose || 'Not provided'}`,
        `Message: ${message || 'Not provided'}`,
      ].join('\n')

      await createTransporter().sendMail({
        from: `"Monisha Security Website" <${process.env.SMTP_USER}>`,
        to: enquiryTo,
        replyTo: email,
        subject: `Website Enquiry - ${purpose || 'Monisha Security Agency'}`,
        text,
      })

      sendJson(response, 200, { ok: true })
    })().catch((error) => {
      console.error('Failed to send enquiry email:', error)
      sendJson(response, 500, { ok: false, message: 'Email could not be sent.' })
    })

    return
  }

  sendStaticFile(url, response)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Monisha Security Agency site running at http://127.0.0.1:${port}`)
})
