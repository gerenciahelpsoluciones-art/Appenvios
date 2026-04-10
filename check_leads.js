const { createClient } = require('@supabase/supabase-js');

const SB_URL = "https://matyjysinegbibdwzhoq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890";

const supabase = createClient(SB_URL, SB_KEY);

async function checkLeads() {
    console.log("Checking leads in clientes_web...");
    const { data, error } = await supabase
        .from('clientes_web')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log("Last 10 leads:");
    data.forEach(lead => {
        console.log(`- [${lead.created_at}] ID: ${lead.id} | Name: ${lead.nombre} | Email: ${lead.email} | Asesor: ${lead.asesor}`);
    });
}

checkLeads();
