const productionUrlApi = "https://api.camiapp.net/"; //place host here xd
const developmentUrlApi = "http://127.0.0.1:8000/";

const baseUrl =
  import.meta.env.MODE === "production" ? productionUrlApi : developmentUrlApi;
//const baseUrl = "http://44.210.218.204:5000/"
/*
const baseurlAuth = 'http://54.39.190.60:9001/'
const baseurlDoc = 'http://54.39.190.60:9002/'
const baseurlUsers = 'http://54.39.190.60:9003/' */
export const environment = {
  urlApi: baseUrl,
  productionUrlApi,
  developmentUrlApi,
  /*urlAdmin: baseUrl + "adminflow/api/v1/",
    urlAuth: baseurlAuth + 'Auth/api/v1/',
    urlDoc: baseurlDoc + 'documentType/api/v1/',
    urlUser: baseurlUsers + 'Users/api/v1/'*/
  urlCollabora: "https://live.camiapp.net:9980/browser/6fe6d24/cool.html",

  localStorage: {
    userToken: "wsst_1276",
    guestContractsToken: "ghjf_8990",
  },
};