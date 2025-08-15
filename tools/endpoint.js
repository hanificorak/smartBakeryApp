const BASE_URL = "http://127.0.0.1:8000";
// const BASE_URL = "https://smartbakery.nubifysoftware.com";

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
  StockDelete: `${BASE_URL}/api/stocks/stockDelete`,
  EndOfDayListData: `${BASE_URL}/api/endofdays/getEndOfListData`,
  EndOfDayAdd: `${BASE_URL}/api/endofdays/addEndOfData`,
  EndOfCheck: `${BASE_URL}/api/endofdays/endOfDataCheck`,
  EndOfData: `${BASE_URL}/api/endofdays/getEndOfData`,
  EndOfDelete: `${BASE_URL}/api/endofdays/delete`,
};

export default Endpoint;