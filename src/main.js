const whatsappNumber = '919381029301'
const web3FormsEndpoint = 'https://api.web3forms.com/submit'
const web3FormsKey = '33870631-afc9-4f41-8367-6b3ed273ebb0'

const directMessage = [
  'Hello Monisha Security Agency,',
  '',
  'I would like to enquire about your Security / Manpower / Housekeeping services.',
  'Please share more details regarding your services and availability.',
  '',
  'Thank you.',
].join('\n')

const openWhatsapp = (message) => {
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
}

const getEnquiryData = () => {
  const data = new FormData(form)

  return {
    name: data.get('name')?.toString().trim() || '',
    email: data.get('email')?.toString().trim() || '',
    phone: data.get('phone')?.toString().trim() || '',
    purpose: data.get('purpose')?.toString().trim() || '',
    message: data.get('message')?.toString().trim() || '',
  }
}

const buildEnquiryMessage = (data) =>
  [
    'Hello Monisha Security Agency,',
    '',
    'I would like to submit an enquiry with the following details:',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || 'Not provided'}`,
    `Service: ${data.purpose}`,
    `Message: ${data.message || 'Not provided'}`,
    '',
    'Thank you.',
  ].join('\n')

const buildWeb3FormsPayload = (data) => ({
  access_key: web3FormsKey,
  subject: `Website Enquiry - ${data.purpose || 'Monisha Security Agency'}`,
  from_name: 'Monisha Security Agency Website',
  name: data.name,
  email: data.email,
  phone: data.phone || 'Not provided',
  purpose: data.purpose || 'Not provided',
  message: data.message || 'Not provided',
})

const menuToggle = document.querySelector('.menu-toggle')
const navLinks = document.querySelector('.nav-links')

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('nav-links--open')
  menuToggle.classList.toggle('menu-toggle--open', isOpen)
  menuToggle.setAttribute('aria-expanded', String(isOpen))
})

document.addEventListener('click', (event) => {
  if (!navLinks?.classList.contains('nav-links--open')) return
  if (event.target.closest('.navbar')) return

  navLinks.classList.remove('nav-links--open')
  menuToggle?.classList.remove('menu-toggle--open')
  menuToggle?.setAttribute('aria-expanded', 'false')
})

document.querySelectorAll('.nav-links a, .brand').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('nav-links--open')
    menuToggle?.classList.remove('menu-toggle--open')
    menuToggle?.setAttribute('aria-expanded', 'false')
  })
})

const revealNodes = document.querySelectorAll('.reveal')

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.16 },
  )

  revealNodes.forEach((node) => revealObserver.observe(node))
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'))
}

const form = document.querySelector('#enquiry-form')
const emailButton = document.querySelector('#send-email')
const formStatus = document.querySelector('#form-status')

const setFormStatus = (message, type = '') => {
  if (!formStatus) return

  formStatus.textContent = message
  formStatus.className = `form-status${type ? ` form-status--${type}` : ''}`
}

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!form.reportValidity()) return

  setFormStatus('')
  openWhatsapp(buildEnquiryMessage(getEnquiryData()))
})

emailButton?.addEventListener('click', async () => {
  if (!form?.reportValidity()) return
  if (web3FormsKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    setFormStatus('Add your Web3Forms access key before sending email.', 'error')
    return
  }

  const originalText = emailButton.textContent
  emailButton.disabled = true
  emailButton.textContent = 'Sending...'
  setFormStatus('Sending email...')

  try {
    const response = await fetch(web3FormsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildWeb3FormsPayload(getEnquiryData())),
    })
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Email request failed')
    }

    setFormStatus('Mail sent successfully.', 'success')
    form.reset()
  } catch (error) {
    setFormStatus('Email could not be sent. Please try again or use WhatsApp.', 'error')
  } finally {
    emailButton.disabled = false
    emailButton.textContent = originalText
  }
})

document.querySelector('#direct-whatsapp')?.addEventListener('click', () => {
  openWhatsapp(directMessage)
})

const lightbox = document.querySelector('#media-lightbox')
const lightboxContent = lightbox?.querySelector('.media-lightbox__content')
const lightboxTitle = lightbox?.querySelector('.media-lightbox__title')

const closeLightbox = () => {
  lightbox?.setAttribute('aria-hidden', 'true')
  lightboxContent?.replaceChildren()
  if (lightboxTitle) lightboxTitle.textContent = ''
}

document.querySelectorAll('[data-media-type]').forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.mediaType
    const title = button.dataset.title || ''
    const media =
      type === 'video'
        ? Object.assign(document.createElement('video'), {
            src: button.dataset.src,
            poster: button.dataset.poster,
            controls: true,
            autoplay: true,
          })
        : Object.assign(document.createElement('img'), {
            src: button.dataset.src,
            alt: title,
          })

    lightboxContent?.replaceChildren(media)
    if (lightboxTitle) lightboxTitle.textContent = title
    lightbox?.setAttribute('aria-hidden', 'false')
  })
})

lightbox?.querySelectorAll('.media-lightbox__backdrop, .media-lightbox__close').forEach((button) => {
  button.addEventListener('click', closeLightbox)
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox?.getAttribute('aria-hidden') === 'false') {
    closeLightbox()
  }
})
