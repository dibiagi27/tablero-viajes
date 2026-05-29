import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqxwovzumylkykoocakw.supabase.co'
const supabaseKey = 'sb_publishable_IVt3-jQMCUSHp02Gu0-BQQ_5ZgFZQnB'

export const supabase = createClient(supabaseUrl, supabaseKey)
