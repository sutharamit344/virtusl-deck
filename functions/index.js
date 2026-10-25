const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors");
const corsHandler = cors({ origin: true });
require("dotenv").config();

admin.initializeApp({
  databaseURL:
    process.env.DATABASE_URL ||
    "https://virtual-deck-52-default-rtdb.firebaseio.com",
});
const db = admin.database();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Generate unique deck ID with optional prefix
function generateDeckId(prefix = "DECK") {
  return `${prefix}-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
}

exports.gumroadWebhook = functions.https.onRequest(async (req, res) => {
  console.log("🔔 Webhook received:", req.body);

  const { email, purchase_id, product_name, license_key, short_product_id, seller_id } =
    req.body;

  // Optional seller_id verification when configured in environment
  if (process.env.GUMROAD_SELLER_ID && seller_id !== process.env.GUMROAD_SELLER_ID) {
    console.warn("⚠️ Unauthorized seller ID in webhook.");
    return res.status(403).send("Unauthorized seller.");
  }

  if (!email || !short_product_id) {
    console.warn("⚠️ Missing email or short_product_id.");
    return res.status(400).send("Missing email or short_product_id.");
  }

  const product = product_name || "Virtual Deck";
  const purchaseId = purchase_id || "GUMROAD_TEST";
  let deckId = license_key;

  // Fetch deck data from deckstore
  let deckData = {};
  try {
    const deckSnap = await db
      .ref(`deckstore/${short_product_id}`)
      .once("value");
    if (!deckSnap.exists()) {
      console.error(
        "❌ Deck not found for short_product_id:",
        short_product_id
      );
      return res.status(404).send("Deck not found.");
    }

    deckData = deckSnap.val();

    // Generate deck ID if not provided
    if (!deckId) {
      let attempts = 0;
      let unique = false;

      while (!unique && attempts < 5) {
        const newId = generateDeckId(deckData.prefix || "DECK");
        const exists = await db.ref(`decks/${newId}`).once("value");
        if (!exists.exists()) {
          deckId = newId;
          unique = true;
          console.log("✅ Generated unique deck ID:", deckId);
        }
        attempts++;
      }

      if (!deckId) {
        console.error("❌ Failed to generate unique deck ID.");
        return res.status(500).send("Failed to generate deck ID.");
      }
    }

    console.log(`✅ Deck data fetched (${deckData.cards?.length || 0} cards)`);
  } catch (err) {
    console.error("❌ Error fetching deck data:", err);
    return res.status(500).send("Error fetching deck data.");
  }

  // Save deck in Firebase
  try {
    await db.ref(`decks/${deckId}`).set({
      deckId,
      email,
      product,
      purchaseId,
      used: false,
      createdAt: Date.now(),
      ...deckData,
    });
    console.log("✅ Deck saved:", deckId);
  } catch (err) {
    console.error("❌ Failed to save deck:", err);
    return res.status(500).send("Failed to save deck.");
  }

  // Send confirmation email
  const mailOptions = {
    from: `"Virtual Deck" <sutharamit344@gmail.com>`,
    to: email,
    subject: `Your Virtual Deck is Ready!`,
    html: `
    <body style="margin:0;padding:0;background:#121212;">
    <div style="background:#121212;padding:30px;color:#ffffff;font-family:'Segoe UI', sans-serif;border-radius:8px;max-width:500px;margin:auto;">
      <h2 style="color:#00D8FF;display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <img src="https://virtual-deck-52.web.app/vc%20logo.png" alt="VC" height="40" style="margin-right:10px;">
        Virtual Deck
      </h2>
      <h3 style="color:#ffffff;margin-bottom:15px;">Delivery!</h3>
      <p>Thanks for purchasing <strong>${product}</strong>!</p>
      <p>Your Deck ID:</p>
      <div style="padding:15px;background:#1e1e1e;border-radius:6px;text-align:center;margin:10px 0;">
        <h3 style="color:#00D8FF;margin:0;">${deckId}</h3>
      </div>
      <p>Enter this Deck ID in the app to redeem and use your virtual cards.</p>
      <p style="font-size:12px;color:#888;margin-top:30px;">— The Virtual Deck Team</p>
    </div>
    </body>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.messageId);
    return res.status(200).send(`Deck ${deckId} created and email sent.`);
  } catch (err) {
    console.error("❌ Email send failed:", err);
    return res.status(500).send("Deck saved but email failed.");
  }
});

exports.sendWelcomeEmail = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).send("Missing email or name");
    }

    const mailOptions = {
      from: `"Virtual Deck" <sutharamit344@gmail.com>`,
      to: email,
      subject: `🎉 Welcome to Virtual Deck`,
      html: `
      <body style="background:#121212;margin:0;padding:0;">
        <div style="max-width:500px;margin:auto;background:#1e1e1e;padding:30px;border-radius:10px;color:white;font-family:sans-serif">
          <img src="https://virtual-deck-52.web.app/vc%20logo.png" alt="VC" height="40" style="margin:auto;display:block;">
          <h2 style="color:#00D8FF;text-align:center;">Welcome, ${name}!</h2>
          <p style="text-align:center;">Thanks for signing up. You’re ready to explore your virtual decks and play online!</p>
          <p style="font-size:12px;color:#888;text-align:center;margin-top:30px;">— The Virtual Deck Team</p>
        </div>
      </body>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Welcome email sent to ${email}`);
      res.status(200).send("Welcome email sent");
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      res.status(500).send("Email failed");
    }
  });
});
