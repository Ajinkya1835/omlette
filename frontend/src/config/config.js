const ENV = import.meta.env.MODE; // 'development' | 'production'

const config = {
  development: {
    API_URL: "http://localhost:5000",
  },
  production: {
    API_URL: "https://pvms.onrender.com",
  },
};

export const API_URL = config[ENV].API_URL;