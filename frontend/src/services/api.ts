import axios from 'axios';
import {
  User,
  LoginResponse,
  DocumentRecord,
  DocumentDetail,
  DocumentChatMessage,
  DashboardStats,
  DataAnalysisReport,
  DataAnalysisSummary,
  DynamicChartRequest,
  DynamicChartResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('docintel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('docintel_token');
      localStorage.removeItem('docintel_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/users/login', { email, password });
    return res.data;
  },
};

export const docsApi = {
  list: async (): Promise<DocumentRecord[]> => {
    const res = await apiClient.get<DocumentRecord[]>('/documents');
    return res.data;
  },

  getById: async (id: number): Promise<DocumentDetail> => {
    const res = await apiClient.get<DocumentDetail>(`/documents/${id}`);
    return res.data;
  },

  upload: async (file: File): Promise<DocumentRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<DocumentRecord>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  download: async (id: number, fileName: string) => {
    const res = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  reprocess: async (id: number): Promise<void> => {
    await apiClient.post(`/documents/${id}/reprocess`);
  },
};

export const chatApi = {
  getHistory: async (documentId: number): Promise<DocumentChatMessage[]> => {
    const res = await apiClient.get<DocumentChatMessage[]>(`/documents/${documentId}/chat`);
    return res.data;
  },

  askQuestion: async (documentId: number, message: string): Promise<DocumentChatMessage> => {
    const res = await apiClient.post<DocumentChatMessage>(`/documents/${documentId}/chat`, { message });
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await apiClient.get<User>(`/users/${id}`);
    return res.data;
  },

  create: async (data: { fullName: string; email: string; password: string }): Promise<User> => {
    const res = await apiClient.post<User>('/users', data);
    return res.data;
  },

  update: async (id: number, data: { fullName: string; email: string; isActive: boolean }): Promise<User> => {
    const res = await apiClient.put<User>(`/users/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

export const analysisApi = {
  uploadAndAnalyze: async (file: File): Promise<DataAnalysisReport> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<DataAnalysisReport>('/analysis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  analyzeDocument: async (documentId: number): Promise<DataAnalysisReport> => {
    const res = await apiClient.post<DataAnalysisReport>(`/analysis/document/${documentId}`);
    return res.data;
  },

  listReports: async (): Promise<DataAnalysisSummary[]> => {
    const res = await apiClient.get<DataAnalysisSummary[]>('/analysis');
    return res.data;
  },

  getReport: async (id: number): Promise<DataAnalysisReport> => {
    const res = await apiClient.get<DataAnalysisReport>(`/analysis/${id}`);
    return res.data;
  },

  downloadCleanedCsv: async (id: number, fileName = 'Cleaned_Dataset.csv') => {
    const res = await apiClient.get(`/analysis/${id}/export-cleaned`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadVersionCsv: async (id: number, version: string, fileName?: string) => {
    const targetName = fileName || `${version}_Dataset.csv`;
    const res = await apiClient.get(`/analysis/${id}/versions/${version}/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', targetName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  generateDynamicChart: async (id: number, request: DynamicChartRequest): Promise<DynamicChartResult> => {
    const res = await apiClient.post<DynamicChartResult>(`/analysis/${id}/dynamic-chart`, request);
    return res.data;
  },

  deleteReport: async (id: number): Promise<void> => {
    await apiClient.delete(`/analysis/${id}`);
  },
};

