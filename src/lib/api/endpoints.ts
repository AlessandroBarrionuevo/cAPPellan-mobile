export const ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  CALLS_REQUEST: '/calls/request',
  CALLS_ASSIGNED: '/calls/assigned',
  CALLS_LIST: '/calls',
  CALL_DETAIL: (id: number) => `/calls/${id}`,
  CALL_END: (id: number) => `/calls/${id}/end`,
  CALL_REPORT: (id: number) => `/calls/${id}/report`,
  CHAPLAIN_STATUS: (id: number) => `/chaplains/${id}/status`,
  USERS: '/users',
  USER_DETAIL: (id: number) => `/users/${id}`,
} as const;
