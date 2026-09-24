import { useEffect, useMemo, useState } from 'react';
import {
  FileText, LifeBuoy, MessagesSquare, Plus, RefreshCcw,
  Send, ShieldCog, Terminal, Trash2, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate, profileMap, roleAtLeast, slugify } from '../lib/community';
import Avatar from '../components/Avatar';

const tabs = [
  ['forum', 'Forum', MessagesSquare],
  ['tickets', 'Tickets', LifeBuoy],
  ['news', 'Tin tức', FileText],
  ['commands', 'Lệnh', Terminal],
];

const emptyArticle = { title: '', slug: '', tag: 'UPDATE', excerpt: '', content: '', status: 'draft' };
const emptyCommand = { name: '', group_name: 'Khác', description: '', usage: '' };

export default function Admin() {
  const { user, profile } = useAuth();
  const isAdmin = roleAtLeast(profile?.role, 'admin');

  const [tab, setTab] = useState('forum');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [topics, setTopics] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [articles, setArticles] = useState([]);
  const [commands, setCommands] = useState([]);

  const [articleForm, setArticleForm] = useState(emptyArticle);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [commandForm, setCommandForm] = useState(emptyCommand);

  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketAuthors, setTicketAuthors] = useState({});
  const [ticketReply, setTicketReply] = useState('');

  const allowedTabs = useMemo(
    () => tabs
      .filter(([key]) => !['news', 'commands'].includes(key) || isAdmin),
    [isAdmin]
  );

  async function load() {
    setLoading(true);
    setNotice('');
    try {
      if (tab === 'forum') {
        const { data, error } = await supabase
          .from('forum_topics')
          .select('*, profiles:author_id(display_name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setTopics(data || []);
      }

      if (tab === 'tickets') {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*, profiles:user_id(display_name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setTickets(data || []);
      }

      if (tab === 'news' && isAdmin) {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setArticles(data || []);
      }

      if (tab === 'commands' && isAdmin) {
        const { data, error } = await supabase
          .from('bot_commands')
          .select('*')
          .order('sort_order');
        if (error) throw error;
        setCommands(data || []);
      }

    } catch (error) {
      setNotice(error.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab]);

  async function toggleTopic(topic, key) {
    const { error } = await supabase.from('forum_topics').update({ [key]: !topic[key] }).eq('id', topic.id);
    if (error) setNotice(error.message); else load();
  }

  async function deleteTopic(id) {
    if (!window.confirm('Xóa chủ đề này?')) return;
    const { error } = await supabase.from('forum_topics').delete().eq('id', id);
    if (error) setNotice(error.message); else load();
  }

  async function ticketStatus(id, status) {
    const { error } = await supabase.from('support_tickets').update({
      status,
      closed_at: status === 'closed' ? new Date().toISOString() : null,
    }).eq('id', id);
    if (error) setNotice(error.message);
    else {
      if (activeTicket?.id === id) setActiveTicket((value) => ({ ...value, status }));
      load();
    }
  }

  async function openTicket(ticket) {
    setActiveTicket(ticket);
    setTicketReply('');
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at');
    if (error) { setNotice(error.message); return; }
    setTicketMessages(data || []);
    setTicketAuthors(await profileMap((data || []).map((message) => message.author_id)));
  }

  async function sendTicketReply(event) {
    event.preventDefault();
    if (!activeTicket || !ticketReply.trim()) return;
    const { data, error } = await supabase.from('support_messages').insert({
      ticket_id: activeTicket.id,
      author_id: user.id,
      body: ticketReply.trim(),
    }).select('*').single();
    if (error) { setNotice(error.message); return; }
    setTicketMessages((items) => [...items, data]);
    setTicketAuthors((items) => ({ ...items, [user.id]: profile }));
    setTicketReply('');
  }

  function startEditArticle(article) {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      slug: article.slug,
      tag: article.tag,
      excerpt: article.excerpt,
      content: article.content,
      status: article.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelArticleEdit() {
    setEditingArticleId(null);
    setArticleForm(emptyArticle);
  }

  async function saveArticle(event) {
    event.preventDefault();
    const slug = articleForm.slug.trim() || slugify(articleForm.title);
    const existing = editingArticleId ? articles.find((item) => item.id === editingArticleId) : null;
    const payload = {
      ...articleForm,
      slug,
      author_id: existing?.author_id || profile.id,
      published_at: articleForm.status === 'published'
        ? (existing?.published_at || new Date().toISOString())
        : null,
    };

    const result = editingArticleId
      ? await supabase.from('articles').update(payload).eq('id', editingArticleId)
      : await supabase.from('articles').insert(payload);

    if (result.error) setNotice(result.error.message);
    else {
      setNotice(editingArticleId ? 'Đã cập nhật bài viết.' : 'Đã tạo bài viết.');
      cancelArticleEdit();
      load();
    }
  }

  async function articleStatus(article, status) {
    const { error } = await supabase.from('articles').update({
      status,
      published_at: status === 'published' ? (article.published_at || new Date().toISOString()) : null,
    }).eq('id', article.id);
    if (error) setNotice(error.message); else load();
  }

  async function deleteArticle(id) {
    if (!window.confirm('Xóa bài viết?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) setNotice(error.message); else load();
  }

  async function createCommand(event) {
    event.preventDefault();
    const { error } = await supabase.from('bot_commands').insert({
      ...commandForm,
      name: commandForm.name.startsWith('/') ? commandForm.name : `/${commandForm.name}`,
    });
    if (error) setNotice(error.message);
    else { setCommandForm(emptyCommand); load(); }
  }

  async function toggleCommand(command) {
    const { error } = await supabase.from('bot_commands').update({ enabled: !command.enabled }).eq('id', command.id);
    if (error) setNotice(error.message); else load();
  }

  async function deleteCommand(id) {
    if (!window.confirm('Xóa lệnh khỏi danh mục web?')) return;
    const { error } = await supabase.from('bot_commands').delete().eq('id', id);
    if (error) setNotice(error.message); else load();
  }


  return (
    <section className="section page-section admin-page">
      <div className="admin-head">
        <div>
          <div className="eyebrow"><ShieldCog size={15}/> CONTROL PANEL</div>
          <h1>Quản trị cộng đồng</h1>
          <p className="muted">Quyền hiện tại: <b>{profile?.role}</b>. Mọi thao tác được kiểm soát bằng Supabase RLS.</p>
        </div>
        <button className="btn secondary" onClick={load}><RefreshCcw size={16}/> Làm mới</button>
      </div>

      <div className="admin-tabs">
        {allowedTabs.map(([key, label, Icon]) => (
          <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}>
            <Icon size={16}/>{label}
          </button>
        ))}
      </div>

      {notice && <div className="notice">{notice}</div>}
      {loading && <p className="muted">Đang tải…</p>}

      {tab === 'forum' && (
        <div className="admin-list">
          {topics.map((topic) => (
            <article className="admin-row" key={topic.id}>
              <div>
                <span className="topic-category">{topic.category}</span>
                <h3>{topic.title}</h3>
                <p>{topic.profiles?.display_name || 'Member'} · {formatDate(topic.created_at)}</p>
              </div>
              <div className="admin-actions">
                <button className="small-btn" onClick={() => toggleTopic(topic, 'pinned')}>{topic.pinned ? 'Bỏ ghim' : 'Ghim'}</button>
                <button className="small-btn" onClick={() => toggleTopic(topic, 'locked')}>{topic.locked ? 'Mở khóa' : 'Khóa'}</button>
                <button className="small-btn danger" onClick={() => deleteTopic(topic.id)}><Trash2 size={14}/></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="admin-ticket-grid">
          <div className="admin-list">
            {tickets.map((ticket) => (
              <article className={`admin-row ticket-admin-row ${activeTicket?.id === ticket.id ? 'selected' : ''}`} key={ticket.id}>
                <button className="admin-row-main" onClick={() => openTicket(ticket)}>
                  <span className="topic-category">{ticket.category} · {ticket.priority}</span>
                  <h3>{ticket.subject}</h3>
                  <p>{ticket.profiles?.display_name || 'Member'} · {formatDate(ticket.created_at)}</p>
                </button>
                <div className="admin-actions">
                  <select value={ticket.status} onChange={(event) => ticketStatus(ticket.id, event.target.value)}>
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </article>
            ))}
          </div>

          <div className="ticket-thread admin-ticket-thread">
            {activeTicket ? (
              <>
                <div className="thread-head">
                  <div><span className="eyebrow">#{activeTicket.id.slice(0, 8)}</span><h2>{activeTicket.subject}</h2></div>
                  <button className="modal-close static-close" onClick={() => setActiveTicket(null)}><X size={18}/></button>
                </div>
                <div className="message-list">
                  {ticketMessages.map((message) => (
                    <article className="ticket-message" key={message.id}>
                      <Avatar profile={ticketAuthors[message.author_id]} size={38}/>
                      <div>
                        <div className="comment-head"><strong>{ticketAuthors[message.author_id]?.display_name || 'Member'}</strong><span>{formatDate(message.created_at)}</span></div>
                        <p>{message.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
                {activeTicket.status !== 'closed' && (
                  <form className="reply-form" onSubmit={sendTicketReply}>
                    <textarea rows="3" value={ticketReply} onChange={(event) => setTicketReply(event.target.value)} placeholder="Trả lời với tư cách staff…"/>
                    <button className="btn primary"><Send size={16}/> Gửi trả lời</button>
                  </form>
                )}
              </>
            ) : <div className="empty-state">Chọn ticket để đọc và trả lời.</div>}
          </div>
        </div>
      )}

      {tab === 'news' && isAdmin && (
        <>
          <form className="panel-form admin-editor" onSubmit={saveArticle}>
            <div className="editor-heading">
              <div className="eyebrow"><Plus size={14}/> {editingArticleId ? 'EDIT ARTICLE' : 'NEW ARTICLE'}</div>
              {editingArticleId && <button type="button" className="small-btn" onClick={cancelArticleEdit}>Hủy sửa</button>}
            </div>
            <div className="form-grid">
              <label>Tiêu đề<input required value={articleForm.title} onChange={(event) => setArticleForm({ ...articleForm, title: event.target.value })}/></label>
              <label>Slug<input value={articleForm.slug} onChange={(event) => setArticleForm({ ...articleForm, slug: event.target.value })} placeholder="tự tạo nếu để trống"/></label>
            </div>
            <div className="form-grid">
              <label>Tag<input value={articleForm.tag} onChange={(event) => setArticleForm({ ...articleForm, tag: event.target.value })}/></label>
              <label>Trạng thái<select value={articleForm.status} onChange={(event) => setArticleForm({ ...articleForm, status: event.target.value })}><option value="draft">draft</option><option value="published">published</option></select></label>
            </div>
            <label>Mô tả<textarea rows="2" required value={articleForm.excerpt} onChange={(event) => setArticleForm({ ...articleForm, excerpt: event.target.value })}/></label>
            <label>Nội dung<textarea rows="9" required value={articleForm.content} onChange={(event) => setArticleForm({ ...articleForm, content: event.target.value })}/></label>
            <button className="btn primary">{editingArticleId ? 'Lưu thay đổi' : 'Tạo bài'}</button>
          </form>
          <div className="admin-list">
            {articles.map((article) => (
              <article className="admin-row" key={article.id}>
                <div><span className="topic-category">{article.tag} · {article.status}</span><h3>{article.title}</h3><p>{article.slug} · {formatDate(article.created_at)}</p></div>
                <div className="admin-actions">
                  <button className="small-btn" onClick={() => startEditArticle(article)}>Sửa</button>
                  <button className="small-btn" onClick={() => articleStatus(article, article.status === 'published' ? 'draft' : 'published')}>{article.status === 'published' ? 'Ẩn' : 'Đăng'}</button>
                  <button className="small-btn danger" onClick={() => deleteArticle(article.id)}><Trash2 size={14}/></button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {tab === 'commands' && isAdmin && (
        <>
          <form className="panel-form admin-editor" onSubmit={createCommand}>
            <div className="form-grid">
              <label>Tên lệnh<input required value={commandForm.name} onChange={(event) => setCommandForm({ ...commandForm, name: event.target.value })} placeholder="/command"/></label>
              <label>Nhóm<input required value={commandForm.group_name} onChange={(event) => setCommandForm({ ...commandForm, group_name: event.target.value })}/></label>
            </div>
            <label>Mô tả<input required value={commandForm.description} onChange={(event) => setCommandForm({ ...commandForm, description: event.target.value })}/></label>
            <label>Usage<input value={commandForm.usage} onChange={(event) => setCommandForm({ ...commandForm, usage: event.target.value })}/></label>
            <button className="btn primary">Thêm lệnh</button>
          </form>
          <div className="admin-list">
            {commands.map((command) => (
              <article className="admin-row" key={command.id}>
                <div><span className="topic-category">{command.group_name}</span><h3><code>{command.name}</code></h3><p>{command.description}</p></div>
                <div className="admin-actions"><button className="small-btn" onClick={() => toggleCommand(command)}>{command.enabled ? 'Tắt' : 'Bật'}</button><button className="small-btn danger" onClick={() => deleteCommand(command.id)}><Trash2 size={14}/></button></div>
              </article>
            ))}
          </div>
        </>
      )}

   </section>
  );
}
