/**
 * HomelyHub AI Trip Planner — Backend Controller
 * ------------------------------------------------
 * POST /api/ai/chat
 *
 * Flow:
 *  1. Receive { message, conversation, preferences } from frontend
 *  2. Detect destination from message/conversation
 *  3. Query MongoDB for matching properties (city / state / area search)
 *  4. Build a system prompt that injects ONLY real property data
 *  5. Call Groq API with the full conversation context
 *  6. Return structured response (trip_plan or plain chat)
 *
 * GROQ_API_KEY is read from Backend/.env — NEVER exposed to the browser.
 */

import Groq from 'groq-sdk';
import { Property } from '../Models/PropertyModel.js';

// ── Groq client (lazy, so missing key gives a clear error at request time) ──
let groqClient = null;
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY is not configured. Please add it to Backend/.env'
    );
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// ── Destination extraction helpers ─────────────────────────────────────────
const INDIAN_CITIES = [
  'mumbai','pune','aurangabad','nashik','lonavala','mahabaleshwar','nagpur',
  'goa','panjim','anjuna','calangute','vasco','margao',
  'munnar','alleppey','alappuzha','kochi','fort kochi','thrissur','kozhikode','trivandrum','thiruvananthapuram','wayanad','varkala','thekkady','kovalam',
  'manali','kasol','shimla','dharamshala','mcleodganj','spiti','kullu','dalhousie','chail','solang',
  'jaipur','udaipur','jodhpur','jaisalmer','pushkar','mount abu','ajmer','chittorgarh',
  'delhi','new delhi','agra','mathura','vrindavan','varanasi','lucknow','allahabad','prayagraj',
  'hyderabad','bengaluru','bangalore','mysuru','mysore','coorg','ooty','kodaikanal','hampi','hospet',
  'chennai','pondicherry','mahabalipuram','rameswaram','madurai','thanjavur',
  'kolkata','darjeeling','gangtok','sikkim','north east','meghalaya','shillong','kaziranga','assam',
  'rishikesh','haridwar','mussoorie','nainital','jim corbett','corbett','auli','chopta','kedarnath','badrinath',
  'ladakh','leh','kashmir','srinagar','pahalgam','gulmarg',
  'ahmedabad','surat','vadodara','rann of kutch','kutch','dwarka','somnath','gir',
  'bhubaneswar','puri','konark',
  'amritsar','chandigarh','ludhiana',
  'andaman','neil island','havelock','port blair',
  'lakshadweep','agatti',
];

/**
 * Extract potential destination keywords from a text string.
 * Returns lowercase city/state tokens found in the message.
 */
function extractDestinations(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = [];
  for (const city of INDIAN_CITIES) {
    // word-boundary check to avoid partial matches
    const regex = new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(lower)) {
      found.push(city.replace(/\s+/g, ''));  // normalised: no spaces (city stored lowercase no-spaces)
    }
  }
  return [...new Set(found)];
}

/**
 * Build a MongoDB query that searches city, state, and area
 * fields for any of the detected destination keywords.
 */
function buildPropertyQuery(destinations) {
  if (!destinations || destinations.length === 0) return null;
  const orClauses = [];
  for (const dest of destinations) {
    orClauses.push({ 'address.city': { $regex: dest, $options: 'i' } });
    orClauses.push({ 'address.state': { $regex: dest, $options: 'i' } });
    orClauses.push({ 'address.area': { $regex: dest, $options: 'i' } });
  }
  return { $or: orClauses };
}

/**
 * Search MongoDB for properties matching the destination.
 * Optionally filter by maximum nightly budget and guest count.
 */
async function findMatchingProperties(destinations, { maxBudgetPerNight, guests } = {}) {
  const query = buildPropertyQuery(destinations);
  if (!query) return [];

  if (maxBudgetPerNight) {
    query.price = { $lte: Number(maxBudgetPerNight) };
  }
  if (guests) {
    query.maximumGuest = { $gte: Number(guests) };
  }

  const props = await Property.find(query)
    .select('_id propertyName address price maximumGuest propertyType roomType images amenities description')
    .limit(5)
    .lean();

  return props.map((p) => ({
    propertyId: p._id.toString(),
    name: p.propertyName,
    location: `${p.address?.area || ''}, ${p.address?.city || ''}, ${p.address?.state || ''}`.replace(/^,\s*/, ''),
    city: p.address?.city || '',
    pricePerNight: p.price,
    maximumGuest: p.maximumGuest,
    propertyType: p.propertyType,
    image: p.images?.[0]?.url || '',
    amenities: (p.amenities || []).map((a) => a.name),
    description: p.description?.substring(0, 120) + '...',
  }));
}

// ── System prompt builder ───────────────────────────────────────────────────
function buildSystemPrompt(matchedProperties) {
  const propertyBlock =
    matchedProperties.length > 0
      ? `\n\nHOMELYHUB PROPERTIES AVAILABLE FOR THIS DESTINATION (use ONLY these, never invent property IDs or details):\n${JSON.stringify(matchedProperties, null, 2)}\n\nAlways include these in the "recommendedProperties" array of your JSON response using their exact propertyId values.`
      : `\n\nNo HomelyHub properties were found in our database for this destination. In your response, set "recommendedProperties": [] and mention: "Currently I couldn't find a matching HomelyHub property for this destination."`;

  return `You are the HomelyHub AI Travel Assistant — an expert Indian travel planner integrated into the HomelyHub property booking platform.

YOUR ROLE:
- Help users plan detailed, day-by-day trip itineraries for Indian destinations.
- Gather missing trip details by asking friendly follow-up questions (destination, duration, travelers, budget, interests).
- Recommend ONLY real HomelyHub properties from the database — never invent property names, IDs, or prices.
- Be warm, concise, and helpful. Use Indian travel knowledge (local food, festivals, transport, tips).

RESPONSE FORMAT RULES:
1. If the user has provided enough information (destination + at least 2 of: days/travelers/budget), respond with a VALID JSON object (no markdown fences, no extra text before/after):
{
  "type": "trip_plan",
  "destination": "string",
  "days": number,
  "travelers": number,
  "budget": number,
  "summary": "string (2-3 sentences overview)",
  "itinerary": [
    {
      "day": 1,
      "title": "string",
      "morning": "string",
      "afternoon": "string",
      "evening": "string",
      "food": ["dish or restaurant", "dish or restaurant"],
      "estimatedCost": number
    }
  ],
  "budgetBreakdown": {
    "accommodation": number,
    "food": number,
    "transport": number,
    "activities": number,
    "miscellaneous": number
  },
  "tips": ["tip 1", "tip 2", "tip 3"],
  "recommendedProperties": [
    {
      "propertyId": "exact _id from database",
      "name": "exact property name",
      "location": "area, city, state",
      "pricePerNight": number,
      "image": "exact image URL",
      "reason": "1 sentence why it suits this trip"
    }
  ]
}

2. If the user is asking a follow-up question, needs more info gathered, or is just chatting, respond with:
{
  "type": "chat",
  "message": "your friendly reply"
}

3. NEVER output raw text outside a JSON object.
4. NEVER invent HomelyHub property IDs, names, or prices.
5. Costs should be realistic for India in INR (₹).
${propertyBlock}`;
}

// ── Main chat handler ───────────────────────────────────────────────────────
export const handleChat = async (req, res) => {
  try {
    const { message, conversation = [], preferences = {} } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required.' });
    }

    // Trim conversation history to last 16 messages to avoid token overflow
    const trimmedHistory = conversation.slice(-16).filter(
      (m) => m && m.role && m.content
    );

    // ── Detect destinations from the entire conversation ──────────────────
    const allText = [
      ...trimmedHistory.map((m) => m.content),
      message,
    ].join(' ');
    const destinations = extractDestinations(allText);

    // ── Optional budget-per-night estimate from preferences ───────────────
    const { budget, travelers, maxBudgetPerNight } = preferences;
    let budgetPerNight = maxBudgetPerNight;
    if (!budgetPerNight && budget && preferences.days) {
      // rough estimate: 30% of total budget / number of nights
      budgetPerNight = Math.round((budget * 0.3) / preferences.days);
    }

    // ── Fetch matching real properties from MongoDB ───────────────────────
    let matchedProperties = [];
    try {
      matchedProperties = await findMatchingProperties(destinations, {
        maxBudgetPerNight: budgetPerNight,
        guests: travelers,
      });
    } catch (dbErr) {
      console.error('MongoDB property lookup failed:', dbErr.message);
      // Non-fatal: continue without property recommendations
    }

    // ── Build Groq messages array ─────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(matchedProperties);
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory,
      { role: 'user', content: message.trim() },
    ];

    // ── Call Groq ─────────────────────────────────────────────────────────
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawContent = completion.choices?.[0]?.message?.content || '';

    // ── Parse JSON response from Groq ─────────────────────────────────────
    let parsed;
    try {
      // Strip accidental markdown fences Groq sometimes adds
      const clean = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(clean);
    } catch {
      // Groq returned non-JSON — wrap as a plain chat message
      parsed = { type: 'chat', message: rawContent };
    }

    // ── Inject property data from DB into trip plan (safety net) ──────────
    // If Groq returned a trip_plan but no recommended properties, inject them.
    if (parsed.type === 'trip_plan' && matchedProperties.length > 0) {
      if (!parsed.recommendedProperties || parsed.recommendedProperties.length === 0) {
        parsed.recommendedProperties = matchedProperties.map((p) => ({
          propertyId: p.propertyId,
          name: p.name,
          location: p.location,
          pricePerNight: p.pricePerNight,
          image: p.image,
          reason: `Suits your ${parsed.destination} trip perfectly — ${p.propertyType.toLowerCase()} accommodating up to ${p.maximumGuest} guests at ₹${p.pricePerNight}/night.`,
        }));
      } else {
        // Validate that every returned propertyId is real
        const realIds = new Set(matchedProperties.map((p) => p.propertyId));
        parsed.recommendedProperties = parsed.recommendedProperties
          .filter((p) => realIds.has(p.propertyId))
          .map((p) => {
            // Merge with real data to ensure correct image/price
            const real = matchedProperties.find((r) => r.propertyId === p.propertyId);
            return real
              ? { ...p, name: real.name, pricePerNight: real.pricePerNight, image: real.image, location: real.location }
              : p;
          });
        // Append any real properties Groq missed
        const returnedIds = new Set(parsed.recommendedProperties.map((p) => p.propertyId));
        for (const mp of matchedProperties) {
          if (!returnedIds.has(mp.propertyId)) {
            parsed.recommendedProperties.push({
              propertyId: mp.propertyId,
              name: mp.name,
              location: mp.location,
              pricePerNight: mp.pricePerNight,
              image: mp.image,
              reason: `Great match for your ${parsed.destination} trip.`,
            });
          }
        }
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('AI chat error:', err.message);
    const status = err.message?.includes('GROQ_API_KEY') ? 503 : 500;
    return res.status(status).json({
      type: 'chat',
      message:
        status === 503
          ? 'The AI service is not configured yet. Please add your GROQ_API_KEY to Backend/.env.'
          : 'Sorry, I encountered an issue processing your request. Please try again in a moment.',
      error: err.message,
    });
  }
};
