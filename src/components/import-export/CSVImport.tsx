import { useState, useRef, type ChangeEvent } from 'react';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { parseTransactionsCSV, parseAccountsCSV } from '../../utils/csvParser';
import type { TransactionInput, AccountInput, CSVRowError } from '../../types';

type ImportMode = 'transactions' | 'accounts';

export interface CSVImportProps {
  onImportTransactions: (data: TransactionInput[]) => void;
  onImportAccounts: (data: AccountInput[]) => void;
}

export default function CSVImport({ onImportTransactions, onImportAccounts }: CSVImportProps) {
  const [mode, setMode] = useState<ImportMode>('transactions');
  const [validCount, setValidCount] = useState<number | null>(null);
  const [errors, setErrors] = useState<CSVRowError[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<TransactionInput[] | null>(null);
  const [parsedAccounts, setParsedAccounts] = useState<AccountInput[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setValidCount(null);
    setErrors([]);
    setParsedTransactions(null);
    setParsedAccounts(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (mode === 'transactions') {
        const result = parseTransactionsCSV(content);
        setValidCount(result.data.length);
        setErrors(result.errors);
        setParsedTransactions(result.data);
        setParsedAccounts(null);
      } else {
        const result = parseAccountsCSV(content);
        setValidCount(result.data.length);
        setErrors(result.errors);
        setParsedAccounts(result.data);
        setParsedTransactions(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirm = () => {
    if (mode === 'transactions' && parsedTransactions) {
      onImportTransactions(parsedTransactions);
    } else if (mode === 'accounts' && parsedAccounts) {
      onImportAccounts(parsedAccounts);
    }
    reset();
  };

  const hasData = (mode === 'transactions' && parsedTransactions !== null) ||
    (mode === 'accounts' && parsedAccounts !== null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
        Importar CSV
      </Typography>

      <RadioGroup
        row
        value={mode}
        onChange={(e) => { setMode(e.target.value as ImportMode); reset(); }}
        sx={{ justifyContent: 'center' }}
      >
        <FormControlLabel value="transactions" control={<Radio />} label="Transacciones" />
        <FormControlLabel value="accounts" control={<Radio />} label="Cuentas" />
      </RadioGroup>

      <Box sx={{ my: 2 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="csv-upload-input"
        />
        <label htmlFor="csv-upload-input">
          <Button variant="outlined" component="span" sx={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
            Seleccionar archivo CSV
          </Button>
        </label>
      </Box>

      {hasData && (
        <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
          <Alert severity={errors.length > 0 ? 'warning' : 'success'}>
            {validCount} registros válidos, {errors.length} errores
          </Alert>

          {errors.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Errores encontrados:
              </Typography>
              <List dense>
                {errors.map((err, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={`Fila ${err.row}: ${err.message}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {validCount !== null && validCount > 0 && (
            <Button variant="contained" onClick={handleConfirm} sx={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
              Confirmar importación
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
