export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { name, phone, address, items, total } = req.body;

    // التحقق من البيانات الأساسية
    if (!name || !phone || !address || !items || !total) {
      return res.status(400).json({
        success: false,
        message: "بيانات الطلب ناقصة",
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const orderEmail = process.env.ORDER_EMAIL;

    if (!resendApiKey || !orderEmail) {
      return res.status(500).json({
        success: false,
        message: "Email environment variables are missing",
      });
    }

    // تجهيز المنتجات
    const productsText = items
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — ${
            item.price * item.quantity
          } ج.م`
      )
      .join("\n");

    // محتوى الإيميل
    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
        <h2>🛍️ طلب جديد من مِسك</h2>

        <p><strong>👤 الاسم:</strong> ${name}</p>
        <p><strong>📱 الهاتف:</strong> ${phone}</p>
        <p><strong>📍 العنوان:</strong> ${address}</p>

        <h3>🧴 المنتجات:</h3>
        <div style="white-space: pre-line;">
          ${productsText}
        </div>

        <hr>

        <h3>💰 الإجمالي: ${total} ج.م</h3>
      </div>
    `;

    // إرسال الإيميل عبر Resend
    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Misk <onboarding@resend.dev>",
          to: [orderEmail],
          subject: `🛍️ طلب جديد من مِسك - ${name}`,
          html: emailHtml,
        }),
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);

      return res.status(500).json({
        success: false,
        message: "فشل إرسال الطلب إلى البريد الإلكتروني",
        error: resendData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إرسال الطلب بنجاح إلى البريد الإلكتروني",
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الطلب",
    });
  }
}
