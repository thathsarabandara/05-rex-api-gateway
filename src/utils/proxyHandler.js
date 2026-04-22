import axios from 'axios';

export const createServiceClient = (baseURL, timeout = 30000) => {
  return axios.create({
    baseURL,
    timeout,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    }
  });
};

export const forwardRequest = async (client, method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: path,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await client(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        error: true,
      };
    }

    throw {
      status: 503,
      message: 'Service unavailable',
      error: error.message
    };
  }
};

export const extractRelevantHeaders = (req) => {
  const relevantHeaders = {};
  const headersToForward = [
    'authorization',
    'content-type',
    'user-agent',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-request-id',
  ];

  headersToForward.forEach(header => {
    if (req.headers[header]) {
      relevantHeaders[header] = req.headers[header];
    }
  });

  return relevantHeaders;
};
