import puppeteer, { LaunchOptions, BrowserOptions, ChromeArgOptions } from 'puppeteer'
import logger from '../../log'

type PuppeteerOptions = LaunchOptions & ChromeArgOptions & BrowserOptions

async function send(puppeteerOptions, res, options, html) {
  res.header('Content-Type', 'application/pdf')
  res.header('Content-Transfer-Encoding', 'binary')
  res.header('Content-Disposition', `inline; filename=${options.filename}`)

  const browser = await puppeteer.launch(puppeteerOptions)
  try {
    const page = await browser.newPage()
    await page.setContent(html)
    const pdf = await page.pdf(options.pdfOptions)
    res.send(pdf)
  } catch (e) {
    logger.warn(e)
    throw e
  } finally {
    await browser.close()
  }
}

// eslint-disable-next-line no-unused-vars
function render(req, res, next, puppeteerOptions) {
  return (view, pageData, options = { filename: 'document.pdf' }) => {
    res.render(view, pageData, (error, html) => {
      if (error) {
        throw error
      }
      return send(puppeteerOptions, res, options, html)
    })
  }
}

export = function pdfRenderer(
  puppeteerOptions: PuppeteerOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }
) {
  return (req, res, next) => {
    res.renderPDF = render(req, res, next, puppeteerOptions)
    next()
  }
}
