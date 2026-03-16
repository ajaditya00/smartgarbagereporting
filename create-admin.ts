import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

const supabaseAdmin = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdminUser() {
  const email = 'adityasingh8412@gmail.com';
  const password = 'Clan993181@';

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === email);

    let userId: string;

    if (userExists) {
      console.log('User already exists:', userExists.id);
      userId = userExists.id;
    } else {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Admin User',
          },
        },
      });

      if (authError) {
        console.error('Error signing up:', authError);
        return;
      }

      if (!authData.user) {
        console.error('No user data returned');
        return;
      }

      console.log('User created:', authData.user.id);
      userId = authData.user.id;
    }

    // Check if role already exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (existingRole) {
      console.log('Admin role already assigned');
      return;
    }

    // Insert admin role using service role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
      });

    if (roleError) {
      console.error('Error assigning admin role:', roleError);
      return;
    }

    console.log('Admin role assigned successfully');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();