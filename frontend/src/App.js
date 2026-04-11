import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, Clock, Search, Bookmark, BookmarkCheck, Plus, User, LogOut, Menu, X, ChevronRight, Ticket, Mail, Phone, ArrowLeft, Shield, Check, XCircle, Trash2, Eye, Users, FileText } from "lucide-react";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios
axios.defaults.withCredentials = true;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Category colors
const getCategoryColor = (category) => {
  const colors = {
    Music: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-600" },
    Sports: { bg: "bg-green-500", text: "text-green-500", border: "border-green-500" },
    Cultural: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500" },
    Food: { bg: "bg-yellow-500", text: "text-yellow-500", border: "border-yellow-500" },
    Art: { bg: "bg-pink-500", text: "text-pink-500", border: "border-pink-500" },
    Tech: { bg: "bg-purple-600", text: "text-purple-600", border: "border-purple-600" },
    Community: { bg: "bg-teal-500", text: "text-teal-500", border: "border-teal-500" },
    Other: { bg: "bg-gray-500", text: "text-gray-500", border: "border-gray-500" },
  };
  return colors[category] || colors.Other;
};

// Header Component
const Header = ({ onAuthClick }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-red-500 border-2 border-black shadow-[3px_3px_0px_0px_rgba(10,10,10,1)] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight">CityEvents</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="font-bold uppercase tracking-wide hover:text-red-500 transition-colors" data-testid="nav-home">Events</Link>
            {user && (
              <Link to="/bookmarks" className="font-bold uppercase tracking-wide hover:text-red-500 transition-colors" data-testid="nav-bookmarks">My Bookmarks</Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" className="font-bold uppercase tracking-wide hover:text-red-500 transition-colors flex items-center gap-1" data-testid="nav-admin">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            <Link to="/submit" className="neo-button bg-yellow-400 text-black" data-testid="nav-submit">
              <Plus className="w-4 h-4" /> Submit Event
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-600">{user.name}</span>
                <button onClick={logout} className="neo-button bg-gray-200 text-black" data-testid="logout-button">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={onAuthClick} className="neo-button bg-black text-white" data-testid="login-button">
                <User className="w-4 h-4" /> Login
              </button>
            )}
          </nav>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-toggle">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-black">
            <div className="flex flex-col gap-4">
              <Link to="/" className="font-bold uppercase tracking-wide" onClick={() => setMobileMenuOpen(false)}>Events</Link>
              {user && (
                <Link to="/bookmarks" className="font-bold uppercase tracking-wide" onClick={() => setMobileMenuOpen(false)}>My Bookmarks</Link>
              )}
              {user?.role === "admin" && (
                <Link to="/admin" className="font-bold uppercase tracking-wide flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="w-4 h-4" /> Admin Dashboard
                </Link>
              )}
              <Link to="/submit" className="neo-button bg-yellow-400 text-black w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                <Plus className="w-4 h-4" /> Submit Event
              </Link>
              {user ? (
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="neo-button bg-gray-200 text-black w-full justify-center">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <button onClick={() => { onAuthClick(); setMobileMenuOpen(false); }} className="neo-button bg-black text-white w-full justify-center">
                  <User className="w-4 h-4" /> Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Auth Modal
const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg || JSON.stringify(e)).join(" "));
      } else {
        setError(detail || err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] w-full max-w-md p-8" onClick={e => e.stopPropagation()} data-testid="auth-modal">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
          {mode === "login" ? "Welcome Back" : "Join Us"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="neo-input w-full"
                required
                data-testid="register-name-input"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="neo-input w-full"
              required
              data-testid="auth-email-input"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neo-input w-full"
              required
              data-testid="auth-password-input"
            />
          </div>

          {error && <p className="text-red-500 font-medium" data-testid="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="neo-button bg-red-500 text-white w-full justify-center" data-testid="auth-submit-button">
            {loading ? "Loading..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="font-bold text-red-500 hover:underline"
            data-testid="auth-mode-toggle"
          >
            {mode === "login" ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

// Event Card
const EventCard = ({ event, size = "normal", onBookmarkChange }) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const navigate = useNavigate();
  const categoryColor = getCategoryColor(event.category);

  useEffect(() => {
    if (user) {
      checkBookmark();
    }
  }, [user, event.id]);

  const checkBookmark = async () => {
    try {
      const { data } = await axios.get(`${API}/bookmarks/check/${event.id}`);
      setIsBookmarked(data.is_bookmarked);
    } catch {
      // ignore
    }
  };

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await axios.delete(`${API}/bookmarks/${event.id}`);
        setIsBookmarked(false);
      } else {
        await axios.post(`${API}/bookmarks/${event.id}`);
        setIsBookmarked(true);
      }
      onBookmarkChange?.();
    } catch {
      // ignore
    } finally {
      setBookmarkLoading(false);
    }
  };

  const isLarge = size === "large";

  return (
    <div
      className={`neo-card cursor-pointer group ${isLarge ? "md:col-span-2 md:row-span-2" : ""}`}
      onClick={() => navigate(`/event/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      <div className={`relative overflow-hidden border-b-2 border-black ${isLarge ? "h-64 md:h-80" : "h-48"}`}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-full h-full ${categoryColor.bg} flex items-center justify-center`}>
            <Calendar className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className={`absolute top-4 left-4 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-xs font-bold uppercase ${categoryColor.bg} text-white`}>
          {event.category}
        </div>
        {user && (
          <button
            onClick={toggleBookmark}
            disabled={bookmarkLoading}
            className="absolute top-4 right-4 p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-all"
            data-testid={`bookmark-button-${event.id}`}
          >
            {isBookmarked ? <BookmarkCheck className="w-5 h-5 text-red-500" /> : <Bookmark className="w-5 h-5" />}
          </button>
        )}
        {event.is_free && (
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-green-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-xs font-bold uppercase text-white">
            Free
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-bold tracking-tight mb-2 group-hover:text-red-500 transition-colors ${isLarge ? "text-xl md:text-2xl" : "text-lg"}`}>
          {event.title}
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
        {!event.is_free && (
          <div className="mt-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-red-500" />
            <span className="font-bold">${event.ticket_price}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Home Page
const HomePage = ({ onAuthClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const categories = ["All", "Music", "Sports", "Cultural", "Food", "Art", "Tech", "Community"];

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, searchQuery]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      const { data } = await axios.get(`${API}/events?${params}`);
      setEvents(data.events);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 flex flex-col justify-center">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                Discover What's <br />
                <span className="text-red-500">Happening</span> <br />
                In Your City
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Find concerts, festivals, sports events, food fairs, and more. Submit your own events and connect with your community.
              </p>
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="neo-input w-full pl-12"
                  data-testid="search-input"
                />
              </div>
            </div>
            <div className="md:col-span-5 hidden md:block">
              <div className="relative">
                <img
                  src="https://static.prod-images.emergentagent.com/jobs/ac8bfdc1-b85e-47d9-b52f-f35445732af9/images/eda30ced4765acea61767da72f272abc533fc0b8193042e88452eb9df5ea26ed.png"
                  alt="City Events"
                  className="w-full h-80 object-cover border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const colors = getCategoryColor(category);
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 border-2 border-black font-bold uppercase text-sm tracking-wide whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] ${
                    isActive ? "bg-black text-white" : category === "All" ? "bg-white text-black" : `bg-white ${colors.text}`
                  }`}
                  data-testid={`category-filter-${category.toLowerCase()}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {selectedCategory === "All" ? "Upcoming Events" : `${selectedCategory} Events`}
          </h2>
          <Link to="/submit" className="neo-button bg-red-500 text-white" data-testid="submit-event-cta">
            <Plus className="w-4 h-4" /> Add Event
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="neo-card animate-pulse">
                <div className="h-48 bg-gray-200 border-b-2 border-black"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">Be the first to add an event!</p>
            <Link to="/submit" className="neo-button bg-red-500 text-white inline-flex">
              <Plus className="w-4 h-4" /> Submit Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                size={index === 0 ? "large" : "normal"}
                onBookmarkChange={fetchEvents}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Event Detail Page
const EventDetailPage = ({ onAuthClick }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const navigate = useNavigate();
  const eventId = window.location.pathname.split("/").pop();

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (user && event) {
      checkBookmark();
    }
  }, [user, event]);

  const fetchEvent = async () => {
    try {
      const { data } = await axios.get(`${API}/events/${eventId}`);
      setEvent(data);
    } catch (err) {
      console.error("Failed to fetch event", err);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    try {
      const { data } = await axios.get(`${API}/bookmarks/check/${eventId}`);
      setIsBookmarked(data.is_bookmarked);
    } catch {
      // ignore
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      onAuthClick();
      return;
    }
    try {
      if (isBookmarked) {
        await axios.delete(`${API}/bookmarks/${eventId}`);
        setIsBookmarked(false);
      } else {
        await axios.post(`${API}/bookmarks/${eventId}`);
        setIsBookmarked(true);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Link to="/" className="neo-button bg-black text-white">Back to Events</Link>
        </div>
      </div>
    );
  }

  const categoryColor = getCategoryColor(event.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="neo-button bg-white text-black mb-6" data-testid="back-button">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="neo-card overflow-hidden" data-testid="event-detail">
          <div className="relative h-64 md:h-96">
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${categoryColor.bg} flex items-center justify-center`}>
                <Calendar className="w-24 h-24 text-white/50" />
              </div>
            )}
            <div className={`absolute top-4 left-4 px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] font-bold uppercase ${categoryColor.bg} text-white`}>
              {event.category}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{event.title}</h1>
              <button
                onClick={toggleBookmark}
                className={`neo-button ${isBookmarked ? "bg-red-500 text-white" : "bg-white text-black"}`}
                data-testid="detail-bookmark-button"
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                {isBookmarked ? "Saved" : "Save"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black">
                  <Calendar className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Date</p>
                    <p className="font-bold">{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black">
                  <Clock className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Time</p>
                    <p className="font-bold">{event.time}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black">
                  <MapPin className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Location</p>
                    <p className="font-bold">{event.location}</p>
                    <p className="text-sm text-gray-600">{event.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black">
                  <Ticket className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Price</p>
                    <p className="font-bold">{event.is_free ? "Free Entry" : `$${event.ticket_price}`}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            <div className="border-t-2 border-black pt-6">
              <h2 className="text-xl font-bold mb-4">Organizer</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{event.organizer_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${event.organizer_email}`} className="font-medium text-red-500 hover:underline">{event.organizer_email}</a>
                </div>
                {event.organizer_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${event.organizer_phone}`} className="font-medium text-red-500 hover:underline">{event.organizer_phone}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Submit Event Page
const SubmitEventPage = ({ onAuthClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Music",
    date: "",
    time: "",
    location: "",
    address: "",
    is_free: true,
    ticket_price: 0,
    organizer_name: "",
    organizer_email: "",
    organizer_phone: "",
    image_url: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const categories = ["Music", "Sports", "Cultural", "Food", "Art", "Tech", "Community", "Other"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const { data } = await axios.post(`${API}/upload/image`, fd);
      setFormData(prev => ({ ...prev, image_url: data.url }));
    } catch (err) {
      console.error("Failed to upload image", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      onAuthClick();
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/events`, {
        ...formData,
        ticket_price: formData.is_free ? 0 : parseFloat(formData.ticket_price) || 0
      });
      // If admin, redirect directly; otherwise show pending message
      if (user?.role === "admin") {
        navigate(`/event/${data.id}`);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg || JSON.stringify(e)).join(" "));
      } else {
        setError(detail || err.message || "Failed to submit event");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="neo-button bg-white text-black mb-6 inline-flex" data-testid="back-to-events">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Submit Your Event</h1>
          <p className="text-gray-600 mt-2">Share your event with the community</p>
        </div>

        {!user && (
          <div className="neo-card p-6 mb-6 bg-yellow-50">
            <p className="font-bold mb-2">Login Required</p>
            <p className="text-sm text-gray-600 mb-4">You need to be logged in to submit an event.</p>
            <button onClick={onAuthClick} className="neo-button bg-black text-white" data-testid="login-to-submit">
              <User className="w-4 h-4" /> Login to Submit
            </button>
          </div>
        )}

        {submitted && (
          <div className="neo-card p-6 mb-6 bg-green-50 border-green-500" data-testid="submission-success">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500 border-2 border-black">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg mb-2">Event Submitted Successfully!</p>
                <p className="text-gray-600 mb-4">Your event has been submitted for review. Our admin team will review it shortly. Once approved, it will appear on the events page.</p>
                <div className="flex gap-3">
                  <Link to="/" className="neo-button bg-black text-white">
                    Browse Events
                  </Link>
                  <button onClick={() => { setSubmitted(false); setFormData({ title: "", description: "", category: "Music", date: "", time: "", location: "", address: "", is_free: true, ticket_price: 0, organizer_name: "", organizer_email: "", organizer_phone: "", image_url: "" }); setImagePreview(null); }} className="neo-button bg-yellow-400 text-black">
                    <Plus className="w-4 h-4" /> Submit Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!submitted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="neo-card p-6">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Event Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="neo-input w-full"
                  required
                  data-testid="event-title-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="neo-input w-full resize-none"
                  required
                  data-testid="event-description-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="neo-input w-full"
                  data-testid="event-category-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="neo-input w-full"
                    required
                    data-testid="event-date-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="neo-input w-full"
                    required
                    data-testid="event-time-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="neo-card p-6">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Venue Name *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="neo-input w-full"
                  placeholder="e.g., Central Park Amphitheater"
                  required
                  data-testid="event-location-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="neo-input w-full"
                  placeholder="e.g., 123 Main Street, Downtown"
                  required
                  data-testid="event-address-input"
                />
              </div>
            </div>
          </div>

          <div className="neo-card p-6">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Pricing</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_free"
                  checked={formData.is_free}
                  onChange={handleChange}
                  className="w-5 h-5 border-2 border-black"
                  data-testid="event-free-checkbox"
                />
                <span className="font-bold">This is a free event</span>
              </label>
              {!formData.is_free && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Ticket Price ($)</label>
                  <input
                    type="number"
                    name="ticket_price"
                    value={formData.ticket_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="neo-input w-full"
                    data-testid="event-price-input"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="neo-card p-6">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Event Image</h2>
            <div className="space-y-4">
              <div className="relative">
                {imagePreview || formData.image_url ? (
                  <div className="relative">
                    <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-48 object-cover border-2 border-black" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image_url: "" })); }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white border-2 border-black"
                      data-testid="remove-image-button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-black cursor-pointer hover:bg-gray-50 transition-colors">
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="font-bold">Upload Image</span>
                    <span className="text-sm text-gray-500">Max 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="image-upload-input"
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">Or paste an image URL:</p>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="neo-input w-full"
                placeholder="https://example.com/image.jpg"
                data-testid="event-image-url-input"
              />
            </div>
          </div>

          <div className="neo-card p-6">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Organizer Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Your Name *</label>
                <input
                  type="text"
                  name="organizer_name"
                  value={formData.organizer_name}
                  onChange={handleChange}
                  className="neo-input w-full"
                  required
                  data-testid="organizer-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Email *</label>
                <input
                  type="email"
                  name="organizer_email"
                  value={formData.organizer_email}
                  onChange={handleChange}
                  className="neo-input w-full"
                  required
                  data-testid="organizer-email-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  name="organizer_phone"
                  value={formData.organizer_phone}
                  onChange={handleChange}
                  className="neo-input w-full"
                  data-testid="organizer-phone-input"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 font-bold" data-testid="submit-error">{error}</p>}

          <button
            type="submit"
            disabled={loading || !user}
            className="neo-button bg-red-500 text-white w-full justify-center text-lg py-4"
            data-testid="submit-event-button"
          >
            {loading ? "Submitting..." : "Submit Event"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

// Bookmarks Page
const BookmarksPage = ({ onAuthClick }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data } = await axios.get(`${API}/bookmarks`);
      setBookmarks(data.bookmarks);
    } catch (err) {
      console.error("Failed to fetch bookmarks", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">My Saved Events</h1>
          <p className="text-gray-600 mt-2">Events you've bookmarked</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="neo-card animate-pulse">
                <div className="h-48 bg-gray-200 border-b-2 border-black"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16" data-testid="no-bookmarks">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold mb-2">No saved events yet</h3>
            <p className="text-gray-500 mb-6">Browse events and click the bookmark icon to save them here.</p>
            <Link to="/" className="neo-button bg-red-500 text-white inline-flex">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="bookmarks-grid">
            {bookmarks.map(event => (
              <EventCard key={event.id} event={event} onBookmarkChange={fetchBookmarks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Dashboard Page
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/events?status=${filter}`),
        axios.get(`${API}/admin/stats`)
      ]);
      setEvents(eventsRes.data.events);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    setActionLoading(prev => ({ ...prev, [eventId]: "approve" }));
    try {
      await axios.post(`${API}/admin/events/${eventId}/approve`);
      fetchData();
    } catch (err) {
      console.error("Failed to approve event", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [eventId]: null }));
    }
  };

  const handleReject = async (eventId) => {
    setActionLoading(prev => ({ ...prev, [eventId]: "reject" }));
    try {
      await axios.post(`${API}/admin/events/${eventId}/reject`);
      fetchData();
    } catch (err) {
      console.error("Failed to reject event", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [eventId]: null }));
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setActionLoading(prev => ({ ...prev, [eventId]: "delete" }));
    try {
      await axios.delete(`${API}/admin/events/${eventId}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete event", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [eventId]: null }));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-400 text-black",
      published: "bg-green-500 text-white",
      rejected: "bg-red-500 text-white"
    };
    return styles[status] || "bg-gray-500 text-white";
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
            <Shield className="w-10 h-10 text-red-500" /> Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage event submissions and moderation</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="neo-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-400 border-2 border-black">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.pending_events}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="neo-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 border-2 border-black">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.published_events}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Published</p>
                </div>
              </div>
            </div>
            <div className="neo-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500 border-2 border-black">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.rejected_events}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Rejected</p>
                </div>
              </div>
            </div>
            <div className="neo-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 border-2 border-black">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.total_users}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Users</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {["pending", "published", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 border-2 border-black font-bold uppercase text-sm tracking-wide whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] ${
                filter === status ? "bg-black text-white" : "bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]"
              }`}
              data-testid={`admin-filter-${status}`}
            >
              {status} {status === "pending" && stats ? `(${stats.pending_events})` : ""}
            </button>
          ))}
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="neo-card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold mb-2">No {filter} events</h3>
            <p className="text-gray-500">
              {filter === "pending" ? "All caught up! No events waiting for review." : `No ${filter} events found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="admin-events-list">
            {events.map((event) => {
              const categoryColor = getCategoryColor(event.category);
              return (
                <div key={event.id} className="neo-card overflow-hidden" data-testid={`admin-event-${event.id}`}>
                  <div className="flex flex-col md:flex-row">
                    {/* Event Image */}
                    <div className="w-full md:w-48 h-32 md:h-auto flex-shrink-0">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${categoryColor.bg} flex items-center justify-center`}>
                          <Calendar className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase ${categoryColor.bg} text-white`}>
                            {event.category}
                          </span>
                          <span className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase ${getStatusBadge(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <Link to={`/event/${event.id}`} className="text-sm font-bold text-red-500 hover:underline flex items-center gap-1" data-testid={`view-event-${event.id}`}>
                          <Eye className="w-4 h-4" /> View
                        </Link>
                      </div>

                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {event.organizer_name}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {event.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(event.id)}
                              disabled={actionLoading[event.id]}
                              className="neo-button bg-green-500 text-white py-2 px-4"
                              data-testid={`approve-event-${event.id}`}
                            >
                              {actionLoading[event.id] === "approve" ? "..." : <><Check className="w-4 h-4" /> Approve</>}
                            </button>
                            <button
                              onClick={() => handleReject(event.id)}
                              disabled={actionLoading[event.id]}
                              className="neo-button bg-red-500 text-white py-2 px-4"
                              data-testid={`reject-event-${event.id}`}
                            >
                              {actionLoading[event.id] === "reject" ? "..." : <><XCircle className="w-4 h-4" /> Reject</>}
                            </button>
                          </>
                        )}
                        {event.status === "rejected" && (
                          <button
                            onClick={() => handleApprove(event.id)}
                            disabled={actionLoading[event.id]}
                            className="neo-button bg-green-500 text-white py-2 px-4"
                            data-testid={`approve-event-${event.id}`}
                          >
                            {actionLoading[event.id] === "approve" ? "..." : <><Check className="w-4 h-4" /> Approve</>}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={actionLoading[event.id]}
                          className="neo-button bg-gray-200 text-black py-2 px-4"
                          data-testid={`delete-event-${event.id}`}
                        >
                          {actionLoading[event.id] === "delete" ? "..." : <><Trash2 className="w-4 h-4" /> Delete</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App
const AppContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <Header onAuthClick={() => setAuthModalOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/event/:id" element={<EventDetailPage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/submit" element={<SubmitEventPage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/bookmarks" element={<BookmarksPage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
