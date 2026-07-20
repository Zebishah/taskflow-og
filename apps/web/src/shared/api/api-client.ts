import axios from 'axios';

import { environment } from '../config/environment';

export const apiClient = axios.create({
  baseURL: environment.apiUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
