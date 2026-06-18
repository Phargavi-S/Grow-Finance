import axios from 'axios';

const base = '/purchase-orders';

const getAll = () => axios.get(base, { withCredentials: true });
const getById = (id) => axios.get(`${base}/${id}`, { withCredentials: true });
const create = (payload) => axios.post(base, payload, { withCredentials: true });
const update = (id, payload) => axios.put(`${base}/${id}`, payload, { withCredentials: true });
const remove = (id) => axios.delete(`${base}/${id}`, { withCredentials: true });
const convertToBill = (id) => axios.post(`${base}/${id}/convert-to-bill`, {}, { withCredentials: true });
const getStats = () => axios.get(`${base}/dashboard-stats`, { withCredentials: true });

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  convertToBill,
  getStats
};
