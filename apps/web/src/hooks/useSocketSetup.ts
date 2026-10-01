import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';
import { tokenStore } from '../lib/token-store';

export const useSocketSetup = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const setup = () => {
      const token = tokenStore.getAccess();
      if (!token) return;

      connectSocket();
      const socket = getSocket();

      const onAttendanceUpdated = () => {
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      };

      const onNotificationNew = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };

      socket.off('attendance.updated', onAttendanceUpdated);
      socket.off('notification.new', onNotificationNew);

      socket.on('attendance.updated', onAttendanceUpdated);
      socket.on('notification.new', onNotificationNew);

      return () => {
        socket.off('attendance.updated', onAttendanceUpdated);
        socket.off('notification.new', onNotificationNew);
      };
    };

    let cleanup = setup();

    const unsub = tokenStore.subscribe(() => {
      if (!active) return;
      if (cleanup) cleanup();
      cleanup = setup();
    });

    return () => {
      active = false;
      unsub();
      if (cleanup) cleanup();
      disconnectSocket();
    };
  }, [queryClient]);
};
