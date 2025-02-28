import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Terminal as TerminalIcon, Close as CloseIcon } from '@mui/icons-material';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';

const Terminal = ({ device, onClose }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    // Inicializar o terminal
    if (terminalRef.current) {
      xtermRef.current = new XTerm({
        cursorBlink: true,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#f0f0f0',
        },
      });

      fitAddonRef.current = new FitAddon();
      xtermRef.current.loadAddon(fitAddonRef.current);

      xtermRef.current.open(terminalRef.current);
      fitAddonRef.current.fit();

      // Conectar ao WebSocket
      socketRef.current = io(`${process.env.REACT_APP_API_URL}/terminal`, {
        query: {
          deviceId: device.id,
        },
        withCredentials: true,
      });

      // Evento quando o terminal está pronto
      socketRef.current.on('terminal.ready', () => {
        xtermRef.current.writeln('Conectado ao dispositivo ' + device.name);
        xtermRef.current.writeln('IP: ' + device.ipAddress);
        xtermRef.current.writeln('-----------------------------------');
      });

      // Receber dados do servidor
      socketRef.current.on('terminal.data', (data) => {
        xtermRef.current.write(data);
      });

      // Enviar dados quando o usuário digita no terminal
      xtermRef.current.onData((data) => {
        socketRef.current.emit('terminal.data', data);
      });

      // Evento de erro
      socketRef.current.on('terminal.error', (error) => {
        xtermRef.current.writeln('\r\n\x1b[31mERRO: ' + error + '\x1b[0m');
      });

      // Evento de desconexão
      socketRef.current.on('terminal.exit', () => {
        xtermRef.current.writeln('\r\n\x1b[33mConexão finalizada\x1b[0m');
      });

      // Lidar com o redimensionamento da janela
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          const dims = { 
            cols: xtermRef.current.cols, 
            rows: xtermRef.current.rows 
          };
          socketRef.current.emit('terminal.resize', dims);
        }
      };

      window.addEventListener('resize', handleResize);
      setTimeout(handleResize, 100);

      return () => {
        // Limpar ao desmontar o componente
        window.removeEventListener('resize', handleResize);
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        if (xtermRef.current) {
          xtermRef.current.dispose();
        }
      };
    }
  }, [device]);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '500px', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <Box sx={{ 
        p: 1, 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TerminalIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Terminal: {device.name} ({device.ipAddress})
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="error" 
          size="small" 
          startIcon={<CloseIcon />}
          onClick={onClose}
        >
          Fechar
        </Button>
      </Box>
      <Box 
        ref={terminalRef} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden',
          p: 1,
          bgcolor: '#1e1e1e'
        }} 
      />
    </Paper>
  );
};

export default Terminal;
