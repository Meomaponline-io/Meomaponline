import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { Menu, Search, Heart, BookOpen, Home, List, History, LogIn, User, Settings, ChevronLeft, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API CLIENT ---
const API_URL = 'https://backend.youware.com/api';

const api = {
  async get(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  async post(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  getStories: (cat, search) => {
    const params = new URLSearchParams();
    if (cat && cat !== 'All') params.append('category', cat);
    if (search) params.append('search', search);
    return api.get(`/stories?${params.toString()}`);
  },
  getStory: (id) => api.get(`/stories/${id}`),
  getChapter: (sid, cid) => api.get(`/stories/${sid}/chapters/${cid}`),
  getComments: (sid) => api.get(`/stories/${sid}/comments`),
  postComment: (sid, content) => api.post(`/stories/${sid}/comments`, { content }),
  toggleLike: (sid) => api.post(`/stories/${sid}/like`, {}),
  getUserInfo: () => api.get('/user/me'),
  registerAuthor: () => api.post('/author/register', {}),
  createStory: (data) => api.post('/stories', data),
  getPendingStories: () => api.get('/admin/pending'),
  approveStory: (id) => api.post(`/admin/approve/${id}`, {}),
};

// --- STORE ---
const useAuthStore = create((set) => ({
  user: null,
  checkAuth: async () => {
    try {
      const platformRes = await fetch('https://backend.youware.com/__user_info__');
      const platformData = await platformRes.json();
      if (platformData.code === 0 && platformData.data.display_name) {
        const backendUser = await api.getUserInfo();
        set({ user: { ...platformData.data, role: backendUser.role || 'user', id: backendUser.id } });
      } else {
        set({ user: null });
      }
    } catch (e) { set({ user: null }); }
  }
}));

// --- COMPONENTS ---

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const menuItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: BookOpen, label: 'Thư viện', path: '/library' },
    { icon: History, label: 'Lịch sử', path: '/history' },
    { icon: List, label: 'Thể loại', path: '/categories' },
  ];
  if (user) menuItems.push({ icon: Settings, label: 'Quản lý', path: '/dashboard' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/50 z-40" />
          <motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl flex flex-col">
            <div className="p-5 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="font-bold text-xl">MeoMapOnline</h2>
              <button onClick={onClose}><X /></button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map(item => (
                <Link key={item.path} to={item.path} onClick={onClose} className={`flex items-center gap-3 p-3 rounded-xl ${location.pathname===item.path ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
                  <item.icon size={20} /> {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t">
              {user ? (
                <div className="flex items-center gap-3">
                  <img src={user.photo_url} className="w-8 h-8 rounded-full" />
                  <div><p className="font-bold text-sm">{user.display_name}</p><p className="text-xs text-gray-500 capitalize">{user.role}</p></div>
                </div>
              ) : (
                <button className="flex items-center gap-2 w-full p-2 bg-gray-100 rounded-lg"><LogIn size={16} /> Đăng nhập</button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const StoryCard = ({ story, onClick }) => (
  <div onClick={() => onClick(story.id)} className="bg-white rounded-xl shadow-sm overflow-hidden border active:scale-95 transition-transform">
    <div className="relative aspect-[2/3]">
      <img src={story.cover_url} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs">👁️ {story.views}</div>
    </div>
    <div className="p-3">
      <h3 className="font-bold text-sm line-clamp-1">{story.title}</h3>
      <p className="text-xs text-gray-500">{story.author_name}</p>
    </div>
  </div>
);

// --- PAGES ---

const LibraryPage = () => {
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  useEffect(() => { checkAuth(); loadStories(); }, [search, cat]);
  const loadStories = async () => {
    try { const data = await api.getStories(cat, search); setStories(data); } catch(e){}
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b p-4 flex justify-between z-10">
        <div className="flex gap-3 items-center"><button onClick={() => setSidebarOpen(true)}><Menu /></button><h1 className="font-bold text-blue-600">MeoMapOnline</h1></div>
      </header>
      <div className="p-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm truyện..." className="w-full p-2 border rounded-xl mb-4" />
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {['All', 'Ngôn tình', 'Đam mỹ', 'Viễn tưởng', 'Kinh dị'].map(c => (
            <button key={c} onClick={()=>setCat(c)} className={`px-4 py-1 rounded-full text-xs whitespace-nowrap ${cat===c?'bg-blue-600 text-white':'bg-white border'}`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {stories.map(s => <StoryCard key={s.id} story={s} onClick={id => navigate(`/story/${id}`)} />)}
        </div>
      </div>
    </div>
  );
};

const StoryReaderPage = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCmt, setNewCmt] = useState('');
  const { user } = useAuthStore();

  useEffect(() => { if(id) { api.getStory(id).then(setStory); api.getComments(id).then(setComments); } }, [id]);
  useEffect(() => { if(id && chapterId) api.getChapter(id, chapterId).then(setChapter); else setChapter(null); }, [id, chapterId]);

  if (!story) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 bg-white border-b p-4 flex gap-3 z-10">
        <button onClick={() => navigate('/library')}><ChevronLeft /></button>
        <h1 className="font-bold truncate flex-1">{chapter ? chapter.title : story.title}</h1>
      </header>
      <div className="max-w-lg mx-auto p-4">
        {chapter ? (
          <div>
            <div className="prose mb-8 whitespace-pre-wrap">{chapter.content}</div>
            <div className="flex gap-4">
              <button onClick={() => navigate(`/story/${id}`)} className="flex-1 py-3 bg-gray-100 rounded-xl">Mục lục</button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <img src={story.cover_url} className="w-32 h-48 object-cover mx-auto rounded-lg shadow mb-4" />
            <h2 className="text-2xl font-bold mb-2">{story.title}</h2>
            <p className="text-gray-500 mb-4">{story.author_name}</p>
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={() => api.toggleLike(id)} className="px-6 py-2 border rounded-full flex gap-2 items-center"><Heart size={16} /> Thích</button>
            </div>
            <div className="text-left space-y-2">
              <h3 className="font-bold">Danh sách chương</h3>
              {story.chapters_list?.map(c => (
                <Link key={c.id} to={`/story/${id}/chapter/${c.id}`} className="block p-3 bg-gray-50 rounded-xl">{c.title}</Link>
              ))}
            </div>
            <div className="mt-8 text-left">
              <h3 className="font-bold mb-4">Bình luận</h3>
              {user && (
                <div className="flex gap-2 mb-4">
                  <input value={newCmt} onChange={e=>setNewCmt(e.target.value)} className="flex-1 border rounded-full px-4" placeholder="Viết bình luận..." />
                  <button onClick={()=>{api.postComment(id, newCmt).then(()=>{setNewCmt(''); api.getComments(id).then(setComments)})}} className="bg-blue-600 text-white px-4 rounded-full">Gửi</button>
                </div>
              )}
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-50 p-3 rounded-xl">
                    <p className="font-bold text-xs">{c.display_name}</p>
                    <p className="text-sm">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({title:'', desc:'', cover:'', cat:'Ngôn tình'});
  
  useEffect(() => { if(user?.role==='admin') api.getPendingStories().then(setPending); }, [user]);

  const createStory = () => {
    api.createStory({title:form.title, description:form.desc, cover_url:form.cover, categories:[form.cat]})
      .then(()=>alert('Đã đăng! Chờ duyệt.'));
  };

  if (!user) return <div>Vui lòng đăng nhập</div>;

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="font-bold text-xl mb-6">Dashboard ({user.role})</h1>
      
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <h3 className="font-bold mb-4">Đăng truyện mới</h3>
        <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Tên truyện" className="w-full p-2 border rounded mb-2" />
        <input value={form.cover} onChange={e=>setForm({...form, cover:e.target.value})} placeholder="Link ảnh bìa" className="w-full p-2 border rounded mb-2" />
        <button onClick={createStory} className="w-full py-2 bg-blue-600 text-white rounded font-bold">Đăng ngay</button>
      </div>

      {user.role === 'admin' && (
        <div>
          <h3 className="font-bold mb-4">Duyệt truyện</h3>
          {pending.map(s => (
            <div key={s.id} className="bg-white p-3 rounded-xl shadow-sm flex justify-between items-center mb-2">
              <span>{s.title}</span>
              <button onClick={()=>api.approveStory(s.id).then(()=>api.getPendingStories().then(setPending))} className="bg-green-500 text-white px-3 py-1 rounded">Duyệt</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/library" />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/story/:id" element={<StoryReaderPage />} />
        <Route path="/story/:id/chapter/:chapterId" element={<StoryReaderPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
