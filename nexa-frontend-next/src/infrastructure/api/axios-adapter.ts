import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}

export class AxiosAdapter implements HttpClient {
  private api: AxiosInstance

  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      withCredentials: true, // Necessary for Laravel Sanctum
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add Socket ID for broadcasting toOthers()
        if (typeof window !== "undefined" && (window as any).Echo) {
             const socketId = (window as any).Echo.socketId();
             if (socketId) {
                 config.headers['X-Socket-Id'] = socketId;
             }
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
             // Optional: Dispatch event or clear storage
             // localStorage.removeItem("auth_token");
             // window.location.href = "/login";
          }
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config)
    return response.data
  }
}

export const api = new AxiosAdapter(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api")
