import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPRequest {
  phone: string;
  action: 'send' | 'verify';
  code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone, action, code }: OTPRequest = await req.json()

    if (!phone) throw new Error('Phone number is required')

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioServiceSid = Deno.env.get('TWILIO_SERVICE_SID')

    if (!twilioAccountSid || !twilioAuthToken || !twilioServiceSid) {
      throw new Error('Twilio credentials not configured')
    }

    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    if (action === 'send') {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioServiceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            Channel: 'sms',
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Twilio error:', error)
        throw new Error('Failed to send OTP')
      }

      return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    else if (action === 'verify') {
      if (!code) throw new Error('Verification code is required')

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioServiceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            Code: code,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || result.status !== 'approved') {
        throw new Error('Invalid or expired verification code')
      }

      // ✅ Step 1: Check if user already exists in Supabase Auth by phone
      const { data: list, error: listError } = await supabase.auth.admin.listUsers({
        perPage: 1,
        page: 1,
        phone
      })

      let user = list?.users?.[0] ?? null

      // ✅ Step 2: If no user, create new
      if (!user) {
        const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
          phone,
          phone_confirmed: true,
          user_metadata: { phone }
        })

        if (createError) throw createError
        user = newUserData.user
      }

      // ✅ Step 3: Return success response
      return new Response(JSON.stringify({
        success: true,
        user: user,
        message: 'User verified successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
