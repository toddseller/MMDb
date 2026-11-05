import { test, expect, USER, signIn } from './fixtures.js'

// The smallest bytes that read as a JPEG; the upload itself is answered by the test, so nothing reaches S3.
const jpeg = { name: 'poster.jpg', mimeType: 'image/jpeg', buffer: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 'j')]) }
const uploaded = 'https://cdn.myflix.stream/images/uploaded-poster.jpg'

const openArtworkTab = async (page) => {
  await page.goto(`/users/${USER.id}/shows`)
  await page.locator('#show-list img[alt="Harbor Lights Poster"]').click()
  // The edit link is an icon with no text; its URL is what the server serves the form at.
  await page.locator('a[href*="/shows/"][href$="/edit"]').click()
  await page.getByRole('button', { name: 'Artwork' }).click()
  await expect(page.getByText('Upload', { exact: true })).toBeVisible()
}

const answerUpload = (page, response) => page.route('**/shows/*/artwork', (route) => route.fulfill(response))

test.beforeEach(async ({ page }) => {
  await signIn(page)
})

test('an uploaded poster fills the poster field and shows in the form', async ({ page }) => {
  await answerUpload(page, { status: 200, contentType: 'application/json', body: JSON.stringify({ url: uploaded }) })
  await openArtworkTab(page)

  await page.locator('input[type="file"][name="artwork"]').setInputFiles(jpeg)

  await expect(page.locator('input[name="season[poster]"]:visible')).toHaveValue(uploaded)
  await expect(page.locator(`img[src="${uploaded}"]:visible`).first()).toBeVisible()
  await expect(page.getByText('Uploading...')).toHaveCount(0)
})

test('a failed upload shows the server’s message', async ({ page }) => {
  const error = "The artwork couldn't be stored. Try again."
  await answerUpload(page, { status: 502, contentType: 'application/json', body: JSON.stringify({ error }) })
  await openArtworkTab(page)

  await page.locator('input[type="file"][name="artwork"]').setInputFiles(jpeg)

  await expect(page.getByText(error)).toBeVisible()
})

const showArtwork = async (page, width, height) => {
  const url = `https://cdn.myflix.stream/images/${width}x${height}.svg`
  await page.route(url, (route) => route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="teal"/></svg>` }))
  await openArtworkTab(page)
  const poster = page.locator('input[name="season[poster]"]:visible')
  await poster.fill(url)
  await poster.dispatchEvent('change')
  const preview = page.locator('#artwork img')
  await expect(preview).toHaveJSProperty('naturalWidth', width)
  return preview
}

test('a vertical poster fits the tab and leaves its controls usable', async ({ page }) => {
  const preview = await showArtwork(page, 300, 450)

  const image = await preview.boundingBox()
  const body = await page.locator('#edit-show .modal-body').boundingBox()
  expect(image.y + image.height).toBeLessThanOrEqual(body.y + body.height)
  await expect(preview).toHaveCSS('object-fit', 'contain')
  const controls = [page.getByText('Upload', { exact: true }), page.locator('#ok'), page.locator('#cancel')]
  // Checked before any click: Playwright scrolls the dialog's clipped overflow to reach a target, which a mouse can't.
  for (const control of controls) {
    await expect(control).toBeInViewport({ ratio: 1 })
  }
  for (const control of controls) {
    await control.click({ trial: true, timeout: 2000 })
  }
})

test('landscape artwork fills the tab’s width', async ({ page }) => {
  const preview = await showArtwork(page, 1600, 900)

  expect((await preview.boundingBox()).width).toBe(450)
})
