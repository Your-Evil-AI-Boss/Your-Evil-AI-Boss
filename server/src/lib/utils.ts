import { writeFile } from 'fs/promises'

export async function saveJSON(x, path) {
  const str = JSON.stringify(x, null, 2)
  await writeFile(path, str, 'utf8')
}
