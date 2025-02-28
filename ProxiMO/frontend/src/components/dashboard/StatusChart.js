import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchDevices } from '../../redux/slices/deviceSlice';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StatusChart = () => {
  const dispatch = useDispatch();
  const { devices, status } = useSelector((state) => state.devices);
  const [chartType, setChartType] = useState('pie');
  const [chartData, setChartData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [dataType, setDataType] = useState('status');

  useEffect(() => {
    if (!devices || devices.length === 0) {
      dispatch(fetchDevices({ limit: 100 }));
    }
  }, [dispatch, devices]);

  useEffect(() => {
    if (devices && devices.length > 0) {
      // Dados para o gráfico de status
      const statusCounts = {
        online: 0,
        offline: 0,
        warning: 0,
        unknown: 0
      };

      devices.forEach(device => {
        if (statusCounts[device.status] !== undefined) {
          statusCounts[device.status]++;
        } else {
          statusCounts.unknown++;
        }
      });

      const statusData = [
        { name: 'Online', value: statusCounts.online, color: '#4caf50' },
        { name: 'Offline', value: statusCounts.offline, color: '#f44336' },
        { name: 'Alerta', value: statusCounts.warning, color: '#ff9800' },
        { name: 'Desconhecido', value: statusCounts.unknown, color: '#9e9e9e' }
      ].filter(item => item.value > 0);

      setChartData(statusData);

      // Dados para o gráfico de fabricantes
      const vendorCounts = {};
      devices.forEach(device => {
        const vendor = device.vendor || 'other';
        vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
      });

      const vendorColors = {
        'cisco': '#049fd9',
        'juniper': '#84b135',
        'huawei': '#e60012',
        'fortinet': '#ee3124',
        'paloalto': '#fa582d',
        'hpe': '#00b388',
        'dell': '#007db8',
        'other': '#9e9e9e'
      };

      const vendorChartData = Object.keys(vendorCounts).map(vendor => ({
        name: vendor.charAt(0).toUpperCase() + vendor.slice(1),
        value: vendorCounts[vendor],
        color: vendorColors[vendor] || '#9e9e9e'
      }));

      setVendorData(vendorChartData);

      // Dados para o gráfico de tipos
      const typeCounts = {};
      devices.forEach(device => {
        const type = device.type || 'other';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const typeColors = {
        'router': '#3f51b5',
        'switch': '#2196f3',
        'firewall': '#f44336',
        'server': '#4caf50',
        'other': '#9e9e9e'
      };

      const typeChartData = Object.keys(typeCounts).map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: typeCounts[type],
        color: typeColors[type] || '#9e9e9e'
      }));

      setTypeData(typeChartData);
    }
  }, [devices]);

  const handleRefresh = () => {
    dispatch(fetchDevices({ limit: 100 }));
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  const handleDataTypeChange = (event) => {
    setDataType(event.target.value);
  };

  const getCurrentData = () => {
    switch (dataType) {
      case 'status':
        return chartData;
      case 'vendor':
        return vendorData;
      case 'type':
        return typeData;
      default:
        return chartData;
    }
  };

  const renderPieChart = () => {
    const data = getCurrentData();
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} dispositivo(s)`, '']}
            labelFormatter={(name) => name}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    const data = getCurrentData();
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} dispositivo(s)`, '']} />
          <Legend />
          <Bar dataKey="value" name="Quantidade">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Estatísticas de Dispositivos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="data-type-label">Dados</InputLabel>
              <Select
                labelId="data-type-label"
                value={dataType}
                label="Dados"
                onChange={handleDataTypeChange}
              >
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="vendor">Fabricante</MenuItem>
                <MenuItem value="type">Tipo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="chart-type-label">Tipo de Gráfico</InputLabel>
              <Select
                labelId="chart-type-label"
                value={chartType}
                label="Tipo de Gráfico"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="pie">Gráfico de Pizza</MenuItem>
                <MenuItem value="bar">Gráfico de Barras</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {status === 'loading' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Carregando dados...</Typography>
          </Box>
        ) : devices && devices.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {chartType === 'pie' ? renderPieChart() : renderBarChart()}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Nenhum dado disponível</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusChart;
