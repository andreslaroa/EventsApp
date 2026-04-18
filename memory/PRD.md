# City Events Platform - PRD

## Original Problem Statement
Create a web page to announce events in my city, similar to Fever.com. Anyone can submit events. Extended event details with images, categories, ticket prices, organizer contact. User registration to save/bookmark events. Modern & colorful design. Admin moderation. Advanced filters. Fever-style UI with hero carousel, collections, reviews, related events.

## Architecture
- **Frontend**: React.js with Tailwind CSS, Neo-Brutalist Fever-style design
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (collections: users, events, bookmarks, reviews)
- **Auth**: JWT with httpOnly cookies

## What's Been Implemented

### MVP (Session 1)
- [x] User registration/login (JWT auth with cookies)
- [x] Event CRUD with 8 categories
- [x] Bookmark system
- [x] Basic search & category filtering
- [x] Image upload (base64)
- [x] Neo-Brutalist responsive UI

### Admin Moderation + Advanced Filters (Session 2)
- [x] Admin user (admin@cityevents.com / admin123)
- [x] Admin dashboard (approve/reject/delete events)
- [x] Date range, location, pricing, price range, time of day, sort by filters
- [x] Active filter tags + clear all
- [x] Pending submission workflow

### Fever-style Redesign (Session 3)
- [x] Featured events hero carousel (horizontal scroll)
- [x] Horizontal scrollable event rows grouped by category
- [x] Quick date shortcuts (Today, This Weekend, This Week)
- [x] Event badges: "New", "Popular", "Featured", "Free"
- [x] "From $X" pricing format
- [x] Related events on detail page
- [x] User ratings & reviews system (1-5 stars + comment)
- [x] Curated collections (Couples, Family, Nightlife, Outdoor, Trending)
- [x] Collection pages
- [x] Admin can set tags & featured flag on events
- [x] 10 rich seed events with tags and featured flags

## Prioritized Backlog
### P1
- User profile page with submitted events history
- Email notifications for event approval

### P2
- Geolocation-based distance filtering
- Social sharing buttons
- Event reminders / calendar export

### P3
- Event analytics for organizers
- Multi-language support
- Ticket purchasing flow
