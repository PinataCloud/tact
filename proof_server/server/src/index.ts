import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/show-interest', async (c) => {
  try {
    const { userId, targetId } = await c.req.json()

    if (!userId || !targetId) {
      return c.json({ error: 'User ID and Target ID are required' }, 400)
    }

    const { stdout, stderr } = await execAsync(
      `../target/release/tact --prove --user-id ${userId} --target-id ${targetId}`
    )

    if (stderr) {
      console.error(`Error: ${stderr}`)
    }

    // Extract the result from stdout
    const isMatchLine = stdout.split('\n').find(line => line.includes('Is Match:'))
    const isMatch = isMatchLine ? isMatchLine.includes('true') : false

    return c.json({
      userId,
      targetId,
      isMatch,
      details: stdout
    })
  } catch (error) {
    console.error('Error:', error)
    return c.json({ error: 'Failed to process request' }, 500)
  }
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
