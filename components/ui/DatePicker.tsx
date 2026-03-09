import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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

type DropdownType = 'day' | 'month' | 'year' | null;

export function DatePicker({ value, onChange, label, placeholder, disablePast = false }: DatePickerProps) {
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();

  const parsed = parseValue(value);
  const [day, setDay] = useState<number | null>(parsed.day);
  const [month, setMonth] = useState<number | null>(parsed.month);
  const [year, setYear] = useState<number | null>(parsed.year);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

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
    setOpenDropdown(null);
    emitChange(d, month, year);
  };

  const handleMonthSelect = (m: number) => {
    setMonth(m);
    setOpenDropdown(null);
    // Clamp day if needed
    const newMax = year ? daysInMonth(m, year) : 31;
    const newDay = day && day > newMax ? newMax : day;
    if (newDay !== day) setDay(newDay);
    emitChange(newDay, m, year);
  };

  const handleYearSelect = (y: number) => {
    setYear(y);
    setOpenDropdown(null);
    // Clamp day if needed
    const newMax = month ? daysInMonth(month, y) : 31;
    const newDay = day && day > newMax ? newMax : day;
    if (newDay !== day) setDay(newDay);
    emitChange(newDay, month, y);
  };

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  const dayDisplay = day ? String(day) : 'Day';
  const monthDisplay = month ? MONTHS[month - 1] : 'Month';
  const yearDisplay = year ? String(year) : 'Year';

  const isPlaceholder = (val: number | null) => val === null;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {/* Day */}
        <View style={styles.dropdownWrapper}>
          <Pressable
            style={[styles.selector, openDropdown === 'day' && styles.selectorActive]}
            onPress={() => toggleDropdown('day')}
          >
            <Text style={[styles.selectorText, isPlaceholder(day) && styles.selectorPlaceholder]}>
              {dayDisplay}
            </Text>
          </Pressable>
          {openDropdown === 'day' && (
            <View style={styles.dropdown}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {days.map((d) => {
                  const isPast = disablePast && year === todayYear && month === todayMonth && d < todayDay;
                  return (
                  <Pressable key={d} style={styles.dropdownItem} onPress={() => !isPast && handleDaySelect(d)} disabled={isPast}>
                    <Text style={[styles.dropdownItemText, d === day && styles.dropdownItemSelected, isPast && styles.dropdownItemDisabled]}>
                      {d}
                    </Text>
                  </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Month */}
        <View style={styles.dropdownWrapper}>
          <Pressable
            style={[styles.selector, openDropdown === 'month' && styles.selectorActive]}
            onPress={() => toggleDropdown('month')}
          >
            <Text style={[styles.selectorText, isPlaceholder(month) && styles.selectorPlaceholder]}>
              {monthDisplay}
            </Text>
          </Pressable>
          {openDropdown === 'month' && (
            <View style={styles.dropdown}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {MONTHS.map((m, i) => {
                  const monthNum = i + 1;
                  const isPast = disablePast && year === todayYear && monthNum < todayMonth;
                  return (
                  <Pressable key={m} style={styles.dropdownItem} onPress={() => !isPast && handleMonthSelect(monthNum)} disabled={isPast}>
                    <Text style={[styles.dropdownItemText, monthNum === month && styles.dropdownItemSelected, isPast && styles.dropdownItemDisabled]}>
                      {m}
                    </Text>
                  </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Year */}
        <View style={styles.dropdownWrapper}>
          <Pressable
            style={[styles.selector, openDropdown === 'year' && styles.selectorActive]}
            onPress={() => toggleDropdown('year')}
          >
            <Text style={[styles.selectorText, isPlaceholder(year) && styles.selectorPlaceholder]}>
              {yearDisplay}
            </Text>
          </Pressable>
          {openDropdown === 'year' && (
            <View style={styles.dropdown}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {YEARS.map((y) => {
                  const isPast = disablePast && y < todayYear;
                  return (
                  <Pressable key={y} style={styles.dropdownItem} onPress={() => !isPast && handleYearSelect(y)} disabled={isPast}>
                    <Text style={[styles.dropdownItemText, y === year && styles.dropdownItemSelected, isPast && styles.dropdownItemDisabled]}>
                      {y}
                    </Text>
                  </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Tap-outside overlay when dropdown open */}
      {openDropdown && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpenDropdown(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 100,
    overflow: 'visible',
  },
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
    overflow: 'visible',
  },
  dropdownWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 100,
    overflow: 'visible',
  },
  selector: {
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    borderRadius: BORDER_RADIUS.sharp,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 999,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  dropdownItemText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  dropdownItemSelected: {
    color: COLORS.accent,
    fontWeight: FONT_WEIGHTS.bold,
  },
  dropdownItemDisabled: {
    color: COLORS.textTertiary,
    opacity: 0.4,
  },
});
