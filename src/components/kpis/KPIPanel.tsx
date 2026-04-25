import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import KPICard from './KPICard';
import { formatMXN } from '../../utils/currency';
import { getTrendIndicator } from '../../utils/kpiCalculations';
import type { KPIValues } from '../../types';

export interface KPIPanelProps { currentPeriodKPIs: KPIValues; previousPeriodKPIs: KPIValues | null }

function trendDir(c: number, p: number | null | undefined): 'up' | 'down' | 'neutral' | null {
  return p == null ? null : getTrendIndicator(c, p).direction;
}
function prevFmt(v: number | null | undefined): string | null {
  return v == null ? null : formatMXN(v);
}
const KC = {
  income: { light: '#2e7d32', dark: '#4caf50' }, expenses: { light: '#c62828', dark: '#f44336' },
  egresos: { light: '#e65100', dark: '#ff9800' }, balance: { light: '#09297A', dark: '#5C8AFF' },
  daily: { light: '#5C6BC0', dark: '#7986CB' }, topCat: { light: '#4527a0', dark: '#9575CD' },
  tdc: { light: '#bf360c', dark: '#ff7043' }, savings: { light: '#00838f', dark: '#26c6da' },
} as const;

const SPEED = 15; // pixels per second (time-based, not frame-based)

export default function KPIPanel({ currentPeriodKPIs: cur, previousPeriodKPIs: prev }: KPIPanelProps) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setARef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const overRef = useRef(false);
  // Animation state — all in refs so rAF closure always sees latest
  const pos = useRef(0);        // current translateX in px
  const running = useRef(true); // is auto-scroll active
  const rafId = useRef(0);
  const setW = useRef(0);       // width of one card set (for wrapping)
  const pointer = useRef({ down: false, sx: 0, bx: 0 });

  const c = (k: keyof typeof KC) => KC[k][mode];
  const sr = cur.savingsRate !== null ? cur.savingsRate.toFixed(1) + '%' : 'N/A';
  const psr = prev ? (prev.savingsRate !== null ? prev.savingsRate.toFixed(1) + '%' : 'N/A') : null;
  const tc = cur.topExpenseCategory || '\u2014';
  const ptc = prev ? (prev.topExpenseCategory || '\u2014') : null;

  // Detect overflow
  useEffect(() => {
    const check = () => {
      const o = outerRef.current, a = setARef.current;
      if (o && a) {
        const v = a.scrollWidth > o.clientWidth + 4;
        setOverflows(v);
        overRef.current = v;
        setW.current = a.scrollWidth;
      }
    };
    check();
    const ro = new ResizeObserver(check);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  // rAF loop — time-based so speed is consistent regardless of refresh rate
  useEffect(() => {
    let lastTime = 0;
    const tick = (time: number) => {
      if (lastTime > 0 && overRef.current && running.current && !pointer.current.down) {
        const dt = (time - lastTime) / 1000; // seconds since last frame
        pos.current -= SPEED * dt;
        const w = setW.current;
        if (w > 0 && pos.current <= -w) {
          pos.current += w;
        }
      }
      lastTime = time;
      const t = trackRef.current;
      if (t) t.style.transform = 'translateX(' + pos.current + 'px)';
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // Pointer events (mouse + touch unified)
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      if (!overRef.current) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      running.current = false;
      pointer.current = { down: true, sx: e.clientX, bx: pos.current };
    };
    const onMove = (e: PointerEvent) => {
      if (!pointer.current.down) return;
      e.preventDefault();
      const delta = e.clientX - pointer.current.sx;
      pos.current = pointer.current.bx + delta;
      // Wrap position
      const w = setW.current;
      if (w > 0) {
        while (pos.current <= -w) pos.current += w;
        while (pos.current > 0) pos.current -= w;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!pointer.current.down) return;
      pointer.current.down = false;
      el.releasePointerCapture(e.pointerId);
      running.current = true; // resume auto-scroll from current pos
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  // Mouse hover (desktop only)
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const onEnter = () => { if (!pointer.current.down) running.current = false; };
    const onLeave = () => { if (!pointer.current.down) running.current = true; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  const cards = (
    <>
      <KPICard title="Total Ingresos" currentValue={formatMXN(cur.totalIncome)} previousValue={prevFmt(prev?.totalIncome)} trend={trendDir(cur.totalIncome, prev?.totalIncome)} color={c('income')} />
      <KPICard title="Total Gastos" currentValue={formatMXN(cur.totalExpenses)} previousValue={prevFmt(prev?.totalExpenses)} trend={trendDir(cur.totalExpenses, prev?.totalExpenses)} color={c('expenses')} />
      <KPICard title="Total Egresos" currentValue={formatMXN(cur.totalEgresos)} previousValue={prevFmt(prev?.totalEgresos)} trend={trendDir(cur.totalEgresos, prev?.totalEgresos)} color={c('egresos')} />
      <KPICard title="Balance" currentValue={formatMXN(cur.balance)} previousValue={prevFmt(prev?.balance)} trend={trendDir(cur.balance, prev?.balance)} color={c('balance')} />
      <KPICard title="Gasto Diario Promedio" currentValue={formatMXN(cur.dailyExpenseAverage)} previousValue={prevFmt(prev?.dailyExpenseAverage)} trend={trendDir(cur.dailyExpenseAverage, prev?.dailyExpenseAverage)} color={c('daily')} />
      <KPICard title="Mayor Gasto" currentValue={tc} previousValue={ptc} trend={null} color={c('topCat')} />
      <KPICard title="Deuda TDC" currentValue={formatMXN(cur.tdcDebt)} previousValue={prevFmt(prev?.tdcDebt)} trend={trendDir(cur.tdcDebt, prev?.tdcDebt)} color={c('tdc')} />
      <KPICard title="Tasa de Ahorro" currentValue={sr} previousValue={psr} trend={cur.savingsRate !== null && prev?.savingsRate !== null && prev !== null ? getTrendIndicator(cur.savingsRate, prev.savingsRate).direction : null} color={c('savings')} />
    </>
  );
  const cset = (k: string) => <Box key={k} sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>{cards}</Box>;

  return (
    <Box ref={outerRef} sx={{ overflow: 'hidden', py: 0.5, cursor: overflows ? 'grab' : 'default', userSelect: 'none', touchAction: overflows ? 'none' : 'auto' }}>
      <Box ref={trackRef} sx={{ display: 'inline-flex', gap: 1.5, willChange: 'transform' }}>
        <Box ref={setARef} sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>{cards}</Box>
        {overflows && cset('b')}
      </Box>
    </Box>
  );
}
