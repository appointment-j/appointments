import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

/**
 * Request interceptor
 * - يضيف Authorization لو موجود
 * - يضمن وجود headers object
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  // تأكد إن headers موجودة
  config.headers = config.headers ?? {};

  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/**
 * Refresh client (بدون interceptors لتجنب loop)
 */
const refreshClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

/**
 * Response interceptor
 * - يمنع كراش لو السيرفر رجّع 204 أو جسم فاضي
 * - يعالج 401 عبر refresh
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // ✅ حماية من الـ empty responses (204 أو data فاضية)
    if (response.status === 204 || response.data === '' || response.data == null) {
      return { ...response, data: {} };
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;

    // لو ما في response يعني network error / CORS / server down
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest?.url || '';

    // ✅ Logging أوضح (Dev فقط)
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error('API Error:', {
        url,
        status,
        data: error.response.data,
      });
    }

    // Don't retry refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint = typeof url === 'string' && url.includes('/auth/');
    const shouldRefresh = status === 401 && !originalRequest?._retry && !isAuthEndpoint;

    if (shouldRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await refreshClient.post('/auth/refresh', {});
        const accessToken = (refreshRes.data as any)?.accessToken;

        if (!accessToken) {
          // هذا يعتبر فشل refresh منطقي => 401
          localStorage.removeItem('accessToken');
          processQueue(new Error('Refresh did not return accessToken'), null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Survey API function
export const createSurvey = async (data: any) => {
  return api.post('/appointments/survey', data);
};

// WhatsApp utility function
export const openWhatsApp = (phone: string, message: string) => {
  // Convert phone number to international format if needed
  let formattedPhone = phone;
  if (phone.startsWith('07')) {
    formattedPhone = '962' + phone.substring(1);
  } else if (phone.startsWith('+962')) {
    formattedPhone = phone.substring(1);
  } else if (!phone.startsWith('962')) {
    // If it doesn't start with country code, assume it's a local Jordan number
    formattedPhone = phone.startsWith('7') ? '962' + phone : phone;
  }
  
  // Encode the message
  const encodedMessage = encodeURIComponent(message);
  
  // Open WhatsApp
  window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
};

export default api;
