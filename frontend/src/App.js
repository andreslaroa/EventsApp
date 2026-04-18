import { useState, useEffect, createContext, useContext, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, Clock, Search, Bookmark, BookmarkCheck, Plus, User, LogOut, Menu, X, ChevronRight, ChevronLeft, Ticket, Mail, Phone, ArrowLeft, Shield, Check, XCircle, Trash2, Eye, Users, FileText, Filter, ChevronDown, ChevronUp, DollarSign, Sun, Sunset, Moon, SlidersHorizontal, RotateCcw, Star, Heart, Flame, Zap, TreePine, Send } from "lucide-react";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
axios.defaults.withCredentials = true;

// Auth Context
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { checkAuth(); }, []);
  const checkAuth = async () => {
    try { const { data } = await axios.get(`${API}/auth/me`); setUser(data); }
    catch { setUser(null); }
    finally { setLoading(false); }
  };
  const login = async (email, password) => { const { data } = await axios.post(`${API}/auth/login`, { email, password }); setUser(data); return data; };
  const register = async (name, email, password) => { const { data } = await axios.post(`${API}/auth/register`, { name, email, password }); setUser(data); return data; };
  const logout = async () => { await axios.post(`${API}/auth/logout`); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>{children}</AuthContext.Provider>;
};

// Category colors
const getCategoryColor = (category) => {
  const colors = {
    Music: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50", hex: "#2563EB" },
    Sports: { bg: "bg-green-500", text: "text-green-500", light: "bg-green-50", hex: "#22C55E" },
    Cultural: { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-50", hex: "#F97316" },
    Food: { bg: "bg-yellow-500", text: "text-yellow-500", light: "bg-yellow-50", hex: "#EAB308" },
    Art: { bg: "bg-pink-500", text: "text-pink-500", light: "bg-pink-50", hex: "#EC4899" },
    Tech: { bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50", hex: "#9333EA" },
    Community: { bg: "bg-teal-500", text: "text-teal-500", light: "bg-teal-50", hex: "#14B8A6" },
    Other: { bg: "bg-gray-500", text: "text-gray-500", light: "bg-gray-50", hex: "#6B7280" },
  };
  return colors[category] || colors.Other;
};

const collectionIcons = { heart: Heart, users: Users, moon: Moon, sun: Sun, flame: Flame };

// Star Rating
const StarRating = ({ rating, size = 16, interactive = false, onChange }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} className={`${interactive ? "cursor-pointer" : ""} transition-colors`}
        style={{ width: size, height: size }}
        fill={i <= rating ? "#FF3B30" : "none"} stroke={i <= rating ? "#FF3B30" : "#D1D5DB"}
        onClick={() => interactive && onChange?.(i)} />
    ))}
  </div>
);

// Horizontal Scroll Row
const HScrollRow = ({ title, subtitle, children, viewAllLink }) => {
  const ref = useRef(null);
  const scroll = (dir) => { ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" }); };
  return (
    <div className="py-8">
      <div className="flex items-end justify-between mb-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors" data-testid={`scroll-left-${title.replace(/\s/g,'-').toLowerCase()}`}><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => scroll(1)} className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors" data-testid={`scroll-right-${title.replace(/\s/g,'-').toLowerCase()}`}><ChevronRight className="w-5 h-5" /></button>
          {viewAllLink && <Link to={viewAllLink} className="text-sm font-bold text-red-500 hover:underline uppercase ml-2" data-testid={`view-all-${title.replace(/\s/g,'-').toLowerCase()}`}>View All</Link>}
        </div>
      </div>
      <div ref={ref} className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-4">{children}</div>
    </div>
  );
};

// Fever-style Event Card
const EventCard = ({ event, variant = "normal", onBookmarkChange }) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const navigate = useNavigate();
  const categoryColor = getCategoryColor(event.category);

  useEffect(() => { if (user) checkBookmark(); }, [user, event.id]);
  const checkBookmark = async () => { try { const { data } = await axios.get(`${API}/bookmarks/check/${event.id}`); setIsBookmarked(data.is_bookmarked); } catch {} };
  const toggleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) return;
    try {
      if (isBookmarked) { await axios.delete(`${API}/bookmarks/${event.id}`); setIsBookmarked(false); }
      else { await axios.post(`${API}/bookmarks/${event.id}`); setIsBookmarked(true); }
      onBookmarkChange?.();
    } catch {}
  };

  const isNew = (() => { const created = new Date(event.created_at); const now = new Date(); return (now - created) < 3 * 24 * 60 * 60 * 1000; })();
  const isPopular = event.bookmark_count > 2;

  if (variant === "hero") {
    return (
      <div className="relative flex-shrink-0 w-[90vw] md:w-[700px] h-[400px] cursor-pointer group" onClick={() => navigate(`/event/${event.id}`)} data-testid={`hero-card-${event.id}`}>
        <div className="w-full h-full relative overflow-hidden border-2 border-black shadow-[6px_6px_0px_0px_rgba(10,10,10,1)]">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className={`w-full h-full ${categoryColor.bg}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className={`inline-block px-3 py-1 border-2 border-black text-xs font-bold uppercase ${categoryColor.bg} text-white shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] mb-3`}>{event.category}</span>
            {event.is_featured && <span className="ml-2 inline-block px-3 py-1 bg-yellow-400 border-2 border-black text-xs font-bold uppercase text-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] mb-3"><Flame className="w-3 h-3 inline -mt-0.5" /> Featured</span>}
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
              <span className="font-bold">{event.is_free ? "Free" : `From $${event.ticket_price}`}</span>
            </div>
            {event.avg_rating > 0 && <div className="flex items-center gap-2 mt-2"><StarRating rating={Math.round(event.avg_rating)} size={14} /><span className="text-white/80 text-xs">{event.avg_rating} ({event.review_count})</span></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`neo-card cursor-pointer group flex-shrink-0 ${variant === "scroll" ? "w-[300px]" : ""}`} onClick={() => navigate(`/event/${event.id}`)} data-testid={`event-card-${event.id}`}>
      <div className="relative overflow-hidden border-b-2 border-black h-48">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-full h-full ${categoryColor.bg} flex items-center justify-center`}><Calendar className="w-16 h-16 text-white/50" /></div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-xs font-bold uppercase ${categoryColor.bg} text-white`}>{event.category}</span>
          {isNew && <span className="px-2 py-1 bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-xs font-bold uppercase text-white"><Zap className="w-3 h-3 inline -mt-0.5" /> New</span>}
          {isPopular && !isNew && <span className="px-2 py-1 bg-orange-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-xs font-bold uppercase text-white"><Flame className="w-3 h-3 inline -mt-0.5" /> Popular</span>}
        </div>
        {user && (
          <button onClick={toggleBookmark} className="absolute top-3 right-3 p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-0.5 transition-all" data-testid={`bookmark-button-${event.id}`}>
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-red-500" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}
        {event.is_free && (
          <div className="absolute bottom-3 right-3 px-3 py-1 bg-green-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-xs font-bold uppercase text-white">Free</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold tracking-tight mb-2 group-hover:text-red-500 transition-colors text-base line-clamp-2">{event.title}</h3>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <Clock className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <span className="font-bold text-sm">{event.is_free ? "Free" : `From $${event.ticket_price}`}</span>
          {event.avg_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" fill="#FF3B30" stroke="#FF3B30" />
              <span className="text-xs font-bold">{event.avg_rating}</span>
              <span className="text-xs text-gray-400">({event.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Header
const Header = ({ onAuthClick }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-red-500 border-2 border-black shadow-[3px_3px_0px_0px_rgba(10,10,10,1)] flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-black uppercase tracking-tight">CityEvents</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/" className="font-bold uppercase tracking-wide text-sm hover:text-red-500 transition-colors" data-testid="nav-home">Discover</Link>
            {user && <Link to="/bookmarks" className="font-bold uppercase tracking-wide text-sm hover:text-red-500 transition-colors" data-testid="nav-bookmarks">Saved</Link>}
            {user?.role === "admin" && <Link to="/admin" className="font-bold uppercase tracking-wide text-sm hover:text-red-500 transition-colors flex items-center gap-1" data-testid="nav-admin"><Shield className="w-4 h-4" /> Admin</Link>}
            <Link to="/submit" className="neo-button bg-yellow-400 text-black py-2 px-4" data-testid="nav-submit"><Plus className="w-4 h-4" /> Submit</Link>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">{user.name}</span>
                <button onClick={logout} className="p-2 border-2 border-black hover:bg-gray-100 transition-colors" data-testid="logout-button"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={onAuthClick} className="neo-button bg-black text-white py-2 px-4" data-testid="login-button"><User className="w-4 h-4" /> Login</button>
            )}
          </nav>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-toggle">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-black flex flex-col gap-3">
            <Link to="/" className="font-bold uppercase tracking-wide" onClick={() => setMobileMenuOpen(false)}>Discover</Link>
            {user && <Link to="/bookmarks" className="font-bold uppercase tracking-wide" onClick={() => setMobileMenuOpen(false)}>Saved</Link>}
            {user?.role === "admin" && <Link to="/admin" className="font-bold uppercase tracking-wide" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
            <Link to="/submit" className="neo-button bg-yellow-400 text-black w-full justify-center" onClick={() => setMobileMenuOpen(false)}><Plus className="w-4 h-4" /> Submit</Link>
            {user ? <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="neo-button bg-gray-200 text-black w-full justify-center"><LogOut className="w-4 h-4" /> Logout</button>
              : <button onClick={() => { onAuthClick(); setMobileMenuOpen(false); }} className="neo-button bg-black text-white w-full justify-center"><User className="w-4 h-4" /> Login</button>}
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
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      onClose(); setName(""); setEmail(""); setPassword("");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(Array.isArray(d) ? d.map(e => e.msg || JSON.stringify(e)).join(" ") : d || err.message || "Something went wrong");
    } finally { setLoading(false); }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] w-full max-w-md p-8" onClick={e => e.stopPropagation()} data-testid="auth-modal">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">{mode === "login" ? "Welcome Back" : "Join Us"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (<div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="neo-input w-full" required data-testid="register-name-input" /></div>)}
          <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="neo-input w-full" required data-testid="auth-email-input" /></div>
          <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="neo-input w-full" required data-testid="auth-password-input" /></div>
          {error && <p className="text-red-500 font-medium" data-testid="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="neo-button bg-red-500 text-white w-full justify-center" data-testid="auth-submit-button">{loading ? "Loading..." : mode === "login" ? "Login" : "Create Account"}</button>
        </form>
        <p className="text-center mt-4 text-sm">{mode === "login" ? "Don't have an account? " : "Already have an account? "}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-bold text-red-500 hover:underline" data-testid="auth-mode-toggle">{mode === "login" ? "Sign up" : "Login"}</button></p>
      </div>
    </div>
  );
};

// ===================== HOME PAGE (Fever-style) =====================
const HomePage = ({ onAuthClick }) => {
  const [allEvents, setAllEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [pricing, setPricing] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [totalEvents, setTotalEvents] = useState(0);
  const categories = ["All", "Music", "Sports", "Cultural", "Food", "Art", "Tech", "Community"];

  useEffect(() => {
    axios.get(`${API}/featured`).then(r => setFeaturedEvents(r.data.events)).catch(() => {});
    axios.get(`${API}/collections`).then(r => setCollections(r.data.collections)).catch(() => {});
  }, []);

  useEffect(() => { fetchEvents(); }, [selectedCategory, searchQuery, quickDate, dateFrom, dateTo, locationQuery, pricing, priceMin, priceMax, timeOfDay, sortBy]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      if (quickDate) params.append("quick_date", quickDate);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (locationQuery) params.append("location", locationQuery);
      if (pricing !== "all") params.append("pricing", pricing);
      if (priceMin) params.append("price_min", priceMin);
      if (priceMax) params.append("price_max", priceMax);
      if (timeOfDay) params.append("time_of_day", timeOfDay);
      if (sortBy) params.append("sort_by", sortBy);
      const { data } = await axios.get(`${API}/events?${params}`);
      setAllEvents(data.events);
      setTotalEvents(data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const clearAllFilters = () => { setSelectedCategory("All"); setSearchQuery(""); setQuickDate(""); setDateFrom(""); setDateTo(""); setLocationQuery(""); setPricing("all"); setPriceMin(""); setPriceMax(""); setTimeOfDay(""); setSortBy("date_asc"); };
  const activeFilterCount = [dateFrom, dateTo, locationQuery, pricing !== "all" ? pricing : "", priceMin, priceMax, timeOfDay, sortBy !== "date_asc" ? sortBy : ""].filter(Boolean).length;

  // Group events by category for horizontal rows
  const eventsByCategory = {};
  allEvents.forEach(e => { if (!eventsByCategory[e.category]) eventsByCategory[e.category] = []; eventsByCategory[e.category].push(e); });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel */}
      {featuredEvents.length > 0 && (
        <HScrollRow title="Featured Experiences" subtitle="Hand-picked events you can't miss">
          {featuredEvents.map(e => <EventCard key={e.id} event={e} variant="hero" />)}
        </HScrollRow>
      )}

      {/* Quick Date Shortcuts + Search */}
      <section className="bg-white border-y-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
              {[
                { value: "", label: "All Dates" },
                { value: "today", label: "Today" },
                { value: "this_weekend", label: "This Weekend" },
                { value: "this_week", label: "This Week" },
              ].map(d => (
                <button key={d.value} onClick={() => setQuickDate(d.value)}
                  className={`px-4 py-2 border-2 border-black font-bold uppercase text-xs tracking-wide whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] ${quickDate === d.value ? "bg-red-500 text-white" : "bg-white text-black hover:-translate-y-0.5"}`}
                  data-testid={`quick-date-${d.value || 'all'}`}>{d.label}</button>
              ))}
            </div>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search events, venues, artists..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="neo-input w-full pl-10 py-2 text-sm" data-testid="search-input" />
            </div>
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={`neo-button py-2 px-4 text-xs flex items-center gap-2 ${filtersOpen || activeFilterCount > 0 ? "bg-red-500 text-white" : "bg-white text-black"}`}
              data-testid="toggle-filters-button">
              <SlidersHorizontal className="w-4 h-4" /> Filters
              {activeFilterCount > 0 && <span className="bg-white text-red-500 text-xs font-black w-5 h-5 flex items-center justify-center border border-black">{activeFilterCount}</span>}
            </button>
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {filtersOpen && (
        <section className="bg-white border-b-2 border-black" data-testid="advanced-filters-panel">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><Calendar className="w-4 h-4 text-red-500" /> Date Range</label>
                <div className="space-y-2"><div><span className="text-xs font-medium text-gray-500 mb-1 block">From</span><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="neo-input w-full py-2 px-3 text-sm" data-testid="filter-date-from" /></div>
                  <div><span className="text-xs font-medium text-gray-500 mb-1 block">To</span><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="neo-input w-full py-2 px-3 text-sm" data-testid="filter-date-to" /></div></div></div>
              <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><MapPin className="w-4 h-4 text-red-500" /> Location</label>
                <input type="text" value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="City, venue, or address..." className="neo-input w-full py-2 px-3 text-sm" data-testid="filter-location" /></div>
              <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><DollarSign className="w-4 h-4 text-red-500" /> Pricing</label>
                <div className="flex gap-2">{[{value:"all",label:"All"},{value:"free",label:"Free"},{value:"paid",label:"Paid"}].map(o => (
                  <button key={o.value} onClick={() => setPricing(o.value)} className={`flex-1 px-3 py-2 border-2 border-black font-bold text-xs uppercase transition-all ${pricing === o.value ? "bg-black text-white" : "bg-white text-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]"}`} data-testid={`filter-pricing-${o.value}`}>{o.label}</button>
                ))}</div>
                {pricing === "paid" && <div className="flex gap-2 items-center"><input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min $" min="0" className="neo-input w-full py-2 px-3 text-sm" data-testid="filter-price-min" /><span className="text-gray-400 font-bold">-</span><input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max $" min="0" className="neo-input w-full py-2 px-3 text-sm" data-testid="filter-price-max" /></div>}</div>
              <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><Clock className="w-4 h-4 text-red-500" /> Time of Day</label>
                <div className="grid grid-cols-2 gap-2">{[{value:"morning",label:"Morning",sub:"5am-12pm"},{value:"afternoon",label:"Afternoon",sub:"12-5pm"},{value:"evening",label:"Evening",sub:"5-9pm"},{value:"night",label:"Night",sub:"9pm-5am"}].map(t => (
                  <button key={t.value} onClick={() => setTimeOfDay(timeOfDay === t.value ? "" : t.value)} className={`px-2 py-2 border-2 border-black font-bold text-xs uppercase transition-all flex flex-col items-center ${timeOfDay === t.value ? "bg-black text-white" : "bg-white text-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]"}`} data-testid={`filter-time-${t.value}`}><span>{t.label}</span><span className="text-[10px] opacity-60 normal-case">{t.sub}</span></button>
                ))}</div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide mt-3"><Filter className="w-4 h-4 text-red-500" /> Sort</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="neo-input w-full py-2 px-3 text-sm" data-testid="filter-sort-by">
                  <option value="date_asc">Date (Soonest)</option><option value="date_desc">Date (Latest)</option><option value="price_asc">Price (Low-High)</option><option value="price_desc">Price (High-Low)</option><option value="newest">Recently Added</option>
                </select></div>
            </div>
            <div className="flex justify-end mt-4"><button onClick={clearAllFilters} className="neo-button bg-gray-200 text-black py-2" data-testid="clear-all-filters"><RotateCcw className="w-4 h-4" /> Clear All</button></div>
          </div>
        </section>
      )}

      {/* Category Chips */}
      <section className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => {
              const c = getCategoryColor(cat);
              return <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 border-2 border-black font-bold uppercase text-xs tracking-wide whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-0.5 ${selectedCategory === cat ? "bg-black text-white" : cat === "All" ? "bg-white text-black" : `bg-white ${c.text}`}`} data-testid={`category-filter-${cat.toLowerCase()}`}>{cat}</button>;
            })}
          </div>
        </div>
      </section>

      {/* Collections Row */}
      {collections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {collections.map(col => {
              const Icon = collectionIcons[col.icon] || Star;
              return (
                <Link key={col.slug} to={`/collection/${col.slug}`} className="neo-card p-4 flex flex-col items-center text-center gap-2 hover:bg-gray-50" data-testid={`collection-${col.slug}`}>
                  <div className="w-12 h-12 bg-red-50 border-2 border-black flex items-center justify-center"><Icon className="w-6 h-6 text-red-500" /></div>
                  <span className="text-xs font-bold uppercase tracking-wide">{col.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Events: If filtered, show grid. If not, show by-category rows */}
      {selectedCategory === "All" && !searchQuery && !quickDate && activeFilterCount === 0 ? (
        <>
          {Object.entries(eventsByCategory).map(([cat, events]) => (
            <HScrollRow key={cat} title={`${cat} Events`} subtitle={`${events.length} experiences`}>
              {events.map(e => <EventCard key={e.id} event={e} variant="scroll" />)}
            </HScrollRow>
          ))}
        </>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight">{selectedCategory === "All" ? "All Events" : `${selectedCategory} Events`}<span className="text-sm font-medium text-gray-400 ml-2">({totalEvents})</span></h2>
            <Link to="/submit" className="neo-button bg-red-500 text-white py-2 px-4 text-xs" data-testid="submit-event-cta"><Plus className="w-4 h-4" /> Add Event</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <div key={i} className="neo-card animate-pulse"><div className="h-48 bg-gray-200 border-b-2 border-black" /><div className="p-4 space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div></div>)}
            </div>
          ) : allEvents.length === 0 ? (
            <div className="text-center py-16"><Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" /><h3 className="text-xl font-bold mb-2">No events found</h3><p className="text-gray-500 mb-4">Try adjusting your filters.</p><button onClick={clearAllFilters} className="neo-button bg-black text-white"><RotateCcw className="w-4 h-4" /> Clear Filters</button></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {allEvents.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// ===================== EVENT DETAIL PAGE =====================
const EventDetailPage = ({ onAuthClick }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const navigate = useNavigate();
  const eventId = window.location.pathname.split("/").pop();

  useEffect(() => { fetchEvent(); }, [eventId]);
  useEffect(() => { if (user && event) checkBookmark(); }, [user, event]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const [eventRes, relatedRes, reviewsRes] = await Promise.all([
        axios.get(`${API}/events/${eventId}`),
        axios.get(`${API}/events/${eventId}/related`),
        axios.get(`${API}/events/${eventId}/reviews`),
      ]);
      setEvent(eventRes.data);
      setRelatedEvents(relatedRes.data.events);
      setReviews(reviewsRes.data.reviews);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const checkBookmark = async () => { try { const { data } = await axios.get(`${API}/bookmarks/check/${eventId}`); setIsBookmarked(data.is_bookmarked); } catch {} };
  const toggleBookmark = async () => {
    if (!user) { onAuthClick(); return; }
    try { if (isBookmarked) { await axios.delete(`${API}/bookmarks/${eventId}`); setIsBookmarked(false); } else { await axios.post(`${API}/bookmarks/${eventId}`); setIsBookmarked(true); } } catch {}
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { onAuthClick(); return; }
    if (newRating === 0) return;
    setReviewLoading(true);
    try {
      await axios.post(`${API}/events/${eventId}/reviews`, { rating: newRating, comment: newComment });
      setNewRating(0); setNewComment("");
      const [eventRes, reviewsRes] = await Promise.all([axios.get(`${API}/events/${eventId}`), axios.get(`${API}/events/${eventId}/reviews`)]);
      setEvent(eventRes.data); setReviews(reviewsRes.data.reviews);
    } catch (err) { console.error(err); }
    finally { setReviewLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;
  if (!event) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Event not found</h2><Link to="/" className="neo-button bg-black text-white">Back to Events</Link></div></div>;

  const categoryColor = getCategoryColor(event.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="neo-button bg-white text-black mb-6 py-2" data-testid="back-button"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="neo-card overflow-hidden" data-testid="event-detail">
          <div className="relative h-64 md:h-96">
            {event.image_url ? <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" /> : <div className={`w-full h-full ${categoryColor.bg} flex items-center justify-center`}><Calendar className="w-24 h-24 text-white/50" /></div>}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] font-bold uppercase text-sm ${categoryColor.bg} text-white`}>{event.category}</span>
              {event.is_featured && <span className="px-3 py-1 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] font-bold uppercase text-sm text-black"><Flame className="w-3 h-3 inline" /> Featured</span>}
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{event.title}</h1>
                {event.avg_rating > 0 && <div className="flex items-center gap-2"><StarRating rating={Math.round(event.avg_rating)} /><span className="font-bold text-sm">{event.avg_rating}</span><span className="text-gray-400 text-sm">({event.review_count} reviews)</span></div>}
              </div>
              <div className="flex gap-2">
                <button onClick={toggleBookmark} className={`neo-button py-2 ${isBookmarked ? "bg-red-500 text-white" : "bg-white text-black"}`} data-testid="detail-bookmark-button">{isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}{isBookmarked ? "Saved" : "Save"}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black"><Calendar className="w-6 h-6 text-red-500" /><div><p className="text-xs font-bold uppercase text-gray-500">Date</p><p className="font-bold">{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div></div>
              <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black"><Clock className="w-6 h-6 text-red-500" /><div><p className="text-xs font-bold uppercase text-gray-500">Time</p><p className="font-bold">{event.time}</p></div></div>
              <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black"><MapPin className="w-6 h-6 text-red-500" /><div><p className="text-xs font-bold uppercase text-gray-500">Location</p><p className="font-bold">{event.location}</p><p className="text-sm text-gray-600">{event.address}</p></div></div>
              <div className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black"><Ticket className="w-6 h-6 text-red-500" /><div><p className="text-xs font-bold uppercase text-gray-500">Price</p><p className="font-bold text-lg">{event.is_free ? "Free Entry" : `From $${event.ticket_price}`}</p></div></div>
            </div>
            {event.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{event.tags.map(t => <span key={t} className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-bold uppercase">{t}</span>)}</div>}
            <div className="mb-8"><h2 className="text-xl font-bold mb-3">About This Event</h2><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p></div>
            <div className="border-t-2 border-black pt-6 mb-8"><h2 className="text-xl font-bold mb-4">Organizer</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3"><User className="w-5 h-5 text-gray-400" /><span className="font-medium">{event.organizer_name}</span></div>
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><a href={`mailto:${event.organizer_email}`} className="font-medium text-red-500 hover:underline">{event.organizer_email}</a></div>
                {event.organizer_phone && <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><a href={`tel:${event.organizer_phone}`} className="font-medium text-red-500 hover:underline">{event.organizer_phone}</a></div>}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t-2 border-black pt-6">
              <h2 className="text-xl font-bold mb-4">Reviews & Ratings</h2>
              <form onSubmit={submitReview} className="neo-card p-4 mb-6 bg-gray-50" data-testid="review-form">
                <p className="font-bold text-sm mb-2">{user ? "Leave a review" : "Login to leave a review"}</p>
                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={newRating} interactive onChange={setNewRating} />
                  {newRating > 0 && <span className="text-sm text-gray-500">{["","Poor","Fair","Good","Great","Amazing"][newRating]}</span>}
                </div>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your experience..." rows={3} className="neo-input w-full text-sm mb-3 resize-none" data-testid="review-comment-input" />
                <button type="submit" disabled={!user || newRating === 0 || reviewLoading} className="neo-button bg-red-500 text-white py-2 px-4 text-xs" data-testid="submit-review-button"><Send className="w-4 h-4" /> {reviewLoading ? "Posting..." : "Post Review"}</button>
              </form>
              {reviews.length === 0 ? <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p> : (
                <div className="space-y-4">{reviews.map(r => (
                  <div key={r.id} className="neo-card p-4" data-testid={`review-${r.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><div className="w-8 h-8 bg-red-100 border-2 border-black flex items-center justify-center font-bold text-sm text-red-500">{r.user_name?.[0]?.toUpperCase()}</div><span className="font-bold text-sm">{r.user_name}</span></div>
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <StarRating rating={r.rating} size={14} />
                    {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <HScrollRow title="You Might Also Like" subtitle="Similar experiences near you">
          {relatedEvents.map(e => <EventCard key={e.id} event={e} variant="scroll" />)}
        </HScrollRow>
      )}
    </div>
  );
};

// ===================== COLLECTION PAGE =====================
const CollectionPage = () => {
  const [collection, setCollection] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const slug = window.location.pathname.split("/").pop();

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/collections/${slug}`).then(r => { setCollection(r.data.collection); setEvents(r.data.events); }).catch(err => console.error(err)).finally(() => setLoading(false));
  }, [slug]);

  const Icon = collection ? (collectionIcons[collection.icon] || Star) : Star;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="neo-button bg-white text-black mb-6 inline-flex py-2"><ArrowLeft className="w-4 h-4" /> Back</Link>
        {collection && (
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-red-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] flex items-center justify-center"><Icon className="w-8 h-8 text-red-500" /></div>
            <div><h1 className="text-3xl font-black tracking-tight">{collection.name}</h1><p className="text-gray-500">{collection.description}</p></div>
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{[...Array(4)].map((_, i) => <div key={i} className="neo-card animate-pulse"><div className="h-48 bg-gray-200 border-b-2 border-black" /><div className="p-4 space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /></div></div>)}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16"><h3 className="text-xl font-bold mb-2">No events in this collection yet</h3><Link to="/" className="neo-button bg-red-500 text-white inline-flex">Browse All Events</Link></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{events.map(e => <EventCard key={e.id} event={e} />)}</div>
        )}
      </div>
    </div>
  );
};

// ===================== SUBMIT EVENT PAGE =====================
const SubmitEventPage = ({ onAuthClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", description: "", category: "Music", date: "", time: "", location: "", address: "", is_free: true, ticket_price: 0, organizer_name: "", organizer_email: "", organizer_phone: "", image_url: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const categories = ["Music", "Sports", "Cultural", "Food", "Art", "Tech", "Community", "Other"];
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(p => ({ ...p, [name]: type === "checkbox" ? checked : value })); };
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setImagePreview(reader.result); reader.readAsDataURL(file);
    const fd = new FormData(); fd.append("file", file);
    try { const { data } = await axios.post(`${API}/upload/image`, fd); setFormData(p => ({ ...p, image_url: data.url })); } catch {}
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!user) { onAuthClick(); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/events`, { ...formData, ticket_price: formData.is_free ? 0 : parseFloat(formData.ticket_price) || 0 });
      if (user?.role === "admin") navigate(`/event/${data.id}`);
      else setSubmitted(true);
    } catch (err) { const d = err.response?.data?.detail; setError(Array.isArray(d) ? d.map(e => e.msg || JSON.stringify(e)).join(" ") : d || "Failed to submit event"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="neo-button bg-white text-black mb-6 inline-flex py-2" data-testid="back-to-events"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tight">Submit Your Event</h1>
          <p className="text-gray-600 mt-2">Share your event with the community</p>
        </div>
        {!user && <div className="neo-card p-6 mb-6 bg-yellow-50"><p className="font-bold mb-2">Login Required</p><p className="text-sm text-gray-600 mb-4">You need to be logged in to submit.</p><button onClick={onAuthClick} className="neo-button bg-black text-white" data-testid="login-to-submit"><User className="w-4 h-4" /> Login</button></div>}
        {submitted && (
          <div className="neo-card p-6 mb-6 bg-green-50" data-testid="submission-success">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500 border-2 border-black"><Check className="w-6 h-6 text-white" /></div>
              <div><p className="font-bold text-lg mb-2">Event Submitted!</p><p className="text-gray-600 mb-4">Your event is under review. Once approved, it will appear on the events page.</p>
                <div className="flex gap-3"><Link to="/" className="neo-button bg-black text-white py-2">Browse Events</Link><button onClick={() => { setSubmitted(false); setFormData({ title: "", description: "", category: "Music", date: "", time: "", location: "", address: "", is_free: true, ticket_price: 0, organizer_name: "", organizer_email: "", organizer_phone: "", image_url: "" }); setImagePreview(null); }} className="neo-button bg-yellow-400 text-black py-2"><Plus className="w-4 h-4" /> Submit Another</button></div></div>
            </div>
          </div>
        )}
        {!submitted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="neo-card p-6"><h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Event Details</h2><div className="space-y-4">
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="neo-input w-full" required data-testid="event-title-input" /></div>
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Description *</label><textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="neo-input w-full resize-none" required data-testid="event-description-input" /></div>
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Category *</label><select name="category" value={formData.category} onChange={handleChange} className="neo-input w-full" data-testid="event-category-select">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Date *</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="neo-input w-full" required data-testid="event-date-input" /></div><div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Time *</label><input type="time" name="time" value={formData.time} onChange={handleChange} className="neo-input w-full" required data-testid="event-time-input" /></div></div>
          </div></div>
          <div className="neo-card p-6"><h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Location</h2><div className="space-y-4">
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Venue *</label><input type="text" name="location" value={formData.location} onChange={handleChange} className="neo-input w-full" required data-testid="event-location-input" /></div>
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Address *</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="neo-input w-full" required data-testid="event-address-input" /></div>
          </div></div>
          <div className="neo-card p-6"><h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Pricing</h2><div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="is_free" checked={formData.is_free} onChange={handleChange} className="w-5 h-5 border-2 border-black" data-testid="event-free-checkbox" /><span className="font-bold">Free event</span></label>
            {!formData.is_free && <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Ticket Price ($)</label><input type="number" name="ticket_price" value={formData.ticket_price} onChange={handleChange} min="0" step="0.01" className="neo-input w-full" data-testid="event-price-input" /></div>}
          </div></div>
          <div className="neo-card p-6"><h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Image</h2>
            {imagePreview || formData.image_url ? <div className="relative mb-4"><img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-48 object-cover border-2 border-black" /><button type="button" onClick={() => { setImagePreview(null); setFormData(p => ({ ...p, image_url: "" })); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white border-2 border-black" data-testid="remove-image-button"><X className="w-4 h-4" /></button></div>
              : <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-black cursor-pointer hover:bg-gray-50 mb-4"><Plus className="w-8 h-8 mb-2" /><span className="font-bold">Upload Image</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="image-upload-input" /></label>}
            <input type="url" name="image_url" value={formData.image_url} onChange={handleChange} className="neo-input w-full text-sm" placeholder="Or paste image URL" data-testid="event-image-url-input" />
          </div>
          <div className="neo-card p-6"><h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Organizer</h2><div className="space-y-4">
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Name *</label><input type="text" name="organizer_name" value={formData.organizer_name} onChange={handleChange} className="neo-input w-full" required data-testid="organizer-name-input" /></div>
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Email *</label><input type="email" name="organizer_email" value={formData.organizer_email} onChange={handleChange} className="neo-input w-full" required data-testid="organizer-email-input" /></div>
            <div><label className="block text-sm font-bold uppercase tracking-wide mb-2">Phone</label><input type="tel" name="organizer_phone" value={formData.organizer_phone} onChange={handleChange} className="neo-input w-full" data-testid="organizer-phone-input" /></div>
          </div></div>
          {error && <p className="text-red-500 font-bold" data-testid="submit-error">{error}</p>}
          <button type="submit" disabled={loading || !user} className="neo-button bg-red-500 text-white w-full justify-center text-lg py-4" data-testid="submit-event-button">{loading ? "Submitting..." : "Submit Event"}</button>
        </form>
        )}
      </div>
    </div>
  );
};

// ===================== BOOKMARKS PAGE =====================
const BookmarksPage = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => { if (!user) { navigate("/"); return; } fetchBookmarks(); }, [user]);
  const fetchBookmarks = async () => { try { const { data } = await axios.get(`${API}/bookmarks`); setBookmarks(data.bookmarks); } catch {} finally { setLoading(false); } };
  if (!user) return null;
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">My Saved Events</h1>
        <p className="text-gray-600 mb-8">Events you've bookmarked</p>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{[...Array(4)].map((_, i) => <div key={i} className="neo-card animate-pulse"><div className="h-48 bg-gray-200 border-b-2 border-black" /><div className="p-4 space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /></div></div>)}</div>
          : bookmarks.length === 0 ? <div className="text-center py-16" data-testid="no-bookmarks"><Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" /><h3 className="text-xl font-bold mb-2">No saved events yet</h3><Link to="/" className="neo-button bg-red-500 text-white inline-flex">Browse Events</Link></div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-testid="bookmarks-grid">{bookmarks.map(e => <EventCard key={e.id} event={e} onBookmarkChange={fetchBookmarks} />)}</div>}
      </div>
    </div>
  );
};

// ===================== ADMIN DASHBOARD =====================
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState({});
  useEffect(() => { if (!user || user.role !== "admin") { navigate("/"); return; } fetchData(); }, [user, filter]);
  const fetchData = async () => { setLoading(true); try { const [e, s] = await Promise.all([axios.get(`${API}/admin/events?status=${filter}`), axios.get(`${API}/admin/stats`)]); setEvents(e.data.events); setStats(s.data); } catch {} finally { setLoading(false); } };
  const handleAction = async (eventId, action) => {
    setActionLoading(p => ({ ...p, [eventId]: action }));
    try {
      if (action === "approve") await axios.post(`${API}/admin/events/${eventId}/approve`);
      else if (action === "reject") await axios.post(`${API}/admin/events/${eventId}/reject`);
      else if (action === "delete") { if (!window.confirm("Delete this event?")) return; await axios.delete(`${API}/admin/events/${eventId}`); }
      fetchData();
    } catch {} finally { setActionLoading(p => ({ ...p, [eventId]: null })); }
  };
  if (!user || user.role !== "admin") return null;
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3 mb-2"><Shield className="w-8 h-8 text-red-500" /> Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Manage event submissions</p>
        {stats && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="neo-card p-4 flex items-center gap-3"><div className="p-2 bg-yellow-400 border-2 border-black"><Clock className="w-5 h-5" /></div><div><p className="text-xl font-black">{stats.pending_events}</p><p className="text-xs font-bold uppercase text-gray-500">Pending</p></div></div>
          <div className="neo-card p-4 flex items-center gap-3"><div className="p-2 bg-green-500 border-2 border-black"><Check className="w-5 h-5 text-white" /></div><div><p className="text-xl font-black">{stats.published_events}</p><p className="text-xs font-bold uppercase text-gray-500">Published</p></div></div>
          <div className="neo-card p-4 flex items-center gap-3"><div className="p-2 bg-red-500 border-2 border-black"><XCircle className="w-5 h-5 text-white" /></div><div><p className="text-xl font-black">{stats.rejected_events}</p><p className="text-xs font-bold uppercase text-gray-500">Rejected</p></div></div>
          <div className="neo-card p-4 flex items-center gap-3"><div className="p-2 bg-blue-500 border-2 border-black"><Users className="w-5 h-5 text-white" /></div><div><p className="text-xl font-black">{stats.total_users}</p><p className="text-xs font-bold uppercase text-gray-500">Users</p></div></div>
        </div>}
        <div className="flex gap-2 mb-6">{["pending","published","rejected"].map(s => <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 border-2 border-black font-bold uppercase text-xs tracking-wide shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] ${filter === s ? "bg-black text-white" : "bg-white text-black"}`} data-testid={`admin-filter-${s}`}>{s}{s === "pending" && stats ? ` (${stats.pending_events})` : ""}</button>)}</div>
        {loading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="neo-card p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div>)}</div>
          : events.length === 0 ? <div className="neo-card p-12 text-center"><FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" /><h3 className="text-xl font-bold">No {filter} events</h3></div>
          : <div className="space-y-4" data-testid="admin-events-list">{events.map(event => {
            const cc = getCategoryColor(event.category);
            return (
              <div key={event.id} className="neo-card overflow-hidden flex flex-col md:flex-row" data-testid={`admin-event-${event.id}`}>
                <div className="w-full md:w-44 h-32 md:h-auto flex-shrink-0">{event.image_url ? <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" /> : <div className={`w-full h-full ${cc.bg} flex items-center justify-center`}><Calendar className="w-10 h-10 text-white/50" /></div>}</div>
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-2"><span className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase ${cc.bg} text-white`}>{event.category}</span><span className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase ${event.status === "pending" ? "bg-yellow-400 text-black" : event.status === "published" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>{event.status}</span><Link to={`/event/${event.id}`} className="ml-auto text-sm font-bold text-red-500 hover:underline flex items-center gap-1" data-testid={`view-event-${event.id}`}><Eye className="w-4 h-4" />View</Link></div>
                  <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span></div>
                  <div className="flex gap-2">
                    {(event.status === "pending" || event.status === "rejected") && <button onClick={() => handleAction(event.id, "approve")} disabled={!!actionLoading[event.id]} className="neo-button bg-green-500 text-white py-1.5 px-3 text-xs" data-testid={`approve-event-${event.id}`}><Check className="w-3 h-3" /> Approve</button>}
                    {event.status === "pending" && <button onClick={() => handleAction(event.id, "reject")} disabled={!!actionLoading[event.id]} className="neo-button bg-red-500 text-white py-1.5 px-3 text-xs" data-testid={`reject-event-${event.id}`}><XCircle className="w-3 h-3" /> Reject</button>}
                    <button onClick={() => handleAction(event.id, "delete")} disabled={!!actionLoading[event.id]} className="neo-button bg-gray-200 text-black py-1.5 px-3 text-xs" data-testid={`delete-event-${event.id}`}><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                </div>
              </div>
            );
          })}</div>}
      </div>
    </div>
  );
};

// ===================== APP =====================
const AppContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  return (
    <>
      <Header onAuthClick={() => setAuthModalOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/event/:id" element={<EventDetailPage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/submit" element={<SubmitEventPage onAuthClick={() => setAuthModalOpen(true)} />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/collection/:slug" element={<CollectionPage />} />
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
