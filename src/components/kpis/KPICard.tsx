import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';

export interface KPICardProps {
  title: string;
  currentValue: string;
  previousValue: string | null;
  trend: 'up' | 'down' | 'neutral' | null;
  color: string;
}

export default function KPICard({ title, currentValue, previousValue, trend, color }: KPICardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 180,
        maxWidth: 240,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}
          noWrap
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 700, color }}
            noWrap
          >
            {currentValue}
          </Typography>

          {trend === 'up' && (
            <ArrowUpward sx={{ fontSize: 18, color: 'success.main' }} aria-label="tendencia al alza" />
          )}
          {trend === 'down' && (
            <ArrowDownward sx={{ fontSize: 18, color: 'error.main' }} aria-label="tendencia a la baja" />
          )}
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          {previousValue !== null ? `Ant: ${previousValue}` : 'Sin datos previos'}
        </Typography>
      </CardContent>
    </Card>
  );
}
