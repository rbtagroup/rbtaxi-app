import { createClient } from '@supabase/supabase-js'

// Tyto údaje najdete v Supabase v sekci Settings -> API
const supabaseUrl = 'https://wkjlolveaxfgekuuzwlk.supabase.co';
const supabaseKey = 'sb_publishable_Psn6LiYQu-buFoH3psEv8A_YhZtQRh5'

export const supabase = createClient(supabaseUrl, supabaseKey)