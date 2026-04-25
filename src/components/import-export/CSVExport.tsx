import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

export interface CSVExportProps {
  onExportTransactions: () => void;
  onExportBalances: () => void;
}

export default function CSVExport({ onExportTransactions, onExportBalances }: CSVExportProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
        Exportar CSV
      </Typography>

      <Stack 
        direction="row" 
        sx={{ 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: 2,
          '& > button': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2
          }
        }}
      >
        <Button variant="contained" onClick={onExportTransactions} sx={{ minHeight: 48 }}>
          Exportar Transacciones
        </Button>
        <Button variant="contained" onClick={onExportBalances} sx={{ minHeight: 48 }}>
          Exportar Balances
        </Button>
      </Stack>
    </Box>
  );
}
