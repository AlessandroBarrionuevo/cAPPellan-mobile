export const ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  CALLS_REQUEST: '/calls/request',
  CALLS_ASSIGNED: '/calls/assigned',
  CALLS_LIST: '/calls',
  CALL_DETAIL: (id: number) => `/calls/${id}`,
  CALL_END: (id: number) => `/calls/${id}/end`,
  CALL_REPORT: (id: number) => `/calls/${id}/report`,
  CALLS_RECONNECT: (id: number) => `/calls/${id}/reconnect`,
  CALLS_HEARTBEAT: (id: number) => `/calls/${id}/heartbeat`,
  CALLS_MESSAGES: (id: number) => `/calls/${id}/messages`,
  PRAYERS: '/prayers',
  PRAYER_PRAY: (id: number) => `/prayers/${id}/pray`,
  CHAPLAIN_STATUS: (id: number) => `/chaplains/${id}/status`,
  CALLS_SSE_ASSIGNED: (token?: string | null) =>
    token ? `/calls/sse/assigned?token=${encodeURIComponent(token)}` : '/calls/sse/assigned',
  CALL_SSE_STATUS: (id: number, clientToken?: string | null) =>
    clientToken ? `/calls/${id}/sse?clientToken=${encodeURIComponent(clientToken)}` : `/calls/${id}/sse`,
  USERS: '/users',
  USER_DETAIL: (id: number) => `/users/${id}`,
  CONTENTS: '/contents',
  CONTENT_DETAIL: (id: number) => `/contents/${id}`,
  CONTENT_LIKE: (id: number) => `/contents/${id}/like`,
  BLOGS: '/blogs',
  BLOG_DETAIL: (idOrSlug: number | string) => `/blogs/${idOrSlug}`,
  BLOG_LIKE: (id: number) => `/blogs/${id}/like`,
  BLOG_SHARE: (id: number) => `/blogs/${id}/share`,
  BLOG_COMMENTS: (id: number) => `/blogs/${id}/comments`,
  BLOG_COMMENT_DELETE: (commentId: number) => `/blogs/comments/${commentId}`,
  BLOG_TAGS: '/blogs/tags',
  BLOG_DRAFT: '/blogs/draft',
  BLOG_DRAFT_PUBLISH: '/blogs/draft/publish',
  // Section 10: Biblia PDDPT & Perlitas
  PERLITA_DEL_DIA: (date?: string) =>
    date ? `/api/perlita/del-dia?date=${encodeURIComponent(date)}` : '/api/perlita/del-dia',
  PERLITA_RANDOM: '/api/perlita/random',
  BIBLE_METADATA: '/api/bible/metadata',
  BIBLE_BOOKS: '/api/bible/books',
  BIBLE_BOOK: (book: string) => `/api/bible/books/${encodeURIComponent(book)}`,
  BIBLE_CHAPTER: (book: string, chapter: number) =>
    `/api/bible/books/${encodeURIComponent(book)}/chapters/${chapter}`,
  BIBLE_VERSE: (book: string, chapter: number, verse: string) =>
    `/api/bible/books/${encodeURIComponent(book)}/chapters/${chapter}/verses/${encodeURIComponent(verse)}`,
  BIBLE_SEARCH: (q: string, testament?: string, limit = 50) => {
    let url = `/api/bible/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    if (testament) url += `&testament=${encodeURIComponent(testament)}`;
    return url;
  },
  BIBLE_DOWNLOAD: '/api/bible/download',
  // Section 5: Prayer Comments
  PRAYER_COMMENTS: (prayerId: number) => `/prayers/${prayerId}/comments`,
  // Section 7: Chaplains & Profiles
  CHAPLAINS_TEAM: '/chaplains/team',
  CHAPLAIN_PROFILE: (id: number) => `/chaplains/${id}/profile`,
  PROFILE_CHAPLAIN: '/profiles/chaplain',
  PROFILE_BASIC_ME: '/profiles/basic/me',
} as const;
