import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const execAsync = promisify(exec)

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/show-interest', async (c) => {
  try {
    const supabase = createClient(`${process.env.SUPABASE_URL}`, `${process.env.SUPABASE_KEY}`)
    const { userId, targetId } = await c.req.json()

    if (!userId || !targetId) {
      return c.json({ error: 'User ID and Target ID are required' }, 400)
    }

    // First check if the like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("*")
      .eq("liker_id", userId)
      .eq("likee_id", targetId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing like:', checkError);
      return c.json({ error: 'Failed to check for existing likes' }, 500);
    }

    // If like doesn't exist, create it
    if (!existingLike) {
      const { error: insertError } = await supabase
        .from("likes")
        .insert({
          liker_id: userId,
          likee_id: targetId,
          proven: false
        });

      if (insertError) {
        console.error('Error creating like record:', insertError);
        return c.json({ error: 'Failed to register interest' }, 500);
      }
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

    if (isMatch) {
      const { error: updateInitialError } = await supabase
        .from('likes')
        .update({ proven: true })
        .eq('liker_id', userId)
        .eq('likee_id', targetId)

      const { error: updateSecondaryError } = await supabase
        .from('likes')
        .update({ proven: true })
        .eq('liker_id', targetId)
        .eq('likee_id', userId)

      if (updateInitialError) {
        console.error('Database error updating proven status:', updateInitialError);
      }
      if (updateSecondaryError) {
        console.error('Database error updating proven status:', updateSecondaryError);
      }
    }

    return c.json({
      isMatch,
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
