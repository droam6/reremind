import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2025, 2026, 2027, 2028];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function parseValue(value: string): { day: number | null; month: number | null; year: number | null } {
  if (!value) return { day: null, month: null, year: null };
  // Try ISO format YYYY-MM-DD
  const isoParts = value.split('-');
  if (isoParts.length === 3 && isoParts[0].length === 4) {
    return {
      day: parseInt(isoParts[2], 10) || null,
      month: parseInt(isoParts[1], 10) || null,
      year: parseInt(isoParts[0], 10) || null,
    };
  }
  // Try DD/MM/YYYY
  const ddParts = value.split('/');
  if (ddParts.length === 3) {
    return {
      day: parseInt(ddParts[0], 10) || null,
      month: parseInt(ddParts[1], 10) || null,
      year: parseInt(ddParts[2], 10) || null,
    };
  }
  return { day: null, month: null, year: null };
}

interface DatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  disablePast?: boolean;
}

type ModalType = 'day' | 'month' | 'year' | null;

export function DatePicker({ value, onChange, label, placeholder, disablePast = false }: DatePickerProps) {
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();

  const parsed = parseValue(value);
  const [day, setDay] = useState<number | null>(parsed.day);
  const [month, setMonth] = useState<number | null>(parsed.month);
  const [year, setYear] = useState<number | null>(parsed.year);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const maxDays = month && year ? daysInMonth(month, year) : 31;
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const emitChange = (d: number | null, m: number | null, y: number | null) => {
    if (d && m && y) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      onChange(iso);
    }
  };

  const handleDaySelect = (d: number) => {
    setDay(d);
    setActiveModal(null);
    emitChange(d, month, year);
  };

  const handleMonthSelect = (m: number) => {
    setMonth(m);
    setActiveModal(null);
    // Clamp day if needed
    const newMax = year ? daysInMonth(m, year) : 31;
    const newDay = day && day > newMax ? newMax : day;
    if (newDay !== day) setDay(newDay);
    emitChange(newDay, m, year);
  };

  const handleYearSelect = (y: number) => {
    setYear(y);
    setActiveModal(null);
    // Clamp day if needed
    const newMax = month ? daysInMonth(month, y) : 31;
    const newDay = day && day > newMax ? newMax : day;
    if (newDay !== day) setDay(newDay);
    emitChange(newDay, month, y);
  };

  const dayDisplay = day ? String(day) : 'Day';
  const monthDisplay = month ? MONTHS[month - 1] : 'Month';
  const yearDisplay = year ? String(year) : 'Year';

  const isPlaceholder = (val: number | null) => val === null;

  const renderModal = () => {
    if (!activeModal) return null;

    let title = '';
    let items: Array<{ value: number | string; label: string; disabled: boolean }> = [];

    if (activeModal === 'day') {
      title = 'DAY';
      items = days.map((d) => {
        const isPast = disablePast && year === todayYear && month === todayMonth && d < todayDay;
        return { value: d, label: String(d), disabled: isPast };
      });
    } else if (activeModal === 'month') {
      title = 'MONTH';
      items = MONTHS.map((m, i) => {
        const monthNum = i + 1;
        const isPast = disablePast && year === todayYear && monthNum < todayMonth;
        return { value: monthNum, label: m, disabled: isPast };
      });
    } else if (activeModal === 'year') {
      title = 'YEAR';
      items = YEARS.map((y) => {
        const isPast = disablePast && y < todayYear;
        return { value: y, label: String(y), disabled: isPast };
      });
    }

    const handleSelect = (val: number | string) => {
      if (activeModal === 'day') handleDaySelect(val as number);
      else if (activeModal === 'month') handleMonthSelect(val as number);
      else if (activeModal === 'year') handleYearSelect(val as number);
    };

    const currentValue = activeModal === 'day' ? day : activeModal === 'month' ? month : year;

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setActiveModal(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{title}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const isSelected = item.value === currentValue;
                return (
                  <Pressable
                    key={item.value}
                    style={styles.modalItem}
                    onPress={() => !item.disabled && handleSelect(item.value)}
                    disabled={item.disabled}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemSelected,
                        item.disabled && styles.modalItemDisabled,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {/* Day */}
        <Pressable
          style={[styles.selector, activeModal === 'day' && styles.selectorActive]}
          onPress={() => setActiveModal('day')}
        >
          <Text style={[styles.selectorText, isPlaceholder(day) && styles.selectorPlaceholder]}>
            {dayDisplay}
          </Text>
        </Pressable>

        {/* Month */}
        <Pressable
          style={[styles.selector, activeModal === 'month' && styles.selectorActive]}
          onPress={() => setActiveModal('month')}
        >
          <Text style={[styles.selectorText, isPlaceholder(month) && styles.selectorPlaceholder]}>
            {monthDisplay}
          </Text>
        </Pressable>

        {/* Year */}
        <Pressable
          style={[styles.selector, activeModal === 'year' && styles.selectorActive]}
          onPress={() => setActiveModal('year')}
        >
          <Text style={[styles.selectorText, isPlaceholder(year) && styles.selectorPlaceholder]}>
            {yearDisplay}
          </Text>
        </Pressable>
      </View>

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  selector: {
    flex: 1,
    backgroundColor: COLORS.surface,
    height: 48,
    borderRadius: BORDER_RADIUS.sharp,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorActive: {
    borderColor: COLORS.accent,
  },
  selectorText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
  },
  selectorPlaceholder: {
    color: COLORS.textTertiary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: BORDER_RADIUS.sharp,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    maxHeight: '60%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalItemText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
  modalItemSelected: {
    color: '#C9A84C',
    fontWeight: FONT_WEIGHTS.bold,
  },
  modalItemDisabled: {
    color: COLORS.textTertiary,
    opacity: 0.4,
  },
});
