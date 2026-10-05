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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({
        success: false,
        message: "Telegram environment variables are missing",
      });
    }

    // تجهيز المنتجات
    const productsText = items
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — ${item.price * item.quantity} ج.م`
      )
      .join("\n");

    // الرسالة التي ستصل إلى Telegram
    const message = `
🛍️ *طلب جديد من مِسك*

👤 *الاسم:* ${name}
📱 *الهاتف:* ${phone}
📍 *العنوان:* ${address}

🧴 *المنتجات:*
${productsText}

💰 *الإجمالي:* ${total} ج.م
`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error("Telegram error:", telegramData);

      return res.status(500).json({
        success: false,
        message: "فشل إرسال الطلب إلى Telegram",
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إرسال الطلب بنجاح",
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الطلب",
    });
  }
}
