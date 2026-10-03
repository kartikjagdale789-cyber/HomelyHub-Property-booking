# Backend property import

The original HomelyHub repository does not include its MongoDB property records or a property seed file. The images in `Frontend/public/assets` are standalone frontend assets, not property documents. This importer only loads records supplied by you; it does not generate properties.

Create a JSON file containing an array of property documents that match `src/Models/PropertyModel.js`, then run:

```powershell
cd Backend
npm install
npm run seed -- .\properties.json
```

`Backend/.env` must contain a working `MONGO_URI`. Every JSON object requires `propertyName` and `description` strings, numeric `maximumGuest`, an `address` with non-empty `area`, `city`, and `state` strings plus numeric `pincode`, and at least six `images`, each with a non-empty `url`. `images` may also include `public_id`; URLs are stored without modification. `price` is numeric (the schema defaults it to 500), `extraInfo` is optional, `propertyType` must be `House`, `Flat`, `Guest House`, or `Hotel`, and `roomType` must be `Anytype`, `Room`, or `Entire Home`. Each optional `amenities` item requires a `name` from `Wifi`, `Kitchen`, `Ac`, `Washing Machine`, `Tv`, `Pool`, or `Free Parking`, plus an `icon` string. The schema names its optional check-in fields `chekInTime` and `chekOutTime` (both default to a time string).

`userId` and `currentBookings[].userId` / `currentBookings[].bookingId` are optional. When present, their ObjectIds must be valid and refer to User or Booking documents that already exist in the destination database. Omit these optional references when importing properties without their associated account/booking records. The importer does not delete existing properties; each successful run inserts another copy unless explicit `_id` values conflict.

After importing, the existing endpoint `GET /api/v1/rent/listing` returns the property list in the response shape already consumed by the frontend. The home page displays each record's first image, name, city, state, pincode, and price.