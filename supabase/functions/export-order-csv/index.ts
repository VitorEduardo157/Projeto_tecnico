// supabase/functions/export-order-csv/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Crie um cliente Supabase para acessar seu banco de dados
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Pega o ID do pedido da URL, ex: /export-order-csv?order_id=123
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");

    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    // Busca os itens do pedido no banco de dados
    const { data: items, error } = await supabaseClient
      .from("order_items")
      .select(`
        quantity,
        price_at_purchase,
        products ( name, description )
      `)
      .eq("order_id", orderId);

    if (error) throw error;
    if (!items || items.length === 0) {
       return new Response("No items found for this order.", { status: 404 });
    }

    // Monta o cabeçalho do CSV
    let csv = "Produto,Descricao,Quantidade,PrecoUnitario,Subtotal\n";

    // Adiciona as linhas do CSV
    items.forEach((item) => {
      const product = item.products;
      const subtotal = item.quantity * item.price_at_purchase;
      csv += `"${product.name}","${product.description}",${item.quantity},${item.price_at_purchase},${subtotal}\n`;
    });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="pedido_${orderId}.csv"`,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});