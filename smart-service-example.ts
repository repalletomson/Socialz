// Example smart-service Edge Function
// Copy this code into your Supabase Edge Function editor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface DeleteUserRequest {
  action: string
  userId: string
  userEmail: string
  confirmDelete: boolean
}

Deno.serve(async (req) => {
  console.log(`🔍 Smart-service request: ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log(`🔧 Supabase URL: ${supabaseUrl ? 'Present' : 'Missing'}`)
    console.log(`🔧 Service Role Key: ${serviceRoleKey ? 'Present' : 'Missing'}`)
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    let requestBody: any
    try {
      requestBody = await req.json()
      console.log(`📋 Request body: ${JSON.stringify(requestBody)}`)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Route based on action
    if (requestBody.action === 'delete-user') {
      return await handleDeleteUser(req, supabaseAdmin, requestBody)
    } else if (requestBody.action === 'test') {
      return new Response(
        JSON.stringify({ success: true, message: 'Smart-service is working!' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${requestBody.action}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('❌ Unexpected error in smart-service:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleDeleteUser(req: Request, supabaseAdmin: any, requestBody: DeleteUserRequest) {
  console.log('🗑️ Handling delete user request')

  // Get the current user from the request
  const authHeader = req.headers.get('Authorization')
  console.log(`🔐 Auth header: ${authHeader ? 'Present' : 'Missing'}`)
  
  if (!authHeader) {
    console.error('❌ No authorization header')
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Verify the user is authenticated
  const token = authHeader.replace('Bearer ', '')
  console.log(`🔑 Token length: ${token.length}`)
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError) {
    console.error('❌ Auth error:', authError.message)
    return new Response(
      JSON.stringify({ error: 'Invalid authentication', details: authError.message }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
  
  if (!user) {
    console.error('❌ No user found')
    return new Response(
      JSON.stringify({ error: 'Invalid authentication' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  console.log(`👤 Authenticated user: ${user.email} (${user.id})`)

  const { userId, userEmail, confirmDelete } = requestBody

  // Validation
  if (!confirmDelete) {
    console.error('❌ Deletion not confirmed')
    return new Response(
      JSON.stringify({ error: 'Deletion not confirmed' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Security checks: users can only delete their own account
  if (user.id !== userId || user.email !== userEmail) {
    console.error(`❌ Unauthorized attempt: ${user.email} trying to delete ${userEmail}`)
    return new Response(
      JSON.stringify({ error: 'Unauthorized: can only delete own account' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  console.log(`🗑️ Deleting account for user: ${userEmail} (${userId})`)

  // Delete user data in order
  const tables = ['likes', 'comments', 'posts', 'streaks', 'saved_posts', 'users']
  let deletedCount = 0

  for (const table of tables) {
    try {
      console.log(`🗑️ Deleting from ${table}...`)
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId)
      
      if (error) {
        console.error(`❌ Error deleting from ${table}:`, error.message)
      } else {
        deletedCount++
        console.log(`✅ Deleted from ${table}`)
      }
    } catch (err) {
      console.error(`❌ Exception deleting from ${table}:`, err)
    }
  }

  // Delete the auth user
  console.log(`🗑️ Deleting auth user: ${userId}`)
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  if (authDeleteError) {
    console.error('❌ Error deleting auth user:', authDeleteError)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete user account',
        details: authDeleteError.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  console.log(`🎉 Successfully deleted account for ${userEmail}`)
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Account deleted successfully',
      deletedTables: deletedCount,
      userEmail: userEmail
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
} 