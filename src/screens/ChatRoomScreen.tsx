import React from 'react';
import { useAuthStore } from '../lib/stores/auth';
import { useCallStore } from '../lib/stores/call';
import { useChaplainStore } from '../lib/stores/chaplain';
import ChatRoomView from '../components/chat/ChatRoomView';

interface ChatRoomScreenProps {
  onChatEnded: () => void;
  onRequestReport?: (sessionId: number) => void;
}

export default function ChatRoomScreen({
  onChatEnded,
  onRequestReport,
}: ChatRoomScreenProps) {
  const currentSession = useCallStore((state) => state.currentSession);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const user = useAuthStore((state) => state.user);

  const isChaplainRole =
    user?.role === 'CHAPLAIN' ||
    user?.role === 'CHAPLAIN_LEADER' ||
    user?.role === 'SUPERUSER';

  // For chaplains, assignedCall is the authoritative incoming session.
  // For basic users, currentSession is the requested session.
  const session = isChaplainRole
    ? (assignedCall || currentSession)
    : (currentSession || assignedCall);

  const sessionId = session?.sessionId;
  const clientToken = session?.clientToken || undefined;

  return (
    <ChatRoomView
      key={sessionId ? `chat-room-${sessionId}` : 'empty-room'}
      sessionId={sessionId}
      clientToken={clientToken}
      isChaplainMode={isChaplainRole}
      chaplainName="Capellán Daniel Godoy"
      comradeName="Camarada en Consulta"
      onChatEnded={onChatEnded}
      onRequestReport={onRequestReport}
    />
  );
}
