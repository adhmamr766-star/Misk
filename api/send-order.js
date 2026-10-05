export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { name, phone, address, items, total } = req.body;

    if (!name || !phone || !address || !items || !total) {
      return res.status(400).json({
        success: false,
        message: "بيانات الطلب ناقصة",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "RESEND_API_KEY is missing",
      });
    }

    const productsText = items
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — ${
            item.price * item.quantity
          } ج.م`
      )
      .join("<br>");

    const html = `
      <div dir="rtl">
        <h2>🛍️ طلب جديد من مِسك</h2>

        <p><strong>👤 الاسم:</strong> ${name}</p>
        <p><strong>📱 الهاتف:</strong> ${phone}</p>
        <p><strong>📍 العنوان:</strong> ${address}</p>

        <h3>🧴 المنتجات:</h3>
        <p>${productsText}</p>

        <h3>💰 الإجمالي: ${total} ج.م</h3>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Misk <onboarding@resend.dev>",
        to: ["miskkk22@gmail.com"],
        subject: `🛍️ طلب جديد من مِسك - ${name}`,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);

      return res.status(500).json({
        success: false,
        message: "فشل إرسال الإيميل",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إرسال الطلب بنجاح",
      emailId: data.id,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الطلب",
    });
  }
}
