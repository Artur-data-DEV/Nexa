import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
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
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const skipAuth = config.headers && (config.headers as Record<string, string>)["X-Skip-Auth"] === "true"
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        if (!skipAuth && token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (config.data instanceof FormData && config.headers) {
          delete (config.headers as any)["Content-Type"]
        }

        // Add Socket ID for broadcasting toOthers()
        if (!skipAuth && typeof window !== "undefined" && (window as any).Echo) {
          const socketId = (window as any).Echo.socketId()
          if (socketId) {
            config.headers["X-Socket-Id"] = socketId
          }
        }

        if (skipAuth && config.headers) {
          delete (config.headers as Record<string, string>)["X-Skip-Auth"]
          if ((config.headers as Record<string, string>)["Authorization"]) {
            delete (config.headers as Record<string, string>)["Authorization"]
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

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config)
    return response.data
  }
}

export const api = new AxiosAdapter(
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://nexa-backend2-1044548850970.southamerica-east1.run.app/api"
)
