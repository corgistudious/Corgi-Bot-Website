import {Routes,Route} from 'react-router-dom';
import Layout from './components/Layout';
import RequireStaff from './components/RequireStaff';
import EventShop from './pages/EventShop';
import SpinWheel from './pages/SpinWheel';
import Rankings from './pages/Rankings';
import MarketHub from './pages/MarketHub';
import Home from './pages/Home';
import Commands from './pages/Commands';
import Premium from './pages/Premium';
import Support from './pages/Support';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Forum from './pages/Forum';
import ForumTopic from './pages/ForumTopic';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AuthCallback from './pages/AuthCallback';
import Admin from './pages/Admin';
import MarketplaceReview from './pages/MarketplaceReview';
import NotFound from './pages/NotFound';
import Guide from './pages/Guide';
import Mailbox from './pages/Mailbox';
export default function App(){return <Layout><Routes>
<Route path="/" element={<Home/>}/><Route path="/commands" element={<Commands/>}/><Route path="/creator" element={<MarketHub/>}/><Route path="/events" element={<EventShop/>}/><Route path="/spin-wheel" element={<SpinWheel/>}/><Route path="/rankings" element={<Rankings/>}/><Route path="/mail" element={<Mailbox/>}/><Route path="/news" element={<News/>}/><Route path="/news/:slug" element={<NewsArticle/>}/><Route path="/forum" element={<Forum/>}/><Route path="/forum/:id" element={<ForumTopic/>}/><Route path="/premium" element={<Premium/>}/><Route path="/marketplace" element={<MarketHub/>}/><Route path="/ads" element={<MarketHub/>}/><Route path="/marketplace/review" element={<RequireStaff><MarketplaceReview/></RequireStaff>}/><Route path="/support" element={<Support/>}/><Route path="/guide" element={<Guide/>}/><Route path="/about" element={<About/>}/><Route path="/terms" element={<Terms/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/login" element={<Login/>}/><Route path="/profile" element={<Profile/>}/><Route path="/auth/callback" element={<AuthCallback/>}/><Route path="/admin" element={<RequireStaff level="admin"><Admin/></RequireStaff>}/><Route path="*" element={<NotFound/>}/>
</Routes></Layout>}
