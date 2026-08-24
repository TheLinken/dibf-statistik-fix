import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bhrmaaguztnvavfntzjz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocm1hYWd1enRudmF2Zm50emp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczOTcyOTQsImV4cCI6MjEwMjk3MzI5NH0.g8VBnwWHCuy2lgBZqnt0N59evL28OLB40N-yWTw8LEI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)