import client from './client'

export async function getHomeData() {
  try {
    const response = await client.get('/music/catalog/home/')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to load home data')
  }
}