import { execFileSync } from 'node:child_process'

export default () => {
  execFileSync('bundle', ['exec', 'ruby', 'e2e/seed.rb'], { stdio: 'inherit' })
}
