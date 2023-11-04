import { Console } from 'console'
import { Transform } from 'stream'
const ts = new Transform({
  transform(chunk, _, cb) {
    cb(null, chunk)
  },
})
const logger = new Console({ stdout: ts })
// a shim for console.table for bun
export function logTable(data: object) {
  logger.table(data)
  const table = (ts.read() || '').toString()
  let result = ''
  for (const row of table.split(/[\r\n]+/)) {
    let r = row.replace(/[^┬]*┬/, '┌')
    r = r.replace(/^├─*┼/, '├')
    r = r.replace(/│[^│]*/, '')
    r = r.replace(/^└─*┴/, '└')
    r = r.replace(/'/g, ' ')
    result += `${r}\n`
  }
  // eslint-disable-next-line no-console
  console.log(result)
}
