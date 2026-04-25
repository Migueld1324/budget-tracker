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
    <Box>
      <Typography variant="h6" gutterBottom>
        Exportar CSV
      </Typography>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={onExportTransactions}>
          Exportar Transacciones
        </Button>
        <Button variant="contained" onClick={onExportBalances}>
          Exportar Balances
        </Button>
      </Stack>
    </Box>
  );
}
