const SB_URL = "https://matyjysinegbibdwzhoq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890";

async function checkLeads() {
    console.log("Checking leads via fetch...");
    try {
        const response = await fetch(`${SB_URL}/rest/v1/clientes_web?select=*&order=created_at.desc&limit=10`, {
            headers: {
                "apikey": SB_KEY,
                "Authorization": `Bearer ${SB_KEY}`
            }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
            if (data.length === 0) {
                console.log("No leads found.");
            } else {
                data.forEach(l => console.log(`[${l.created_at}] Name: ${l.nombre} | Email: ${l.email} | Asesor: ${l.asesor}`));
            }
        } else {
            console.error("Error from Supabase:", data);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

checkLeads();
