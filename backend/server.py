from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, File, UploadFile
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import base64
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Event Categories
CATEGORIES = ["Music", "Sports", "Cultural", "Food", "Art", "Tech", "Community", "Other"]

# ===================== MODELS =====================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    date: str
    time: str
    location: str
    address: str
    ticket_price: Optional[float] = 0
    is_free: bool = True
    organizer_name: str
    organizer_email: str
    organizer_phone: Optional[str] = None
    image_url: Optional[str] = None

class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    date: str
    time: str
    location: str
    address: str
    ticket_price: float
    is_free: bool
    organizer_name: str
    organizer_email: str
    organizer_phone: Optional[str]
    image_url: Optional[str]
    created_by: str
    created_at: str
    status: str

class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    created_at: str

# Admin credentials from env
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@cityevents.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

# ===================== PASSWORD HELPERS =====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ===================== JWT HELPERS =====================

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "name": user_data.name,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": user_data.name,
        "email": email,
        "role": "user",
        "created_at": user_doc["created_at"].isoformat()
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# ===================== EVENTS ENDPOINTS =====================

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

@api_router.post("/events")
async def create_event(event_data: EventCreate, request: Request):
    user = await get_current_user(request)
    
    if event_data.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {CATEGORIES}")
    
    # Admin events are auto-published, user events are pending
    status = "published" if user.get("role") == "admin" else "pending"
    
    event_doc = {
        "title": event_data.title,
        "description": event_data.description,
        "category": event_data.category,
        "date": event_data.date,
        "time": event_data.time,
        "location": event_data.location,
        "address": event_data.address,
        "ticket_price": event_data.ticket_price if not event_data.is_free else 0,
        "is_free": event_data.is_free,
        "organizer_name": event_data.organizer_name,
        "organizer_email": event_data.organizer_email,
        "organizer_phone": event_data.organizer_phone,
        "image_url": event_data.image_url,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc),
        "status": status
    }
    
    result = await db.events.insert_one(event_doc)
    
    return {
        "id": str(result.inserted_id),
        "title": event_doc["title"],
        "description": event_doc["description"],
        "category": event_doc["category"],
        "date": event_doc["date"],
        "time": event_doc["time"],
        "location": event_doc["location"],
        "address": event_doc["address"],
        "ticket_price": event_doc["ticket_price"],
        "is_free": event_doc["is_free"],
        "organizer_name": event_doc["organizer_name"],
        "organizer_email": event_doc["organizer_email"],
        "organizer_phone": event_doc["organizer_phone"],
        "image_url": event_doc["image_url"],
        "created_by": event_doc["created_by"],
        "created_at": event_doc["created_at"].isoformat(),
        "status": event_doc["status"]
    }

@api_router.get("/events")
async def get_events(
    category: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    location: Optional[str] = None,
    pricing: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    time_of_day: Optional[str] = None,
    sort_by: Optional[str] = "date_asc",
    limit: int = 50,
    skip: int = 0
):
    query = {"status": "published"}
    
    if category and category != "All":
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    # Date range filter
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter
    
    # Location filter (text search on location + address)
    if location:
        loc_regex = {"$regex": location, "$options": "i"}
        if "$or" in query:
            # Combine with existing $or using $and
            existing_or = query.pop("$or")
            query["$and"] = [
                {"$or": existing_or},
                {"$or": [{"location": loc_regex}, {"address": loc_regex}]}
            ]
        else:
            query["$or"] = [{"location": loc_regex}, {"address": loc_regex}]
    
    # Pricing filter
    if pricing == "free":
        query["is_free"] = True
    elif pricing == "paid":
        query["is_free"] = False
    
    # Price range filter (only for paid events)
    if price_min is not None or price_max is not None:
        price_filter = {}
        if price_min is not None:
            price_filter["$gte"] = price_min
        if price_max is not None:
            price_filter["$lte"] = price_max
        query["ticket_price"] = price_filter
    
    # Time of day filter
    if time_of_day:
        time_ranges = {
            "morning": ("05:00", "11:59"),
            "afternoon": ("12:00", "16:59"),
            "evening": ("17:00", "20:59"),
            "night": ("21:00", "04:59"),
        }
        if time_of_day in time_ranges:
            t_start, t_end = time_ranges[time_of_day]
            if time_of_day == "night":
                query["$or"] = query.get("$or", []) or []
                # Night wraps around midnight
                if "$and" not in query:
                    query["$and"] = []
                query["$and"].append({
                    "$or": [
                        {"time": {"$gte": t_start}},
                        {"time": {"$lte": t_end}}
                    ]
                })
            else:
                query["time"] = {"$gte": t_start, "$lte": t_end}
    
    # Sorting
    sort_field, sort_dir = "date", 1
    if sort_by == "date_asc":
        sort_field, sort_dir = "date", 1
    elif sort_by == "date_desc":
        sort_field, sort_dir = "date", -1
    elif sort_by == "price_asc":
        sort_field, sort_dir = "ticket_price", 1
    elif sort_by == "price_desc":
        sort_field, sort_dir = "ticket_price", -1
    elif sort_by == "newest":
        sort_field, sort_dir = "created_at", -1
    
    projection = {"_id": 1, "title": 1, "description": 1, "category": 1, "date": 1, "time": 1, "location": 1, "address": 1, "ticket_price": 1, "is_free": 1, "organizer_name": 1, "organizer_email": 1, "organizer_phone": 1, "image_url": 1, "created_by": 1, "created_at": 1, "status": 1}
    
    total = await db.events.count_documents(query)
    events = await db.events.find(query, projection).sort(sort_field, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for event in events:
        result.append({
            "id": str(event["_id"]),
            "title": event["title"],
            "description": event["description"],
            "category": event["category"],
            "date": event["date"],
            "time": event["time"],
            "location": event["location"],
            "address": event["address"],
            "ticket_price": event["ticket_price"],
            "is_free": event["is_free"],
            "organizer_name": event["organizer_name"],
            "organizer_email": event["organizer_email"],
            "organizer_phone": event.get("organizer_phone"),
            "image_url": event.get("image_url"),
            "created_by": event["created_by"],
            "created_at": event["created_at"].isoformat() if isinstance(event["created_at"], datetime) else event["created_at"],
            "status": event["status"]
        })
    
    return {"events": result, "total": total}

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "description": event["description"],
        "category": event["category"],
        "date": event["date"],
        "time": event["time"],
        "location": event["location"],
        "address": event["address"],
        "ticket_price": event["ticket_price"],
        "is_free": event["is_free"],
        "organizer_name": event["organizer_name"],
        "organizer_email": event["organizer_email"],
        "organizer_phone": event.get("organizer_phone"),
        "image_url": event.get("image_url"),
        "created_by": event["created_by"],
        "created_at": event["created_at"].isoformat() if isinstance(event["created_at"], datetime) else event["created_at"],
        "status": event["status"]
    }

# ===================== ADMIN ENDPOINTS =====================

@api_router.get("/admin/events")
async def get_admin_events(request: Request, status: Optional[str] = None):
    """Get all events for admin (including pending)"""
    await get_admin_user(request)
    
    query = {}
    if status:
        query["status"] = status
    
    events = await db.events.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for event in events:
        result.append({
            "id": str(event["_id"]),
            "title": event["title"],
            "description": event["description"],
            "category": event["category"],
            "date": event["date"],
            "time": event["time"],
            "location": event["location"],
            "address": event["address"],
            "ticket_price": event["ticket_price"],
            "is_free": event["is_free"],
            "organizer_name": event["organizer_name"],
            "organizer_email": event["organizer_email"],
            "organizer_phone": event.get("organizer_phone"),
            "image_url": event.get("image_url"),
            "created_by": event["created_by"],
            "created_at": event["created_at"].isoformat() if isinstance(event["created_at"], datetime) else event["created_at"],
            "status": event["status"]
        })
    
    return {"events": result, "total": len(result)}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    """Get admin dashboard stats"""
    await get_admin_user(request)
    
    total_events = await db.events.count_documents({})
    pending_events = await db.events.count_documents({"status": "pending"})
    published_events = await db.events.count_documents({"status": "published"})
    rejected_events = await db.events.count_documents({"status": "rejected"})
    total_users = await db.users.count_documents({})
    
    return {
        "total_events": total_events,
        "pending_events": pending_events,
        "published_events": published_events,
        "rejected_events": rejected_events,
        "total_users": total_users
    }

@api_router.post("/admin/events/{event_id}/approve")
async def approve_event(event_id: str, request: Request):
    """Approve a pending event"""
    await get_admin_user(request)
    
    try:
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": {"status": "published"}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event approved", "status": "published"}

@api_router.post("/admin/events/{event_id}/reject")
async def reject_event(event_id: str, request: Request):
    """Reject a pending event"""
    await get_admin_user(request)
    
    try:
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": {"status": "rejected"}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event rejected", "status": "rejected"}

@api_router.delete("/admin/events/{event_id}")
async def delete_event(event_id: str, request: Request):
    """Delete an event"""
    await get_admin_user(request)
    
    try:
        result = await db.events.delete_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Also delete related bookmarks
    await db.bookmarks.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted"}

# ===================== BOOKMARKS ENDPOINTS =====================

@api_router.post("/bookmarks/{event_id}")
async def add_bookmark(event_id: str, request: Request):
    user = await get_current_user(request)
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    existing = await db.bookmarks.find_one({"user_id": user["id"], "event_id": event_id})
    if existing:
        raise HTTPException(status_code=400, detail="Event already bookmarked")
    
    bookmark_doc = {
        "user_id": user["id"],
        "event_id": event_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.bookmarks.insert_one(bookmark_doc)
    
    return {
        "id": str(result.inserted_id),
        "user_id": user["id"],
        "event_id": event_id,
        "created_at": bookmark_doc["created_at"].isoformat()
    }

@api_router.delete("/bookmarks/{event_id}")
async def remove_bookmark(event_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.bookmarks.delete_one({"user_id": user["id"], "event_id": event_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark removed"}

@api_router.get("/bookmarks")
async def get_bookmarks(request: Request):
    user = await get_current_user(request)
    
    bookmarks = await db.bookmarks.find({"user_id": user["id"]}).to_list(100)
    
    event_ids = [b["event_id"] for b in bookmarks]
    events = await db.events.find({"_id": {"$in": [ObjectId(eid) for eid in event_ids]}}).to_list(100)
    
    result = []
    for event in events:
        result.append({
            "id": str(event["_id"]),
            "title": event["title"],
            "description": event["description"],
            "category": event["category"],
            "date": event["date"],
            "time": event["time"],
            "location": event["location"],
            "address": event["address"],
            "ticket_price": event["ticket_price"],
            "is_free": event["is_free"],
            "organizer_name": event["organizer_name"],
            "organizer_email": event["organizer_email"],
            "organizer_phone": event.get("organizer_phone"),
            "image_url": event.get("image_url"),
            "created_by": event["created_by"],
            "created_at": event["created_at"].isoformat() if isinstance(event["created_at"], datetime) else event["created_at"],
            "status": event["status"]
        })
    
    return {"bookmarks": result}

@api_router.get("/bookmarks/check/{event_id}")
async def check_bookmark(event_id: str, request: Request):
    user = await get_current_user(request)
    
    bookmark = await db.bookmarks.find_one({"user_id": user["id"], "event_id": event_id})
    
    return {"is_bookmarked": bookmark is not None}

# ===================== IMAGE UPLOAD =====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be less than 5MB")
    
    base64_image = base64.b64encode(contents).decode("utf-8")
    data_url = f"data:{file.content_type};base64,{base64_image}"
    
    return {"url": data_url}

# ===================== SEED DATA =====================

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.bookmarks.create_index([("user_id", 1), ("event_id", 1)], unique=True)
    
    # Seed admin user
    admin_email = ADMIN_EMAIL.lower()
    existing_admin = await db.users.find_one({"email": admin_email})
    if existing_admin is None:
        admin_doc = {
            "name": "Admin",
            "email": admin_email,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_doc)
        logger.info(f"Created admin user: {admin_email}")
    elif not verify_password(ADMIN_PASSWORD, existing_admin["password_hash"]):
        # Update password if changed in env
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
        )
        logger.info(f"Updated admin password for: {admin_email}")
    
    # Seed sample events if none exist
    event_count = await db.events.count_documents({})
    if event_count == 0:
        sample_events = [
            {
                "title": "Summer Music Festival 2026",
                "description": "Join us for the biggest music festival of the year! Featuring top artists from around the world, food vendors, and amazing vibes.",
                "category": "Music",
                "date": "2026-02-15",
                "time": "18:00",
                "location": "Central Park Amphitheater",
                "address": "123 Main Street, Downtown",
                "ticket_price": 50,
                "is_free": False,
                "organizer_name": "City Events Co",
                "organizer_email": "events@cityevents.com",
                "organizer_phone": "+1 555-0101",
                "image_url": "https://images.pexels.com/photos/196652/pexels-photo-196652.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc),
                "status": "published"
            },
            {
                "title": "International Food Festival",
                "description": "Taste cuisines from over 30 countries! Live cooking demonstrations, food competitions, and family activities.",
                "category": "Food",
                "date": "2026-02-20",
                "time": "11:00",
                "location": "Riverside Plaza",
                "address": "456 River Road, Waterfront District",
                "ticket_price": 0,
                "is_free": True,
                "organizer_name": "Foodie Community",
                "organizer_email": "info@foodiecommunity.com",
                "organizer_phone": "+1 555-0102",
                "image_url": "https://images.unsplash.com/photo-1760026759916-16e48b34cee5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxmb29kJTIwZmVzdGl2YWwlMjBvdXRkb29yJTIwY29va2luZ3xlbnwwfHx8fDE3NzU4OTk0ODN8MA&ixlib=rb-4.1.0&q=85",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc),
                "status": "published"
            },
            {
                "title": "Cultural Heritage Parade",
                "description": "Celebrate our city's diverse heritage with traditional performances, costumes, and art displays from various cultures.",
                "category": "Cultural",
                "date": "2026-02-25",
                "time": "10:00",
                "location": "Historic Downtown",
                "address": "789 Heritage Boulevard",
                "ticket_price": 0,
                "is_free": True,
                "organizer_name": "Cultural Council",
                "organizer_email": "culture@citycouncil.org",
                "organizer_phone": "+1 555-0103",
                "image_url": "https://images.unsplash.com/photo-1756694915372-ba61beaa2b0b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwyfHxjaXR5JTIwc3RyZWV0JTIwZmVzdGl2YWwlMjBjcm93ZHxlbnwwfHx8fDE3NzU4OTk0ODN8MA&ixlib=rb-4.1.0&q=85",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc),
                "status": "published"
            },
            {
                "title": "City Marathon 2026",
                "description": "Run through the most scenic routes of our city! Categories for all ages and skill levels. Medals for all finishers!",
                "category": "Sports",
                "date": "2026-03-01",
                "time": "06:00",
                "location": "City Stadium",
                "address": "321 Sports Avenue",
                "ticket_price": 25,
                "is_free": False,
                "organizer_name": "Sports Association",
                "organizer_email": "marathon@sportsassoc.com",
                "organizer_phone": "+1 555-0104",
                "image_url": "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc),
                "status": "published"
            },
            {
                "title": "Tech Startup Meetup",
                "description": "Network with fellow entrepreneurs, hear from successful founders, and pitch your ideas to investors.",
                "category": "Tech",
                "date": "2026-02-18",
                "time": "19:00",
                "location": "Innovation Hub",
                "address": "555 Tech Park Drive",
                "ticket_price": 10,
                "is_free": False,
                "organizer_name": "TechCity",
                "organizer_email": "events@techcity.io",
                "organizer_phone": "+1 555-0105",
                "image_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc),
                "status": "published"
            },
            {
                "title": "Art in the Park",
                "description": "Local artists showcase their work in this open-air gallery. Art workshops, live painting, and pieces for sale.",
                "category": "Art",
                "date": "2026-02-28",
                "time": "09:00",
                "location": "Sunset Park",
                "address": "888 Park Lane",
                "ticket_price": 0,
                "is_free": True,
                "organizer_name": "Arts Council",
                "organizer_email": "art@cityarts.org",
                "organizer_phone": "+1 555-0106",
                "image_url": "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc),
                "status": "published"
            }
        ]
        
        await db.events.insert_many(sample_events)
        logger.info("Seeded 6 sample events")

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
