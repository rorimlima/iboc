import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tuqepsbyqxlqxcesgafl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cWVwc2J5cXhscXhjZXNnYWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTQ2MzksImV4cCI6MjA5MjI3MDYzOX0.hHvBvKLMaBUTo7bcN3xIaCsoLt5SyKnX8tOGxu-kvg4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
