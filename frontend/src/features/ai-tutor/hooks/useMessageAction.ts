import { useActionState } from 'react';
import { sendMessageAction } from '../actions/sendMessage';
import type { MessageActionState } from '../actions/types';

const DEFAULT_STATE: MessageActionState = {
  success: false,
  error: null,
  isLoading: false,
  message: null,
};

export function useMessageAction(initialState?: MessageActionState) {
  const [state, sendMessage, isPending] = useActionState(
    sendMessageAction,
    initialState || DEFAULT_STATE
  );

  return {
    state,
    sendMessage,
    isPending,
  };
}