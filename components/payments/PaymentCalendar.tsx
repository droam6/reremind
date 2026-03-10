import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Payment, PayFrequency } from '../../types/payment';
import { formatCurrency } from '../../utils/formatCurrency';
import { capitalizeName } from '../../utils/capitalize';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface DayCell {
  date: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  payments: Payment[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Returns 0-6 (Sunday-Saturday), convert to Monday-first (0-6)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getPaymentOccurrences(payment: Payment, year: number, month: number): string[] {
  const occurrences: string[] = [];
  const startDate = new Date(payment.nextDueDate);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Helper to add occurrence if in month
  const addIfInMonth = (date: Date) => {
    if (date >= monthStart && date <= monthEnd) {
      const dateStr = date.toISOString().split('T')[0];
      if (!occurrences.includes(dateStr)) {
        occurrences.push(dateStr);
      }
    }
  };

  // Calculate interval in days based on frequency
  let intervalDays = 0;
  switch (payment.frequency) {
    case 'weekly':
      intervalDays = 7;
      break;
    case 'fortnightly':
      intervalDays = 14;
      break;
    case 'monthly':
      intervalDays = 30;
      break;
    case 'quarterly':
      intervalDays = 90;
      break;
    case 'yearly':
      intervalDays = 365;
      break;
  }

  // Check occurrences going backward and forward from next due date
  let checkDate = new Date(startDate);
  while (checkDate >= new Date(year, month - 3, 1)) {
    addIfInMonth(checkDate);
    checkDate = new Date(checkDate.getTime() - intervalDays * 86400000);
  }

  checkDate = new Date(startDate);
  while (checkDate <= new Date(year, month + 3, 0)) {
    addIfInMonth(checkDate);
    checkDate = new Date(checkDate.getTime() + intervalDays * 86400000);
  }

  return occurrences;
}

interface PaymentCalendarProps {
  payments: Payment[];
}

export function PaymentCalendar({ payments }: PaymentCalendarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Get payment occurrences for current month
  const paymentsByDate = new Map<string, Payment[]>();
  payments.forEach((payment) => {
    const occurrences = getPaymentOccurrences(payment, year, month);
    occurrences.forEach((dateStr) => {
      if (!paymentsByDate.has(dateStr)) {
        paymentsByDate.set(dateStr, []);
      }
      paymentsByDate.get(dateStr)!.push(payment);
    });
  });

  // Build cells
  const cells: DayCell[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Previous month overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0];
    cells.push({
      date: day,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
      payments: [],
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    cells.push({
      date: day,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      payments: paymentsByDate.get(dateStr) || [],
    });
  }

  // Next month overflow
  const remainingCells = 42 - cells.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const dateStr = new Date(year, month + 1, day).toISOString().split('T')[0];
    cells.push({
      date: day,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
      payments: [],
    });
  }

  // Calculate totals
  const monthTotal = Array.from(paymentsByDate.values())
    .flat()
    .reduce((sum, p) => sum + p.amount, 0);
  const daysWithPayments = paymentsByDate.size;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleDayPress = (cell: DayCell) => {
    if (cell.payments.length > 0) {
      setSelectedDay(selectedDay === cell.dateStr ? null : cell.dateStr);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={handlePrevMonth} style={styles.monthArrow}>
          <Text style={[styles.monthArrowText, { color: colors.textSecondary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <Pressable onPress={handleNextMonth} style={styles.monthArrow}>
          <Text style={[styles.monthArrowText, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day, i) => (
          <Text key={i} style={[styles.dayHeader, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          const hasPayments = cell.payments.length > 0;
          const isSelected = selectedDay === cell.dateStr;
          return (
            <View key={i} style={styles.cellWrapper}>
              <Pressable
                style={[
                  styles.cell,
                  { backgroundColor: colors.surface },
                  !cell.isCurrentMonth && { opacity: 0.3 },
                ]}
                onPress={() => handleDayPress(cell)}
              >
                <Text
                  style={[
                    styles.cellDate,
                    { color: cell.isCurrentMonth ? colors.text : colors.textTertiary },
                  ]}
                >
                  {cell.date}
                </Text>
                {cell.isToday && (
                  <View style={[styles.todayDot, { backgroundColor: colors.accent }]} />
                )}
                {hasPayments && (
                  <View style={styles.paymentIndicator}>
                    <View
                      style={[
                        styles.paymentDot,
                        {
                          backgroundColor:
                            cell.payments.length === 1 ? colors.accent : colors.warning,
                        },
                      ]}
                    />
                    {cell.payments.length > 1 && (
                      <Text style={[styles.paymentCount, { color: colors.text }]}>
                        {cell.payments.length}
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>

              {/* Payment detail popup */}
              {isSelected && cell.payments.length > 0 && (
                <View
                  style={[
                    styles.paymentPopup,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  {cell.payments.map((payment, idx) => (
                    <Text
                      key={idx}
                      style={[styles.paymentPopupText, { color: colors.text }]}
                    >
                      {capitalizeName(payment.name)} · {formatCurrency(payment.amount)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Month summary */}
      <View style={styles.summary}>
        <Text style={[styles.summaryTotal, { color: colors.textSecondary }]}>
          Total this month: {formatCurrency(Math.round(monthTotal))}
        </Text>
        <Text style={[styles.summaryDetail, { color: colors.textTertiary }]}>
          {paymentsByDate.size} {paymentsByDate.size === 1 ? 'payment' : 'payments'} across{' '}
          {daysWithPayments} {daysWithPayments === 1 ? 'day' : 'days'}
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: 120,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
    },
    monthArrow: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthArrowText: {
      fontSize: 32,
      fontFamily: FONTS.light,
    },
    monthTitle: {
      fontSize: FONT_SIZES.h3,
      fontFamily: FONTS.regular,
    },
    dayHeaders: {
      flexDirection: 'row',
      marginBottom: SPACING.sm,
    },
    dayHeader: {
      flex: 1,
      fontSize: FONT_SIZES.caption,
      textAlign: 'center',
      fontFamily: FONTS.regular,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    cellWrapper: {
      width: `${(100 - (6 * 4) / 7) / 7}%`,
      position: 'relative',
    },
    cell: {
      aspectRatio: 1,
      borderRadius: BORDER_RADIUS.sharp,
      padding: SPACING.xs,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    cellDate: {
      fontSize: FONT_SIZES.caption,
      fontFamily: FONTS.light,
    },
    todayDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 2,
    },
    paymentIndicator: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    paymentDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    paymentCount: {
      fontSize: 8,
      fontFamily: FONTS.regular,
    },
    paymentPopup: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      padding: 12,
      borderRadius: BORDER_RADIUS.sharp,
      borderWidth: 1,
      zIndex: 100,
      gap: 4,
    },
    paymentPopupText: {
      fontSize: FONT_SIZES.bodySmall,
      fontFamily: FONTS.light,
    },
    summary: {
      marginTop: SPACING.xl,
      alignItems: 'center',
    },
    summaryTotal: {
      fontSize: FONT_SIZES.body,
      fontFamily: FONTS.regular,
      marginBottom: SPACING.xs,
    },
    summaryDetail: {
      fontSize: FONT_SIZES.caption,
      fontFamily: FONTS.light,
    },
  });
