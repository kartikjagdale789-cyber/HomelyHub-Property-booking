/**
 * HomelyHub Seed Script
 * ---------------------
 * Creates 2 seed host users (if they don't already exist) and
 * inserts 25 realistic Indian property records into MongoDB.
 *
 * Usage:
 *   cd Backend
 *   npm run seed
 *
 * Safety:
 *   - Does NOT delete existing users, bookings, payments or reviews.
 *   - Skips inserting a property if one with the same propertyName already exists.
 *   - Closes the MongoDB connection cleanly when done.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

dotenv.config();

// ── Inline schema definitions (mirrors src/Models/*.js) ────────────────────
// We redefine them here so the seed works standalone without ESM transform issues.

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    passwordConfirm: { type: String },
    phoneNumber: { type: String, required: true, unique: true },
    avatar: {
      url: { type: String },
      public_id: { type: String },
    },
    passwordChangedAt: { type: Date },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

const propertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  description: { type: String, required: true },
  extraInfo: {
    type: String,
    default:
      "Nestled in a tranquil neighborhood, the house exudes an aura of charm and elegance. The exterior is adorned with a harmonious blend of classic and contemporary architectural elements, featuring a beautiful brick facade and a welcoming front porch. As you step inside, you are greeted by a spacious, sunlit living room with high ceilings and large windows that invite an abundance of natural light. The hardwood floors add a touch of warmth to the space, complementing the neutral color palette. The kitchen is a chef's dream, equipped with modern appliances, sleek countertops, and ample storage space. It opens up to a cozy dining area, creating a perfect setting for family meals and gatherings.",
  },
  propertyType: {
    type: String,
    enum: ["House", "Flat", "Guest House", "Hotel"],
    default: "House",
  },
  roomType: {
    type: String,
    enum: ["Anytype", "Room", "Entire Home"],
    default: "Anytype",
  },
  maximumGuest: { type: Number, required: true },
  amenities: [
    {
      name: {
        type: String,
        required: true,
        enum: [
          "Wifi",
          "Kitchen",
          "Ac",
          "Washing Machine",
          "Tv",
          "Pool",
          "Free Parking",
        ],
      },
      icon: { type: String, required: true },
    },
  ],
  images: {
    type: [
      {
        public_id: { type: String },
        url: { type: String, required: true },
      },
    ],
    validate: {
      validator: (a) => a.length >= 6,
      message: "The images array must contain at least 6 images.",
    },
  },
  price: { type: Number, required: true, default: 500 },
  address: {
    area: String,
    city: String,
    state: String,
    pincode: Number,
  },
  currentBookings: [
    {
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      fromDate: Date,
      toDate: Date,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  slug: String,
  chekInTime: { type: String, default: "11:00" },
  chekOutTime: { type: String, default: "13:00" },
});

// Pre-save: generate slug + lowercase city (mirrors production model)
propertySchema.pre("save", function (next) {
  this.slug = this.propertyName.toLowerCase().replace(/\s+/g, "-");
  next();
});
propertySchema.pre("save", function (next) {
  if (this.address && this.address.city) {
    this.address.city = this.address.city.toLowerCase().replaceAll(" ", "");
  }
  next();
});

// Use existing model if already registered (avoids OverwriteModelError on re-runs)
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Property =
  mongoose.models.Property || mongoose.model("Property", propertySchema);

// ── Amenity icon map ────────────────────────────────────────────────────────
const AMENITY_ICONS = {
  Wifi: "wifi",
  Kitchen: "kitchen",
  Ac: "ac_unit",
  "Washing Machine": "local_laundry_service",
  Tv: "tv",
  Pool: "pool",
  "Free Parking": "local_parking",
};

function amenity(name) {
  return { name, icon: AMENITY_ICONS[name] };
}

// ── Seed host users ─────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    name: "Ravi Sharma",
    email: "ravi.sharma.homelyhub@gmail.com",
    password: "homelyhub@123",
    phoneNumber: "9876543210",
    avatar: {
      url: "https://i.pravatar.cc/150?img=11",
      public_id: "seed_avatar_1",
    },
  },
  {
    name: "Priya Nair",
    email: "priya.nair.homelyhub@gmail.com",
    password: "homelyhub@123",
    phoneNumber: "9876543211",
    avatar: {
      url: "https://i.pravatar.cc/150?img=47",
      public_id: "seed_avatar_2",
    },
  },
];

// ── Realistic Indian property data ──────────────────────────────────────────
// Images: Unsplash public CDN — free, no-auth, reliable
function buildProperties(hostIds) {
  const [host1, host2] = hostIds;

  return [
    // ── MUMBAI ──
    {
      propertyName: "Sea-View Luxury Apartment, Bandra",
      description:
        "A premium sea-facing apartment in the heart of Bandra West, Mumbai. Enjoy panoramic Arabian Sea views from your private balcony. Walking distance to Bandstand Promenade and top restaurants.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 4,
      price: 4500,
      address: { area: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: 400050 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Tv"), amenity("Kitchen"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800", public_id: "seed_p1_1" },
        { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", public_id: "seed_p1_2" },
        { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", public_id: "seed_p1_3" },
        { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", public_id: "seed_p1_4" },
        { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800", public_id: "seed_p1_5" },
        { url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800", public_id: "seed_p1_6" },
      ],
      userId: host1,
      currentBookings: [],
    },
    {
      propertyName: "Cosy Studio Near BKC, Kurla",
      description:
        "A well-furnished studio apartment perfectly located near Bandra-Kurla Complex — Mumbai's corporate hub. Ideal for business travelers and weekend tourists alike.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 2,
      price: 2200,
      address: { area: "Kurla West", city: "Mumbai", state: "Maharashtra", pincode: 400070 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Tv"), amenity("Kitchen")],
      images: [
        { url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", public_id: "seed_p2_1" },
        { url: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", public_id: "seed_p2_2" },
        { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", public_id: "seed_p2_3" },
        { url: "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=800", public_id: "seed_p2_4" },
        { url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800", public_id: "seed_p2_5" },
        { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800", public_id: "seed_p2_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── GOA ──
    {
      propertyName: "Beachfront Villa, Calangute",
      description:
        "Wake up to the sound of waves in this stunning beachfront villa in Calangute, Goa. Private pool, spacious garden, and direct beach access make it the ultimate tropical retreat for families and groups.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 8,
      price: 9800,
      address: { area: "Calangute Beach Road", city: "Goa", state: "Goa", pincode: 403516 },
      amenities: [amenity("Wifi"), amenity("Pool"), amenity("Kitchen"), amenity("Free Parking"), amenity("Ac"), amenity("Tv")],
      images: [
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", public_id: "seed_p3_1" },
        { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800", public_id: "seed_p3_2" },
        { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800", public_id: "seed_p3_3" },
        { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", public_id: "seed_p3_4" },
        { url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", public_id: "seed_p3_5" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800", public_id: "seed_p3_6" },
      ],
      userId: host1,
      currentBookings: [],
    },
    {
      propertyName: "Portuguese Heritage Guesthouse, Panjim",
      description:
        "Experience Goa's colonial charm in this lovingly restored Portuguese-style guesthouse in Panjim's heritage quarter. Terracotta tiles, antique furniture, and a sun-drenched courtyard garden await you.",
      propertyType: "Guest House",
      roomType: "Entire Home",
      maximumGuest: 6,
      price: 5500,
      address: { area: "Fontainhas", city: "Panjim", state: "Goa", pincode: 403001 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800", public_id: "seed_p4_1" },
        { url: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800", public_id: "seed_p4_2" },
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", public_id: "seed_p4_3" },
        { url: "https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800", public_id: "seed_p4_4" },
        { url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800", public_id: "seed_p4_5" },
        { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", public_id: "seed_p4_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── JAIPUR ──
    {
      propertyName: "Royal Haveli Suite, Old City",
      description:
        "Immerse yourself in Rajasthani royalty at this ornately decorated haveli in the heart of Jaipur's Pink City. Hand-painted frescoes, jaali-work balconies, and a rooftop terrace with fort views create an unforgettable stay.",
      propertyType: "Hotel",
      roomType: "Room",
      maximumGuest: 3,
      price: 3800,
      address: { area: "Old City", city: "Jaipur", state: "Rajasthan", pincode: 302001 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Tv"), amenity("Kitchen")],
      images: [
        { url: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800", public_id: "seed_p5_1" },
        { url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", public_id: "seed_p5_2" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", public_id: "seed_p5_3" },
        { url: "https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800", public_id: "seed_p5_4" },
        { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", public_id: "seed_p5_5" },
        { url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800", public_id: "seed_p5_6" },
      ],
      userId: host1,
      currentBookings: [],
    },
    {
      propertyName: "Modern Apartment Near Hawa Mahal",
      description:
        "A stylish, air-conditioned apartment just two blocks from Hawa Mahal. Fully equipped kitchen, fast WiFi, and a terrace with panoramic views of the Pink City skyline. Perfect base for exploring Jaipur's landmarks.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 4,
      price: 2800,
      address: { area: "Tripolia Bazaar", city: "Jaipur", state: "Rajasthan", pincode: 302002 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800", public_id: "seed_p6_1" },
        { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", public_id: "seed_p6_2" },
        { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800", public_id: "seed_p6_3" },
        { url: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800", public_id: "seed_p6_4" },
        { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", public_id: "seed_p6_5" },
        { url: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800", public_id: "seed_p6_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── UDAIPUR ──
    {
      propertyName: "Lake Pichola View Cottage, Udaipur",
      description:
        "A charming lakeside cottage with breathtaking views of Lake Pichola and the City Palace. Sit on your private terrace and watch the sun set over the Aravalli hills. Truly one of India's most romantic destinations.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 4,
      price: 5200,
      address: { area: "Lal Ghat", city: "Udaipur", state: "Rajasthan", pincode: 313001 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Tv"), amenity("Ac"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1617503752587-97d2103a96ea?w=800", public_id: "seed_p7_1" },
        { url: "https://images.unsplash.com/photo-1529316738228-5f8a53c9db50?w=800", public_id: "seed_p7_2" },
        { url: "https://images.unsplash.com/photo-1574691250077-03a929faece5?w=800", public_id: "seed_p7_3" },
        { url: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800", public_id: "seed_p7_4" },
        { url: "https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=800", public_id: "seed_p7_5" },
        { url: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800", public_id: "seed_p7_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── MANALI ──
    {
      propertyName: "Himalayan Wooden Chalet, Old Manali",
      description:
        "A traditional cedar-wood chalet nestled among apple orchards in Old Manali. Wake up to Himalayan peak views and crisp mountain air. Steps from the Manu temple and vibrant café street. Perfect for trekkers and nature lovers.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 6,
      price: 4200,
      address: { area: "Old Manali", city: "Manali", state: "Himachal Pradesh", pincode: 175131 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Free Parking"), amenity("Tv"), amenity("Washing Machine")],
      images: [
        { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", public_id: "seed_p8_1" },
        { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", public_id: "seed_p8_2" },
        { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", public_id: "seed_p8_3" },
        { url: "https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=800", public_id: "seed_p8_4" },
        { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800", public_id: "seed_p8_5" },
        { url: "https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=800", public_id: "seed_p8_6" },
      ],
      userId: host2,
      currentBookings: [],
    },
    {
      propertyName: "Riverside Camp Cottage, Solang Valley",
      description:
        "A cosy river-facing cottage in the adventure hub of Solang Valley. Surrounded by snow-capped peaks, this property is the perfect base for skiing, paragliding, and river-crossing activities.",
      propertyType: "Guest House",
      roomType: "Room",
      maximumGuest: 3,
      price: 2600,
      address: { area: "Solang Valley", city: "Manali", state: "Himachal Pradesh", pincode: 175131 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800", public_id: "seed_p9_1" },
        { url: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800", public_id: "seed_p9_2" },
        { url: "https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800", public_id: "seed_p9_3" },
        { url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800", public_id: "seed_p9_4" },
        { url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", public_id: "seed_p9_5" },
        { url: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800", public_id: "seed_p9_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── LONAVALA ──
    {
      propertyName: "Misty Hills Bungalow, Lonavala",
      description:
        "Escape the Mumbai–Pune rush at this spacious hill-station bungalow surrounded by lush Sahyadri forests. A large lawn, open fireplace, and misty valley views make this the ideal monsoon and weekend getaway.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 10,
      price: 7800,
      address: { area: "Tungarli", city: "Lonavala", state: "Maharashtra", pincode: 410401 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking"), amenity("Washing Machine"), amenity("Ac")],
      images: [
        { url: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800", public_id: "seed_p10_1" },
        { url: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800", public_id: "seed_p10_2" },
        { url: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800", public_id: "seed_p10_3" },
        { url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800", public_id: "seed_p10_4" },
        { url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", public_id: "seed_p10_5" },
        { url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800", public_id: "seed_p10_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── MAHABALESHWAR ──
    {
      propertyName: "Strawberry Farm Homestay, Mahabaleshwar",
      description:
        "Stay in a charming homestay right next to a working strawberry farm in Mahabaleshwar. Pick fresh strawberries each morning, explore dense forests, and enjoy the cool plateau climate throughout the year.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 6,
      price: 4800,
      address: { area: "Panchgani Road", city: "Mahabaleshwar", state: "Maharashtra", pincode: 412806 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Free Parking"), amenity("Tv")],
      images: [
        { url: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800", public_id: "seed_p11_1" },
        { url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800", public_id: "seed_p11_2" },
        { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", public_id: "seed_p11_3" },
        { url: "https://images.unsplash.com/photo-1503649209-13e5af5bbc1c?w=800", public_id: "seed_p11_4" },
        { url: "https://images.unsplash.com/photo-1431716240563-18d14b2b9b4e?w=800", public_id: "seed_p11_5" },
        { url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", public_id: "seed_p11_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── PUNE ──
    {
      propertyName: "Contemporary Flat in Koregaon Park, Pune",
      description:
        "A sleek, modern flat in Pune's most vibrant neighborhood — Koregaon Park. Minutes from Osho Ashram, top restaurants, and IT hubs. Ideal for professionals and long-stay guests.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 4,
      price: 2500,
      address: { area: "Koregaon Park", city: "Pune", state: "Maharashtra", pincode: 411001 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Washing Machine"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800", public_id: "seed_p12_1" },
        { url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800", public_id: "seed_p12_2" },
        { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", public_id: "seed_p12_3" },
        { url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800", public_id: "seed_p12_4" },
        { url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800", public_id: "seed_p12_5" },
        { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800", public_id: "seed_p12_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── MUNNAR ──
    {
      propertyName: "Tea Garden Cottage, Munnar",
      description:
        "Surrounded by endless rows of emerald-green tea estates, this quaint cottage in Munnar is a true paradise for nature enthusiasts. Sip fresh-brewed estate tea on your veranda as mist rolls over the Western Ghats.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 5,
      price: 3900,
      address: { area: "Chinnakanal", city: "Munnar", state: "Kerala", pincode: 685618 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Free Parking"), amenity("Tv")],
      images: [
        { url: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800", public_id: "seed_p13_1" },
        { url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800", public_id: "seed_p13_2" },
        { url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", public_id: "seed_p13_3" },
        { url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", public_id: "seed_p13_4" },
        { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800", public_id: "seed_p13_5" },
        { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800", public_id: "seed_p13_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── KERALA (Alleppey / Alappuzha) ──
    {
      propertyName: "Backwater Houseboat Experience, Alleppey",
      description:
        "Glide through Kerala's legendary backwaters in this fully equipped traditional Kerala houseboat (Kettuvallam). A private chef, AC bedrooms, and sunset views over the lagoons make this an unparalleled experience.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 6,
      price: 8500,
      address: { area: "Punnamada Lake", city: "Alleppey", state: "Kerala", pincode: 688001 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv")],
      images: [
        { url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", public_id: "seed_p14_1" },
        { url: "https://images.unsplash.com/photo-1580289143186-03f54224aad4?w=800", public_id: "seed_p14_2" },
        { url: "https://images.unsplash.com/photo-1519974719765-e6559eac2575?w=800", public_id: "seed_p14_3" },
        { url: "https://images.unsplash.com/photo-1596395463011-7b0e4f9a04b1?w=800", public_id: "seed_p14_4" },
        { url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800", public_id: "seed_p14_5" },
        { url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800", public_id: "seed_p14_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── BENGALURU ──
    {
      propertyName: "Garden City Flat, Indiranagar, Bengaluru",
      description:
        "A beautifully designed 2BHK flat in Bengaluru's most popular expat neighborhood — Indiranagar. Surrounded by boutique cafés, craft-beer pubs, and the 100 Feet Road. Superfast fibre internet for remote workers.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 4,
      price: 3200,
      address: { area: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: 560038 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Washing Machine"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", public_id: "seed_p15_1" },
        { url: "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800", public_id: "seed_p15_2" },
        { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", public_id: "seed_p15_3" },
        { url: "https://images.unsplash.com/photo-1558618047-3c9c63ca32a9?w=800", public_id: "seed_p15_4" },
        { url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800", public_id: "seed_p15_5" },
        { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800", public_id: "seed_p15_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── DELHI ──
    {
      propertyName: "Heritage Bungalow Near Lodhi Garden, Delhi",
      description:
        "A stately colonial-era bungalow with a lush private garden, located near the tranquil Lodhi Garden in South Delhi. Ideal for delegates, families, or anyone seeking old-Delhi charm with modern comfort.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 8,
      price: 6500,
      address: { area: "Lodhi Colony", city: "Delhi", state: "Delhi", pincode: 110003 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking"), amenity("Washing Machine")],
      images: [
        { url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800", public_id: "seed_p16_1" },
        { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", public_id: "seed_p16_2" },
        { url: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800", public_id: "seed_p16_3" },
        { url: "https://images.unsplash.com/photo-1565623006066-a28f34dbda75?w=800", public_id: "seed_p16_4" },
        { url: "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=800", public_id: "seed_p16_5" },
        { url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800", public_id: "seed_p16_6" },
      ],
      userId: host2,
      currentBookings: [],
    },
    {
      propertyName: "Compact Studio in Hauz Khas, Delhi",
      description:
        "A trendy, fully-furnished studio nestled in the bohemian Hauz Khas Village. Steps from the ancient reservoir ruins, galleries, and Delhi's hippest nightlife. Perfect for solo travelers and digital nomads.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 2,
      price: 2100,
      address: { area: "Hauz Khas Village", city: "Delhi", state: "Delhi", pincode: 110016 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv")],
      images: [
        { url: "https://images.unsplash.com/photo-1623625434462-e5e42318ae49?w=800", public_id: "seed_p17_1" },
        { url: "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800", public_id: "seed_p17_2" },
        { url: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800", public_id: "seed_p17_3" },
        { url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800", public_id: "seed_p17_4" },
        { url: "https://images.unsplash.com/photo-1487611459768-bd414656ea10?w=800", public_id: "seed_p17_5" },
        { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800", public_id: "seed_p17_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── HYDERABAD ──
    {
      propertyName: "Luxury Penthouse, HITEC City, Hyderabad",
      description:
        "A world-class penthouse apartment on the 18th floor with sweeping views of HITEC City's gleaming skyline. Rooftop access, private gym, and contemporary interiors make this Hyderabad's most prestigious short-stay property.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 5,
      price: 7200,
      address: { area: "HITEC City", city: "Hyderabad", state: "Telangana", pincode: 500081 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Pool"), amenity("Tv"), amenity("Kitchen"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800", public_id: "seed_p18_1" },
        { url: "https://images.unsplash.com/photo-1600566753151-384129cf4d3a?w=800", public_id: "seed_p18_2" },
        { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800", public_id: "seed_p18_3" },
        { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", public_id: "seed_p18_4" },
        { url: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800", public_id: "seed_p18_5" },
        { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800", public_id: "seed_p18_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── NASHIK ──
    {
      propertyName: "Vineyard Stay, Nashik Wine Country",
      description:
        "India's wine capital offers this unique vineyard stay amid rolling grape-covered hills. Tour the winery, participate in grape-crushing, enjoy farm-to-table dinners, and stargaze from your private lawn each night.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 6,
      price: 5800,
      address: { area: "Gangapur Road", city: "Nashik", state: "Maharashtra", pincode: 422005 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Free Parking"), amenity("Tv"), amenity("Pool")],
      images: [
        { url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800", public_id: "seed_p19_1" },
        { url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800", public_id: "seed_p19_2" },
        { url: "https://images.unsplash.com/photo-1455620611406-966ca6adf16a?w=800", public_id: "seed_p19_3" },
        { url: "https://images.unsplash.com/photo-1504279807002-09854ccc9b6c?w=800", public_id: "seed_p19_4" },
        { url: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800", public_id: "seed_p19_5" },
        { url: "https://images.unsplash.com/photo-1510924199351-4e9d94df18a6?w=800", public_id: "seed_p19_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── AURANGABAD ──
    {
      propertyName: "Ajanta Heritage Guesthouse, Aurangabad",
      description:
        "A comfortable heritage guesthouse in Aurangabad, just a short drive from the UNESCO World Heritage Ajanta and Ellora Caves. The property features traditional Paithani silk décor and authentic Marathwada cuisine.",
      propertyType: "Guest House",
      roomType: "Entire Home",
      maximumGuest: 7,
      price: 3100,
      address: { area: "CIDCO Colony", city: "Aurangabad", state: "Maharashtra", pincode: 431003 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800", public_id: "seed_p20_1" },
        { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800", public_id: "seed_p20_2" },
        { url: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800", public_id: "seed_p20_3" },
        { url: "https://images.unsplash.com/photo-1521783593447-5702b9bfd267?w=800", public_id: "seed_p20_4" },
        { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", public_id: "seed_p20_5" },
        { url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800", public_id: "seed_p20_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── GOA (North) ──
    {
      propertyName: "Boutique Pool Villa, Anjuna, North Goa",
      description:
        "A private boutique villa with a heated infinity pool and sun deck, located in the laid-back village of Anjuna. Walk to the famous flea market and Anjuna beach. DJ nights and yoga retreats nearby.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 8,
      price: 11500,
      address: { area: "Anjuna Market Road", city: "Goa", state: "Goa", pincode: 403509 },
      amenities: [amenity("Wifi"), amenity("Pool"), amenity("Ac"), amenity("Kitchen"), amenity("Free Parking"), amenity("Tv")],
      images: [
        { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800", public_id: "seed_p21_1" },
        { url: "https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800", public_id: "seed_p21_2" },
        { url: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800", public_id: "seed_p21_3" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800", public_id: "seed_p21_4" },
        { url: "https://images.unsplash.com/photo-1553653924-39b70295f8da?w=800", public_id: "seed_p21_5" },
        { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800", public_id: "seed_p21_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── KERALA (Fort Kochi) ──
    {
      propertyName: "Colonial Spice Mansion, Fort Kochi",
      description:
        "A stately colonial mansion in the heart of Fort Kochi, just minutes from the iconic Chinese fishing nets and the Dutch Palace. High ceilings, antique teak furniture, and a fragrant spice garden make every morning memorable.",
      propertyType: "House",
      roomType: "Entire Home",
      maximumGuest: 7,
      price: 6200,
      address: { area: "Princess Street", city: "Kochi", state: "Kerala", pincode: 682001 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800", public_id: "seed_p22_1" },
        { url: "https://images.unsplash.com/photo-1543968996-ee822b8176ba?w=800", public_id: "seed_p22_2" },
        { url: "https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=800", public_id: "seed_p22_3" },
        { url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800", public_id: "seed_p22_4" },
        { url: "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=800", public_id: "seed_p22_5" },
        { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", public_id: "seed_p22_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── MANALI (Kasol) ──
    {
      propertyName: "Riverside Pines Cottage, Kasol",
      description:
        "A peaceful pine-wood cottage beside the Parvati River in Kasol — the backpacker's paradise of the Himalayas. Ideal for trekkers heading to Kheerganga. Hear the river from your bed.",
      propertyType: "Guest House",
      roomType: "Entire Home",
      maximumGuest: 4,
      price: 1900,
      address: { area: "Main Village", city: "Kasol", state: "Himachal Pradesh", pincode: 175105 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Free Parking")],
      images: [
        { url: "https://images.unsplash.com/photo-1571879880996-a81db2ac7fbc?w=800", public_id: "seed_p23_1" },
        { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", public_id: "seed_p23_2" },
        { url: "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=800", public_id: "seed_p23_3" },
        { url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", public_id: "seed_p23_4" },
        { url: "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=800", public_id: "seed_p23_5" },
        { url: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800", public_id: "seed_p23_6" },
      ],
      userId: host1,
      currentBookings: [],
    },

    // ── BENGALURU (Whitefield) ──
    {
      propertyName: "Tech Park Residence, Whitefield, Bengaluru",
      description:
        "A premium furnished apartment in Whitefield, right in the heart of Bengaluru's tech corridor. Walking distance to major IT parks, ITPL Mall, and Phoenix Marketcity. Ideal for long-term corporate stays.",
      propertyType: "Flat",
      roomType: "Entire Home",
      maximumGuest: 3,
      price: 2800,
      address: { area: "Whitefield Main Road", city: "Bengaluru", state: "Karnataka", pincode: 560066 },
      amenities: [amenity("Wifi"), amenity("Ac"), amenity("Kitchen"), amenity("Tv"), amenity("Washing Machine")],
      images: [
        { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", public_id: "seed_p24_1" },
        { url: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800", public_id: "seed_p24_2" },
        { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800", public_id: "seed_p24_3" },
        { url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800", public_id: "seed_p24_4" },
        { url: "https://images.unsplash.com/photo-1556909172-89cf0b2b0087?w=800", public_id: "seed_p24_5" },
        { url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800", public_id: "seed_p24_6" },
      ],
      userId: host2,
      currentBookings: [],
    },

    // ── UDAIPUR (Lake Fateh Sagar) ──
    {
      propertyName: "Sunset Palace Homestay, Lake Fateh Sagar",
      description:
        "Perched above Lake Fateh Sagar, this enchanting Rajput-style homestay gives you front-row seats to Udaipur's legendary sunsets. Enjoy home-cooked Rajasthani thali, a rooftop yoga session, and evening boat rides.",
      propertyType: "Guest House",
      roomType: "Entire Home",
      maximumGuest: 5,
      price: 4000,
      address: { area: "Fateh Sagar Road", city: "Udaipur", state: "Rajasthan", pincode: 313004 },
      amenities: [amenity("Wifi"), amenity("Kitchen"), amenity("Tv"), amenity("Free Parking"), amenity("Ac")],
      images: [
        { url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800", public_id: "seed_p25_1" },
        { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", public_id: "seed_p25_2" },
        { url: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800", public_id: "seed_p25_3" },
        { url: "https://images.unsplash.com/photo-1501876725168-00c445821c9e?w=800", public_id: "seed_p25_4" },
        { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800", public_id: "seed_p25_5" },
        { url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800", public_id: "seed_p25_6" },
      ],
      userId: host1,
      currentBookings: [],
    },
  ];
}

// ── Main seed function ──────────────────────────────────────────────────────
async function seed() {
  if (!process.env.MONGO_URI) {
    console.error(
      "❌  MONGO_URI is not set. Please configure it in Backend/.env"
    );
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  MongoDB connected:", process.env.MONGO_URI);

  // ── 1. Upsert seed host users ────────────────────────────────────────────
  const hostIds = [];
  let usersCreated = 0;

  for (const seedUser of SEED_USERS) {
    const existing = await User.findOne({ email: seedUser.email });
    if (existing) {
      console.log(`ℹ️   Host user already exists: ${seedUser.email}`);
      hostIds.push(existing._id);
    } else {
      const hashedPassword = await bcrypt.hash(seedUser.password, 12);
      const created = await User.create({
        name: seedUser.name,
        email: seedUser.email,
        password: hashedPassword,
        passwordConfirm: undefined, // already hashed — skip confirm validation
        phoneNumber: seedUser.phoneNumber,
        avatar: seedUser.avatar,
      });
      hostIds.push(created._id);
      usersCreated++;
      console.log(`✅  Created host user: ${seedUser.name} (${seedUser.email})`);
    }
  }

  // ── 2. Build property data with real host ObjectIds ──────────────────────
  const propertyData = buildProperties(hostIds);

  // ── 3. Insert only properties that don't already exist ──────────────────
  let propertiesInserted = 0;
  let propertiesSkipped = 0;

  for (const prop of propertyData) {
    const existing = await Property.findOne({ propertyName: prop.propertyName });
    if (existing) {
      console.log(`⏭️   Skipping (already exists): ${prop.propertyName}`);
      propertiesSkipped++;
      continue;
    }

    // Use insertOne via Model to bypass pre-save hooks that need a running server
    // but we DO want slug + city normalization, so use .save()
    const doc = new Property(prop);
    await doc.save();
    propertiesInserted++;
    console.log(`✅  Inserted: ${prop.propertyName}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log(`📊  Seed complete!`);
  console.log(`    Host users created : ${usersCreated}`);
  console.log(`    Properties inserted: ${propertiesInserted}`);
  console.log(`    Properties skipped : ${propertiesSkipped} (already existed)`);
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  console.log("🔌  MongoDB disconnected. Done.");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});