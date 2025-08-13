const BASE_URL = "http://127.0.0.1:8000";

const Endpoint = {
  Login: `${BASE_URL}/api/auth/login`,
  Register: `${BASE_URL}/api/auth/register`,
  ProductList: `${BASE_URL}/api/products/getData`,
  AddProduct: `${BASE_URL}/api/products/addProduct`,
  ProductDelete: `${BASE_URL}/api/products/productDelete`,
  StockParams: `${BASE_URL}/api/stocks/getParam`,
  WeatherItem: `${BASE_URL}/api/stocks/getWeatherItem`,
  AddStock: `${BASE_URL}/api/stocks/saveStock`,
  StockData: `${BASE_URL}/api/stocks/getStockData`,
};

export default Endpoint;