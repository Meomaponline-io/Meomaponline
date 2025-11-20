import React, { useState, useEffect } from 'react';
import { create } from 'zustand';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Menu, Search, Bell, X, Book, History, List, Home, LogIn, User, Settings, Filter, Heart, Eye, BookOpen, ChevronLeft, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- DỮ LIỆU MẪU ---
const MOCK_STORIES = [
  { id: '1', title: 'Bá Đạo Tổng Tài Yêu Tôi', author: 'Tiểu Mèo', cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300', categories: ['Ngôn tình'], views: 120500, chapters: 45, description: 'Câu chuyện tình yêu lãng mạn...' },
  { id: '2', title: 'Mạt Thế Chi Vương', author: 'Hắc Hổ', cover_url: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=300', categories: ['Viễn tưởng'], views: 89000, chapters: 120, description: 'Sinh tồn trong thế giới khắc nghiệt...' },
  { id: '3', title: 'Tu Tiên Truyện', author: 'Bạch Long', cover_url: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=300', categories: ['Tiên hiệp'], views: 250000, chapters: 300, description: 'Hành trình tu tiên đầy gian nan...' },
];

const CATEGORIES = ['All', 'Ngôn tình', 'Viễn tưởng', 'Tiên hiệp', 'Kinh dị', 'Hài hước'];

// --- API GIẢ LẬP ---
const api = {
  getStories: (cat: any, search: any) => {
    let res = [...MOCK_STORIES];
    if (cat && cat !== 'All') res = res.filter(s => s.categories.includes(cat));
    if (search) res = res.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    return Promise.resolve(res);
  },
  getStory: (id: any) => Promise.resolve(MOCK_STORIES.find(s => s.id === id) || MOCK_STORIES[0]),
  getChapter: (sid: any, cid: any) => Promise.resolve({ id: cid, title: `Chương ${cid}`, content: `Nội dung chương ${cid} của truyện...\\n\\n(Đây là dữ liệu mẫu để bạn đọc thử)` }),
  getComments: () => Promise.resolve([{ id: 1, display_name: 'Độc giả vui tính', content: 'Truyện hay quá!', created_at: Date.now() / 1000 }]),
  postComment: () => Promise.resolve({}),
  toggleLike: () => Promise.resolve({ liked: true }),
};

// --- QUẢN LÝ TRẠNG THÁI (Đã sửa lỗi sập web) ---
const getSafeUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};

const useAuthStore = create<any>((set: any) => ({
  user: getSafeUser(),
  login: () => {
    const fakeUser = { id: 'admin', display_name: 'Admin Test', photo_url: 'https://ui-avatars.com/api/?name=Admin', role: 'admin' };
    localStorage.setItem('user', JSON.stringify(fakeUser));
    set({ user: fakeUser });
    window.location.reload();
  },
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
    window.location.reload();
  }
}));

// --- COMPONENTS ---
const Header = ({ onMenuClick }: any) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between safe-top">
    <div className="flex items-center gap-3">
      <button onClick={onMenuClick}><Menu size={24} /></button>
      <h1 className="font-bold text-lg text-blue-600">MeoMapOnline</h1>
    </div>
    <div className="flex gap-2"><Search size={22} /><Bell size={22} /></div>
  </header>
);

const Sidebar = ({ isOpen, onClose }: any) => {
  const { user, login, logout } = useAuthStore();
  const menuItems = [{ icon: Home, label: 'Trang chủ', path: '/' }, { icon: Book, label: 'Thư viện', path: '/library' }];
  if (user) menuItems.push({ icon: Settings, label: 'Quản lý', path: '/dashboard' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-40" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 p-4 flex flex-col">
            <div className="flex justify-between mb-6"><h2 className="font-bold text-xl">Menu</h2><button onClick={onClose}><X size={24} /></button></div>
            <nav className="flex-1 space-y-2">
              {menuItems.map(item => (
                <Link key={item.path} to={item.path} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl">
                  <item.icon size={20} /><span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t pt-4">
              {user ? (
                <div className="flex items-center gap-3 p-2">
                  <img src={user.photo_url} className="w-10 h-10 rounded-full" alt="User" />
                  <div className="flex-1"><p className="font-medium">{user.display_name}</p><button onClick={logout} className="text-red-500 text-sm flex items-center gap-1"><LogOut size={14} /> Đăng xuất</button></div>
                </div>
              ) : (
                <button onClick={login} className="w-full bg-blue-600 text-white py-2 rounded-xl flex items-center justify-center gap-2"><LogIn size={18} /> Đăng nhập</button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const StoryCard = ({ story }: any) => (
  <Link to={`/story/${story.id}`} className="block bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="aspect-[2/3] relative">
      <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center gap-1 text-white/90 text-xs"><Eye size={12} /> {story.views.toLocaleString()}</div>
      </div>
    </div>
    <div className="p-2">
      <h3 className="font-medium text-sm line-clamp-2 h-10">{story.title}</h3>
      <p className="text-xs text-gray-500 mt-1">{story.author}</p>
    </div>
  </Link>
);

// --- PAGES ---
const LibraryPage = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { api.getStories(activeCat, search).then(setStories); }, [activeCat, search]);

  return (
    <div className="p-4 pb-20">
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeCat === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stories.map(story => <StoryCard key={story.id} story={story} />)}
      </div>
    </div>
  );
};

const StoryReaderPage = () => {
  const { id, chapterId } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) api.getStory(id).then(setStory);
    if (id && chapterId) api.getChapter(id, chapterId).then(setChapter);
  }, [id, chapterId]);

  if (!story) return <div className="p-10 text-center">Đang tải...</div>;

  if (chapterId && chapter) {
    return (
      <div className="bg-[#f5f5dc] min-h-screen text-gray-800">
        <div className="sticky top-0 bg-[#f5f5dc] border-b border-gray-300 p-3 flex items-center justify-between shadow-sm">
          <Link to={`/story/${id}`}><ChevronLeft /></Link>
          <h2 className="font-medium text-sm truncate px-2">{chapter.title}</h2>
          <button><Settings size={20} /></button>
        </div>
        <div className="p-4 text-lg leading-relaxed whitespace-pre-wrap font-serif text-justify">
          {chapter.content}
        </div>
        <div className="p-4 flex justify-between gap-4 pb-10">
          <button className="flex-1 py-2 bg-gray-200 rounded-lg">Trước</button>
          <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Sau</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="relative h-64">
        <img src={story.cover_url} className="w-full h-full object-cover blur-sm opacity-50" />
        <div className="absolute inset-0 flex items-end p-4 gap-4 bg-gradient-to-t from-white via-transparent">
          <img src={story.cover_url} className="w-28 h-40 object-cover rounded-lg shadow-lg" />
          <div className="flex-1 mb-2">
            <h1 className="font-bold text-xl line-clamp-2">{story.title}</h1>
            <p className="text-blue-600 font-medium">{story.author}</p>
            <div className="flex gap-2 mt-2 text-xs text-gray-500">
              <span>{story.categories[0]}</span> • <span>{story.chapters} chương</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="flex gap-3">
          <Link to={`/story/${id}/chapter/1`} className="flex-1 bg-blue-600 text-white py-2.5 rounded-full font-medium flex items-center justify-center gap-2">
            <BookOpen size={18} /> Đọc ngay
          </Link>
          <button onClick={() => setIsLiked(!isLiked)} className={`p-2.5 rounded-full border ${isLiked ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-600'}`}>
            <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Giới thiệu</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{story.description}</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Danh sách chương</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(c => (
              <Link key={c} to={`/story/${id}/chapter/${c}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Chương {c}</span>
                <span className="text-xs text-gray-400">Vừa xong</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Quản lý</h1>
    <p>Khu vực dành cho Admin và Tác giả (Đang phát triển...)</p>
  </div>
);

// --- MAIN APP ---
function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isReading = location.pathname.includes('/chapter/');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-safe">
      {!isReading && <Header onMenuClick={() => setIsMenuOpen(true)} />}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <Routes>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/story/:id" element={<StoryReaderPage />} />
        <Route path="/story/:id/chapter/:chapterId" element={<StoryReaderPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/library" />} />
      </Routes>
    </div>
  );
}

export default App;
