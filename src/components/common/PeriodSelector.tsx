import { useMemo } from 'react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useUIStore } from '../../store/uiStore';
import { useTransactionStore } from '../../store/transactionStore';
import { formatPeriod, parsePeriod, getCurrentPeriod } from '../../utils/periodUtils';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function periodToDisplay(period: string): string {
  const { month, year } = parsePeriod(period);
  return `${MONTH_NAMES[month - 1]}, ${year}`;
}

/** Sort key for period comparison (yyyymm) */
function periodSortKey(period: string): number {
  const { month, year } = parsePeriod(period);
  return year * 100 + month;
}

export default function PeriodSelector() {
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const setPeriod = useUIStore((s) => s.setPeriod);
  const allTransactions = useTransactionStore((s) => s.allTransactions);

  const options = useMemo(() => {
    const periodSet = new Set<string>();
    // Always include current period
    periodSet.add(getCurrentPeriod());
    // Add all periods from transactions
    for (const t of allTransactions) {
      if (t.period) periodSet.add(t.period);
    }
    return Array.from(periodSet).sort((a, b) => periodSortKey(a) - periodSortKey(b));
  }, [allTransactions]);

  const handleChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <Select
        value={options.includes(selectedPeriod) ? selectedPeriod : ''}
        onChange={handleChange}
        aria-label="Selector de período"
        renderValue={(value) => periodToDisplay(value)}
        sx={{ '& .MuiSelect-select': { py: 0.75, minHeight: 'unset !important' }, '& .MuiInputBase-root': { minHeight: 'unset' } }}
      >
        {options.map((period) => (
          <MenuItem key={period} value={period}>
            {periodToDisplay(period)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
