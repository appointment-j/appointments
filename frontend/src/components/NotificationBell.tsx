import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'BONUS' | 'TARGET' | string;
  isRead: boolean;
  relatedBonusEntryId?: string;
  createdAtUtc: string;
}

type NotificationsResponse =
  | {
      notifications?: Notification[];
      unreadCount?: number;
    }
  | {
      data?: {
        notifications?: Notification[];
        unreadCount?: number;
      };
    };

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const normalize = (payload: NotificationsResponse) => {
    const root = (payload as any)?.data ?? payload ?? {};
    const list = Array.isArray(root.notifications) ? root.notifications : [];
    const unread =
      Number.isFinite(root.unreadCount) ? Number(root.unreadCount) : 0;

    return { list, unread };
  };

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get('/employee/bonuses/notifications');
      const { list, unread } = normalize(response?.data ?? {});
      if (!mountedRef.current) return;
      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      // ✅ لا نكسر UI ولا نزعج المستخدم بتوست دائم مع polling
      if (!mountedRef.current) return;
      setNotifications((prev) => (Array.isArray(prev) ? prev : []));
      setUnreadCount((prev) => (Number.isFinite(prev) ? prev : 0));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/employee/bonuses/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // لا شيء — لا نكسر UI
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/employee/bonuses/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // لا شيء
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('ar-JO') +
      ' ' +
      date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="
          relative p-2 rounded-full
          bg-white
          border border-transparent
          transition
          hover:bg-primary/8
          hover:border-orange-200
          focus:outline-none
          focus:ring-2 focus:ring-primary/30
        "
        aria-label={t('common.notifications')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span
            className="
              absolute top-0 right-0
              inline-flex items-center justify-center
              min-w-[18px] h-[18px]
              px-1
              text-[11px] font-bold leading-none text-white
              transform translate-x-1/2 -translate-y-1/2
              bg-red-500 rounded-full
            "
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 mt-2 w-80
            bg-white
            rounded-2xl
            shadow-[0_18px_40px_rgba(0,0,0,0.10)]
            border border-gray-200
            z-50
            overflow-hidden
          "
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-extrabold text-gray-900">
              {t('common.notifications')}
            </h3>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
              >
                {t('common.markAllAsRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">{t('common.noNotifications')}</p>
                <p className="text-xs text-gray-400 mt-1">
                  سيتم إشعارك عند إضافة مكافأة أو تحديث جديد
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`
                    p-4 border-b border-gray-100
                    transition
                    hover:bg-primary/6
                    ${!n.isRead ? 'bg-primary/5' : 'bg-white'}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4
                        className={`font-bold truncate ${
                          !n.isRead ? 'text-primary' : 'text-gray-900'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 break-words">
                        {n.message}
                      </p>
                      <div className="text-xs text-gray-400 mt-2">
                        {formatDate(n.createdAtUtc)}
                      </div>
                    </div>

                    {!n.isRead && (
                      <span className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {!n.isRead ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        {t('common.markAsRead')}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">تمت القراءة</span>
                    )}

                    {n.relatedBonusEntryId && (
                      <Link
                        to="/employee/bonuses"
                        className="text-sm text-primary hover:underline"
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                          setIsOpen(false);
                        }}
                      >
                        {t('common.view')}
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 text-center bg-white">
            <Link
              to="/employee/bonuses"
              className="text-sm text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              {t('common.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
