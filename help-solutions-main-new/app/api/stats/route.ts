import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, device, location } = body;

    const { error } = await supabase
      .from('visitantes_web')
      .insert([
        { 
          path: path || '/', 
          device: device || 'Unknown', 
          location: location || 'Colombia' 
        }
      ]);

    if (error) {
      console.error('Error inserting visitor:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Stats API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
   try {
     // Optional: Provide a quick summary if needed
     const { count } = await supabase
       .from('visitantes_web')
       .select('*', { count: 'exact', head: true });
       
     return NextResponse.json({ 
       status: "active",
       total_visits: count || 0
     });
   } catch (err) {
     return NextResponse.json({ status: "error", message: "Database connection failed" });
   }
}
