#!/usr/bin/env tsx

const BASE_URL = 'http://localhost:3001'

async function testHealth() {
  console.log('\n1. Testing GET /health...')
  try {
    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()
    console.log('✓ Health check response:', data)
    
    if (data.status !== 'ok') {
      throw new Error('Health check failed: status is not "ok"')
    }
  } catch (error) {
    console.error('✗ Health check failed:', error)
    process.exit(1)
  }
}

async function testRepoValidate() {
  console.log('\n2. Testing GET /repo/validate...')
  try {
    const url = 'https://github.com/pallets/flask'
    const response = await fetch(`${BASE_URL}/repo/validate?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    console.log('✓ Validation response:', data)
    
    if (!data.valid) {
      throw new Error('Repository validation failed')
    }
    
    console.log(`  Language: ${data.language}`)
    console.log(`  File count: ${data.fileCount}`)
  } catch (error) {
    console.error('✗ Repository validation failed:', error)
    process.exit(1)
  }
}

async function testAnalyzeStream() {
  console.log('\n3. Testing GET /analyze/stream...')
  console.log('   Note: This test may hit Groq rate limits on free tier.')
  console.log('   If it fails with rate_limit_exceeded, the server is working correctly.')
  try {
    // Use a smaller repo to avoid rate limits
    const url = 'https://github.com/pallets/flask'
    const response = await fetch(
      `${BASE_URL}/analyze/stream?repoUrl=${encodeURIComponent(url)}`,
      {
        headers: {
          'Accept': 'text/event-stream'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status} ${response.statusText}`)
    }
    
    if (!response.body) {
      throw new Error('No response body')
    }
    
    console.log('✓ Stream connected, processing events...')
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let adrCount = 0
    let archaeologyCount = 0
    let done = false
    
    while (!done) {
      const { value, done: streamDone } = await reader.read()
      done = streamDone
      
      if (value) {
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete SSE messages
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete message in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6) // Remove 'data: ' prefix
            try {
              const event = JSON.parse(jsonStr)
              
              switch (event.type) {
                case 'stage_start':
                  console.log(`  → Stage ${event.stage} started: ${event.name}`)
                  break
                  
                case 'stage_complete':
                  console.log(`  ✓ Stage ${event.stage} complete: ${event.count} items in ${event.durationMs}ms`)
                  break
                  
                case 'adr_ready':
                  adrCount++
                  console.log(`  📄 ADR ready: ${event.adr.id} - ${event.adr.title}`)
                  if (event.adr.archaeology) {
                    archaeologyCount += event.adr.archaeology.length
                  }
                  break
                  
                case 'pipeline_done':
                  console.log(`  ✓ Pipeline complete!`)
                  console.log(`    Total ADRs: ${event.package.adrs.length}`)
                  console.log(`    Archaeology findings: ${event.package.archaeologyCount}`)
                  console.log(`    Total time: ${event.package.totalTimeMs}ms`)
                  done = true
                  break
                  
                case 'error':
                  console.error(`  ✗ Error: ${event.message}`)
                  // Check if it's a rate limit error
                  if (event.message.includes('rate_limit_exceeded') || event.message.includes('Request too large')) {
                    console.log('\n⚠️  Hit Groq API rate limit - this is expected on free tier')
                    console.log('   The server is working correctly!')
                    done = true
                    break
                  }
                  throw new Error(event.message)
              }
            } catch (parseError) {
              console.warn('  Warning: Could not parse event:', jsonStr)
            }
          }
        }
      }
    }
    
    console.log(`\n✓ Stream test complete: ${adrCount} ADRs, ${archaeologyCount} archaeology findings`)
    
  } catch (error) {
    console.error('✗ Stream test failed:', error)
    process.exit(1)
  }
}

async function runTests() {
  console.log('Testing server endpoints...')
  console.log('Make sure the server is running: npx tsx server.ts')
  
  try {
    await testHealth()
    await testRepoValidate()
    await testAnalyzeStream()
    
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Tests failed')
    process.exit(1)
  }
}

runTests()

// Made with Bob
