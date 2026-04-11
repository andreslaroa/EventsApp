# City Events Platform - PRD

## Original Problem Statement
Create a web page to announce events in my city. Anyone can submit events. Extended event details: Images, categories, ticket prices, organizer contact. User registration to save/bookmark events. Modern & colorful design with multiple event categories (Music, Sports, Cultural, Food festivals, etc.)

## User Personas
1. **Event Organizers** - Submit and manage events
2. **Event Attendees** - Browse, search, and bookmark events
3. **Community Members** - Discover local happenings

## Core Requirements
- Public event submissions
- Extended event details (images, categories, prices, contact)
- User registration & authentication
- Bookmark/save events functionality
- Category filtering
- Search functionality
- Modern & colorful Neo-Brutalist design

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT with httpOnly cookies

## What's Been Implemented (Jan 2026)
- [x] User registration and login with JWT auth
- [x] Event CRUD operations
- [x] 8 event categories (Music, Sports, Cultural, Food, Art, Tech, Community, Other)
- [x] Bookmark system for logged-in users
- [x] Event filtering by category
- [x] Search functionality
- [x] Image upload for events (base64)
- [x] Neo-Brutalist UI design
- [x] Responsive layout
- [x] Sample events seeded on startup

## Prioritized Backlog
### P0 (Critical)
- None - MVP complete

### P1 (High Priority)
- Event approval workflow (admin moderation)
- Email notifications for new events
- User profile page

### P2 (Medium Priority)
- Map integration for event locations
- Social sharing buttons
- Comments/reviews on events
- Event reminders

### P3 (Low Priority)
- Event analytics for organizers
- Export events to calendar
- Multi-language support

## Next Tasks
1. Add admin moderation for submitted events
2. Implement user profile with submitted events history
3. Add email notifications