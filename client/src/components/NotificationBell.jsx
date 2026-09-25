/**
 * client/src/components/NotificationBell.jsx
 * Top-bar notification inbox: unread badge (polled) + dropdown list.
 * Consumes /api/notifications (list, unread-count, mark read, mark all read).
 */
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../api';
import { Bell, CheckCheck, Inbox } from 'lucide-react';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Lightweight badge poll every 30s.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsAPI.unreadCount().then(r => r.data.data.unreadCount),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleClick = (n) => {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        id="btn-notifications"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        className="relative w-9 h-9 rounded-lg btn-ghost flex items-center justify-center"
      >
        <Bell className="w-4 h-4 text-theme-text/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 max-w-[90vw] origin-top-right glass rounded-xl shadow-2xl border border-theme-border/60 focus:outline-none z-50 overflow-hidden">
          <NotificationDropdownContent 
            unreadCount={unreadCount} 
            markAllRead={() => markAllRead.mutate()} 
          />
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function NotificationDropdownContent({ unreadCount, markAllRead }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsAPI.list({ limit: 12 }).then(r => r.data.data),
    // Fetch only when mounted (when menu is open). No need to poll.
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleClick = (n) => {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.link) navigate(n.link);
  };

  const items = listData?.items || [];

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/50">
        <span className="text-sm font-semibold text-theme-text">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-theme-accent hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
            <Inbox className="w-8 h-8 text-theme-text0 opacity-50" />
            <p className="text-sm text-theme-text0">You're all caught up.</p>
          </div>
        ) : (
          items.map((n) => (
            <Menu.Item key={n._id}>
              {({ close }) => (
                <button
                  onClick={() => {
                    handleClick(n);
                    close();
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-theme-border/30 hover:bg-theme-surface/60 transition-colors flex gap-3 ${
                    n.isRead ? '' : 'bg-theme-accent/5'
                  }`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-theme-accent'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-theme-text truncate">{n.title}</span>
                    <span className="block text-xs text-theme-text0 line-clamp-2 mt-0.5">{n.body}</span>
                    <span className="block text-[10px] text-theme-text0 mt-1">{timeAgo(n.sentAt)}</span>
                  </span>
                </button>
              )}
            </Menu.Item>
          ))
        )}
      </div>
    </>
  );
}
