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
