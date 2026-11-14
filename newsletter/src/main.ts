import { run } from './run.tsx'

run(new Date(), '/issues').catch((error) => {
  console.error(error)
  process.exitCode = 1
})
