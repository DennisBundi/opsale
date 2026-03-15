import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, business_name, category, team_size, country } = body;

    if (!full_name || !email || !business_name || !category || !team_size || !country) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const { error } = await supabase.from('waitlist').insert({
      full_name,
      email,
      business_name,
      category,
      team_size,
      country,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
      }
      console.error('Waitlist insert error:', error);
      return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Waitlist route error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
