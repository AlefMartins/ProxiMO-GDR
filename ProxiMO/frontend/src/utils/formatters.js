import { format, formatDistance, formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatação de data e hora
export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
};

export const formatTimeAgo = (date) => {
  if (!date) return '-';
  return formatDistance(new Date(date), new Date(), { 
    addSuffix: true,
    locale: ptBR
  });
};

// Formatação de status
export const formatStatus = (status) => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'unknown':
      return 'Desconhecido';
    default:
      return status;
  }
};

// Formatação de números
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '-';
  return new Intl.NumberFormat('pt-BR').format(number);
};

// Formatação de tamanho de arquivo (bytes para KB, MB, GB)
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '-';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncar texto para exibição
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
