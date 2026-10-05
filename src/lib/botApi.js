const API_BASE = String(import.meta.env.VITE_CORGI_API_URL || '').replace(/\/$/, '');

export const botApiConfigured = Boolean(API_BASE);
export const botApiBase = API_BASE;

async function request(path, { token, method = 'GET', body, redirect = 'follow' } = {}) {
  if (!API_BASE) throw new Error('BOT_API_NOT_CONFIGURED');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect,
  });
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') || '';
  const payload = type.includes('application/json') ? await response.json().catch(() => ({})) : await response.text();
  if (!response.ok) {
    const code = typeof payload === 'object' ? payload?.error : payload;
    const error = new Error(code || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const botApi = {
  health: () => request('/health'),
  me: (token) => request('/v1/me', { token }),
  shop: () => request('/v1/shop'),
  gifts: () => request('/v1/gifts'),
  giftBuy: (key, quantity, token) => request(`/v1/gifts/${encodeURIComponent(key)}/buy`, { method:'POST', token, body:{quantity} }),
  profileSocial: (id, token) => request(`/v1/profile/${id}`, { token }),
  profileGiftSend: (id, key, message, token) => request(`/v1/profile/${id}/gifts/${encodeURIComponent(key)}/send`, { method:'POST', token, body:{message} }),
  profileGuestbook: (id, message, token) => request(`/v1/profile/${id}/guestbook`, { method:'POST', token, body:{message} }),
  marketplace: () => request('/v1/marketplace'),
  marketplaceMineApproved: (token) => request('/v1/marketplace/mine-approved', { token }),
  marketplaceVotesMine: (token) => request('/v1/marketplace/votes/mine', { token }),
  marketplaceVote: (id, token) => request(`/v1/marketplace/${id}/vote`, { method: 'POST', token }),
  marketplaceBuy: (id, token) => request(`/v1/marketplace/${id}/buy`, { method: 'POST', token }),
  marketplaceSubmit: (data, token) => request('/v1/marketplace/submit', { method: 'POST', token, body: data }),
  creatorMine: (token) => request('/v1/marketplace/creator/mine', { token }),
  creatorSubmit: (data, token) => request('/v1/marketplace/creator/submit', { method: 'POST', token, body: data }),
  marketplaceReviewQueue: (token) => request('/v1/review/marketplace', { token }),
  marketplaceReview: (id, decision, reason, token) => request(`/v1/review/marketplace/${id}`, { method: 'POST', token, body: { decision, reason } }),
  bank: (token) => request('/v1/bank', { token }),
  bankDeposit: (amount, token) => request('/v1/bank/deposit', { method: 'POST', token, body: { amount } }),
  bankWithdraw: (amount, token) => request('/v1/bank/withdraw', { method: 'POST', token, body: { amount } }),
  ads: (placement = '') => request(`/v1/ads${placement ? `?placement=${encodeURIComponent(placement)}` : ''}`),
  adsMine: (token) => request('/v1/ads/mine', { token }),
  adSubmit: (data, token) => request('/v1/ads/submit', { method: 'POST', token, body: data }),
  adCancel: (id, token) => request(`/v1/ads/${id}/cancel`, { method: 'POST', token }),
  adAnalytics: (id, token) => request(`/v1/ads/${id}/analytics`, { token }),
  adImpression: (id) => request(`/v1/ads/${id}/impression`, { method: 'POST' }),
  servers: (token) => request('/v1/servers', { token }),
  serverContext: (id, token) => request(`/v1/servers/${id}/context`, { token }),
  serverConfig: (id, token) => request(`/v1/servers/${id}/config`, { token }),
  updateServerConfig: (id, data, token) => request(`/v1/servers/${id}/config`, { method:'PATCH', token, body:data }),
  clan: (id, token) => request(`/v1/servers/${id}/clan`, { token }),
  createClan: (id, data, token) => request(`/v1/servers/${id}/clan`, { method:'POST', token, body:data }),
  updateClan: (id, data, token) => request(`/v1/servers/${id}/clan`, { method:'PATCH', token, body:data }),
  clanResource: (id, resource, token) => request(`/v1/servers/${id}/clan/${resource}`, { token }),
  clanCreateResource: (id, resource, data, token) => request(`/v1/servers/${id}/clan/${resource}`, { method:'POST', token, body:data }),
  clanUpdateResource: (id, resource, target, data, token) => request(`/v1/servers/${id}/clan/${resource}/${target}`, { method:'PATCH', token, body:data }),
  serverEvents: (id, kind, token) => request(`/v1/servers/${id}/${kind}`, { token }),
  createServerEvent: (id, kind, data, token) => request(`/v1/servers/${id}/${kind}`, { method:'POST', token, body:data }),
  rankings: (token) => request('/v1/rankings?limit=100', { token }),
  eventShop: (token) => request('/v1/event-shop', { token }),
  eventShopExchange: (id, token) => request(`/v1/event-shop/${id}/exchange`, { method:'POST', token }),
  eventTicketBuy: (quantity, token) => request('/v1/event-shop/tickets/buy', { method:'POST', token, body:{quantity} }),
  eventSpin: (token) => request('/v1/event-shop/spin', { method:'POST', token }),
  spinVault: (token) => request('/v1/event-shop/spin-vault', { token }),
  spinVaultClaim: (id, token) => request(`/v1/event-shop/spin-vault/${id}/claim`, { method:'POST', token }),
  spinVaultDelete: (id, token) => request(`/v1/event-shop/spin-vault/${id}/delete`, { method:'POST', token }),
  eventChestOpen: (tier, token) => request(`/v1/event-shop/chests/${tier}/open`, { method:'POST', token }),
  mailbox: (token) => request('/v1/mailbox', { token }),
  mailboxRead: (id, token) => request(`/v1/mailbox/${id}/read`, { method:'POST', token }),
  mailboxClaim: (id, token) => request(`/v1/mailbox/${id}/claim`, { method:'POST', token }),
  mailboxClaimAll: (token) => request('/v1/mailbox/claim-all', { method:'POST', token }),
  clickUrl: (id) => `${API_BASE}/v1/ads/${id}/click`,
};
