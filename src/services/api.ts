const API_BASE_URL = 'http://localhost:8000';

export interface Keyword {
  id: number;
  keyword: string;
  category?: string;
}

export interface Photo {
  id: number;
  user_id: number;
  keyword_id: number;
  image_path: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  ai_description?: string;
  uploaded_at: string;
  like_count: number;
}

export interface User {
  id: number;
  nickname: string;
  points: number;
}

class ApiService {
  // 키워드 관련 API
  async getKeywords(): Promise<Keyword[]> {
    const response = await fetch(`${API_BASE_URL}/keywords/`);
    if (!response.ok) throw new Error('키워드 조회 실패');
    return response.json();
  }

  async getRandomKeyword(): Promise<Keyword> {
    const response = await fetch(`${API_BASE_URL}/keywords/random`);
    if (!response.ok) throw new Error('랜덤 키워드 조회 실패');
    return response.json();
  }

  // 사진 관련 API
  async uploadPhoto(
    file: any,
    userId: number,
    keywordId: number,
    location?: string,
    latitude?: number,
    longitude?: number
  ): Promise<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId.toString());
    formData.append('keyword_id', keywordId.toString());
    if (location) formData.append('location', location);
    if (latitude) formData.append('latitude', latitude.toString());
    if (longitude) formData.append('longitude', longitude.toString());

    const response = await fetch(`${API_BASE_URL}/photos/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('사진 업로드 실패');
    return response.json();
  }

  async getPhotos(keywordId?: number, userId?: number, limit = 20, offset = 0): Promise<Photo[]> {
    const params = new URLSearchParams();
    if (keywordId) params.append('keyword_id', keywordId.toString());
    if (userId) params.append('user_id', userId.toString());
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await fetch(`${API_BASE_URL}/photos/?${params}`);
    if (!response.ok) throw new Error('사진 조회 실패');
    return response.json();
  }

  async likePhoto(photoId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/like?user_id=${userId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('좋아요 실패');
  }

  async unlikePhoto(photoId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/like?user_id=${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('좋아요 취소 실패');
  }

  // 검색 API
  async searchPhotos(query: string, sortBy = 'latest', limit = 20, offset = 0): Promise<Photo[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('sort_by', sortBy);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await fetch(`${API_BASE_URL}/search/photos?${params}`);
    if (!response.ok) throw new Error('검색 실패');
    return response.json();
  }

  async searchKeywords(query: string): Promise<Keyword[]> {
    const response = await fetch(`${API_BASE_URL}/search/keywords?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('키워드 검색 실패');
    return response.json();
  }

  // 유저 관련 API
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/`);
    if (!response.ok) throw new Error('유저 조회 실패');
    return response.json();
  }
}

export const apiService = new ApiService();
