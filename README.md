# T1Together

Life with Type 1, together.

React Native / Expo community app for people living with Type 1 diabetes and their caregivers.

## V1
- Onboarding and profiles
- Nearby T1D community with privacy-safe approximate location
- Community posts and questions
- T1 Beacon help requests
- Helper Mode
- Private messaging
- Blocking/reporting foundation

## Backend
Supabase/PostgreSQL with Row Level Security. See `supabase/migrations/001_initial_schema.sql`.

## Local setup
1. Copy `.env.example` to `.env`
2. Add your Supabase project URL and anon key
3. `npm install`
4. `npx expo start`

Never commit the Supabase service-role key or precise user home locations.
