import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, CircleAlert, CircleCheck, Info, Trash2, TriangleAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useNotificationActions, useNotifications, type AppNotification } from "@/lib/workspace";

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const;

const TONE = {
  success: "text-emerald-300",
  error: "text-red-300",
  warning: "text-amber-300",
  info: "text-sky-300",
} as const;

export function NotificationCenter() {
  const { data: items = [] } = useNotifications();
  const { markAllRead, markRead, clearAll } = useNotificationActions();
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-brand px-1 text-[9px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,24rem)] rounded-2xl border-white/10 bg-background/85 p-0 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllRead} disabled={!unread}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Read all
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Clear notifications" onClick={clearAll} disabled={!items.length}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-muted-foreground">
              You're all caught up. Job updates appear here.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => (
                <Row key={n.id} n={n} onRead={() => markRead(n.id)} />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({ n, onRead }: { n: AppNotification; onRead: () => void }) {
  const Icon = ICONS[n.level] ?? Info;
  const body = (
    <div className="flex gap-3 px-4 py-3 transition hover:bg-white/[0.04]">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[n.level] ?? TONE.info}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-medium">{n.title}</span>
          {!n.read && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />}
        </div>
        {n.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.body}</p>}
        <span className="mt-1 block text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </span>
      </div>
      {!n.read && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRead();
          }}
          aria-label="Mark as read"
          className="self-start rounded-md p-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <li>
      {n.recording_id ? (
        <Link
          to={n.kind === "transcript" ? "/dashboard/transcription" : "/dashboard/summary"}
          search={{ id: n.recording_id } as never}
          onClick={onRead}
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}