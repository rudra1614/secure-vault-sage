
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Twilio } from 'https://esm.sh/twilio@4.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1] ?? ''
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, phoneNumber, code } = await req.json()

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }

    const client = new Twilio(accountSid, authToken)
    const verifyService = await client.verify.v2.services.create({
      friendlyName: 'Secure Vault Verification'
    })

    if (action === 'send') {
      const verification = await client.verify.v2
        .services(verifyService.sid)
        .verifications.create({ to: phoneNumber, channel: 'sms' })

      return new Response(
        JSON.stringify({ success: true, status: verification.status }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'verify') {
      const verificationCheck = await client.verify.v2
        .services(verifyService.sid)
        .verificationChecks.create({ to: phoneNumber, code })

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: verificationCheck.status,
          valid: verificationCheck.valid 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
