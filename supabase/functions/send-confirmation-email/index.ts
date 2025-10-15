import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // O Secret está configurado (Screenshot 12:38)
const FROM_EMAIL = "onboarding@resend.dev"; // *** CORREÇÃO 1: Usando o domínio de teste do Resend ***

serve(async (req) => {
  try {
    const { record: order } = await req.json();

    if (!order) throw new Error("No order data provided.");

    // *** CORREÇÃO 2: Destinatário Fixo para Teste ***
    // Você não tem a coluna customer_email no seu orders, então usamos seu e-mail para comprovação.
    const toEmail = "vitoreduardo7905473@gmail.com";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `Confirmação do Pedido #${order.id}`,
        html: `<h1>Obrigado pelo seu pedido!</h1>
                <p>Pedido #: ${order.id}</p>
                <p>Total: R$ ${order.total_amount}</p>
                <p>Status: ${order.status}</p>`,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});