import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  DISPLAY_NAME_MAX,
  HANDLE_MAX,
  sanitizeHandle,
  validateProfileIdentity,
} from '@/lib/profile-identity';
import { useAppearance } from '@/store/appearance-context';

type Props = {
  visible: boolean;
  displayName: string;
  handle: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: { displayName: string; handle: string }) => void | Promise<void>;
};

export function EditProfileModal({
  visible,
  displayName,
  handle,
  busy,
  error,
  onClose,
  onSave,
}: Props) {
  const { tokens } = useAppearance();
  const [name, setName] = useState(displayName);
  const [tag, setTag] = useState(handle);
  const [localError, setLocalError] = useState<string | null>(null);
  const [nameFocused, setNameFocused] = useState(true);
  const [handleFocused, setHandleFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(displayName);
    setTag(handle.replace(/^@/, ''));
    setLocalError(null);
    setNameFocused(true);
    setHandleFocused(false);
  }, [displayName, handle, visible]);

  const submit = () => {
    if (busy) return;
    const result = validateProfileIdentity({ displayName: name, handle: tag });
    if (!result.ok) {
      setLocalError(result.message);
      return;
    }
    setLocalError(null);
    onSave({ displayName: result.displayName, handle: result.handle });
  };

  const message = localError ?? error;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scrimWrap}>
        <Pressable accessibilityLabel="Close edit profile" onPress={onClose} style={styles.scrim} />
        <View
          style={[
            styles.card,
            { backgroundColor: tokens.raised, borderColor: tokens.soft },
          ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.text }]}>Edit Profile</Text>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
              <Ionicons color={tokens.text} name="close" size={22} />
            </Pressable>
          </View>

          <Text style={[styles.label, { color: tokens.text }]}>Your Display Name</Text>
          <View
            style={[
              styles.field,
              { backgroundColor: tokens.bg, borderColor: nameFocused ? tokens.red : tokens.soft },
            ]}>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={DISPLAY_NAME_MAX}
              onBlur={() => setNameFocused(false)}
              onChangeText={(value) => setName(value.slice(0, DISPLAY_NAME_MAX))}
              onFocus={() => {
                setNameFocused(true);
                setHandleFocused(false);
              }}
              onSubmitEditing={submit}
              placeholder="Display name"
              placeholderTextColor={tokens.textMuted}
              style={[styles.input, { color: tokens.text }]}
              value={name}
            />
            <Text style={[styles.counter, { color: tokens.textMuted }]}>
              {Math.min(name.length, DISPLAY_NAME_MAX)}/{DISPLAY_NAME_MAX}
            </Text>
          </View>

          <Text style={[styles.label, { color: tokens.text, marginTop: 16 }]}>Your Handle</Text>
          <View
            style={[
              styles.field,
              { backgroundColor: tokens.bg, borderColor: handleFocused ? tokens.red : tokens.soft },
            ]}>
            <Text style={[styles.at, { color: tokens.textMuted }]}>@</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              maxLength={HANDLE_MAX}
              onBlur={() => setHandleFocused(false)}
              onChangeText={(value) => setTag(sanitizeHandle(value))}
              onFocus={() => {
                setHandleFocused(true);
                setNameFocused(false);
              }}
              onSubmitEditing={submit}
              placeholder="handle"
              placeholderTextColor={tokens.textMuted}
              style={[styles.input, { color: tokens.text }]}
              value={tag}
            />
            <Text style={[styles.counter, { color: tokens.textMuted }]}>
              {tag.length}/{HANDLE_MAX}
            </Text>
          </View>

          {message ? <Text style={[styles.error, { color: tokens.red }]}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable disabled={busy} onPress={onClose} style={styles.cancel}>
              <Text style={[styles.cancelText, { color: tokens.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={submit}
              style={[styles.update, busy && styles.disabled, { backgroundColor: tokens.red }]}>
              <Text style={styles.updateText}>{busy ? 'Saving…' : 'Update'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrimWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 420,
    padding: 22,
    width: '100%',
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  field: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  at: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
  },
  counter: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  error: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
    marginTop: 22,
  },
  cancel: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  update: {
    borderRadius: 999,
    minWidth: 108,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  updateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabled: { opacity: 0.6 },
});
