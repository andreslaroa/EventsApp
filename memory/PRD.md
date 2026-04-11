# City Events Platform - PRD

## Original Problem Statement
Create a web page to announce events in my city. Anyone can submit events. Extended event details: Images, categories, ticket prices, organizer contact. User registration to save/bookmark events. Modern & colorful design with multiple event categories (Music, Sports, Cultural, Food festivals, etc.)

## User Personas
1. **Event Organizers** - Submit and manage events
2. **Event Attendees** - Browse, search, and bookmark events
3. **Admin** - Moderate submitted events (approve/reject)

## Architecture
- **Frontend**: React.js with Tailwind CSS, Neo-Brutalist design
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT with httpOnly cookies

## What's Been Implemented
### MVP (Session 1)
- [x] User registration and login with JWT auth
- [x] Event CRUD operations
- [x] 8 event categories (Music, Sports, Cultural, Food, Art, Tech, Community, Other)
- [x] Bookmark system for logged-in users
- [x] Basic category filtering and search
- [x] Image upload for events (base64)
- [x] Neo-Brutalist UI design
- [x] Responsive layout
- [x] Sample events seeded on startup

### Admin Moderation (Session 2)
- [x] Admin user seeding (admin@cityevents.com / admin123)
- [x] Admin dashboard with stats (pending/published/rejected/users)
- [x] Event approval workflow (approve/reject/delete)
- [x] User-submitted events start as "pending"
- [x] Admin-submitted events auto-published
- [x] Pending submission success message for users

### Advanced Filters (Session 2)
- [x] Date range filter (from/to date pickers)
- [x] Location text search filter (city, venue, address)
- [x] Free/Paid pricing toggle
- [x] Price range filter (min/max for paid events)
- [x] Time of Day filter (Morning, Afternoon, Evening, Night)
- [x] Sort By (Date asc/desc, Price asc/desc, Recently added)
- [x] Active filter tags with individual remove
- [x] Clear All Filters button
- [x] Event count display
- [x] Collapsible filter panel

## Prioritized Backlog
### P1 (High Priority)
- Email notifications for new events
- User profile page with submitted events

### P2 (Medium Priority)
- Map integration for event locations
- Social sharing buttons
- Comments/reviews on events
- Geolocation-based distance filtering

### P3 (Low Priority)
- Event analytics for organizers
- Export events to calendar
- Multi-language support

## Next Tasks
1. Add user profile page with submitted events history
2. Add geolocation-based distance filtering
3. Add social sharing buttons
