import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../theme';

import { formatTime12 } from '../utils/date';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

function toDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(toDate(value));

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && date) onChange(toHHMM(date));
    } else if (date) {
      setDraft(date);
    }
  };

  const confirmIos = () => {
    onChange(toHHMM(draft));
    setShow(false);
  };

  const renderPicker = () => (
    <DateTimePicker
      value={draft}
      mode="time"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleChange}
    />
  );

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={() => {
          setDraft(toDate(value));
          setShow(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>{formatTime12(value)}</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setShow(false)}>
            <Pressable style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Pick time</Text>
                <TouchableOpacity onPress={confirmIos}>
                  <Text style={styles.done}>Done</Text>
                </TouchableOpacity>
              </View>
              {renderPicker()}
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        show && renderPicker()
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 96,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,27,51,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cancel: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  done: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});