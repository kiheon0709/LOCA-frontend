// 환경별 API URL 설정
const getApiBaseUrl = () => {
  // React Native에서는 __DEV__를 사용하여 개발/프로덕션 환경을 구분
  if (__DEV__) {
    // 개발 환경: iOS 시뮬레이터에서는 127.0.0.1 사용
    return 'http://127.0.0.1:8000';
  } else {
    // 프로덕션 환경: 실제 서버 URL
    return 'https://your-production-server.com';
  }
};

const API_BASE_URL = getApiBaseUrl();

// 공통 에러 처리 함수
const handleApiError = (response: Response, errorMessage: string) => {
  if (!response.ok) {
    console.error(`API Error: ${response.status} - ${response.statusText}`);
    throw new Error(`${errorMessage}: ${response.status}`);
  }
};

// 공통 fetch 설정
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다.');
    }
    throw error;
  }
};

export interface Keyword {
  id: number;
  keyword: string;
  category?: string;
}

export interface Photo {
  id: number;
  user_id: number;
  user_nickname: string;
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

export interface Contest {
  id: number;
  title: string;
  description: string;
  points: number;
  deadline: string;
  user_id: number;
  status: string;
  created_at: string;
  photo_count: number;
}

export interface ContestCreate {
  title: string;
  description: string;
  points: number;
  deadline: string;
}

class ApiService {
  // 키워드 관련 API
  async getKeywords(): Promise<Keyword[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/keywords/`);
      handleApiError(response, '키워드 조회 실패');
      return response.json();
    } catch (error) {
      console.error('getKeywords error:', error);
      throw error;
    }
  }

  async getRandomKeyword(): Promise<Keyword> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/keywords/random`);
      handleApiError(response, '랜덤 키워드 조회 실패');
      return response.json();
    } catch (error) {
      console.error('getRandomKeyword error:', error);
      throw error;
    }
  }

  async getTimeBasedKeyword(isMorning: boolean): Promise<Keyword> {
    try {
      const timeType = isMorning ? 'morning' : 'evening';
      const response = await fetchWithTimeout(`${API_BASE_URL}/keywords/time-based?time_type=${timeType}`);
      handleApiError(response, '시간 기반 키워드 조회 실패');
      return response.json();
    } catch (error) {
      console.error('getTimeBasedKeyword error:', error);
      throw error;
    }
  }

  // 사진 관련 API
  async uploadPhoto(asset: any, userId: number, keywordId: number, location?: string): Promise<any> {
    console.log('uploadPhoto 호출됨:', { asset, userId, keywordId, location });
    
    try {
      const formData = new FormData();
      
      // asset 객체를 JSON 문자열로 변환하여 전송
      formData.append('asset', JSON.stringify(asset));
      formData.append('user_id', userId.toString());
      formData.append('keyword_id', keywordId.toString());
      
      // 위치정보 추가
      if (location && location.trim()) {
        formData.append('location', location.trim());
      }
      
      console.log('FormData 구성 완료:', {
        asset: asset,
        user_id: userId,
        keyword_id: keywordId,
        location: location
      });
      
      const response = await fetch(`${API_BASE_URL}/photos/upload-asset`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('서버 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 응답 에러:', errorText);
        throw new Error(`사진 업로드 실패: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('업로드 성공:', result);
      return result;
      
    } catch (error) {
      console.error('uploadPhoto error:', error);
      throw error;
    }
  }

  async getPhotos(keywordId?: number, userId?: number, limit = 20, offset = 0): Promise<Photo[]> {
    try {
      const params = new URLSearchParams();
      if (keywordId) params.append('keyword_id', keywordId.toString());
      if (userId) params.append('user_id', userId.toString());
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const url = `${API_BASE_URL}/photos/?${params}`;
      console.log('getPhotos 호출:', { keywordId, userId, url });

      const response = await fetchWithTimeout(url);
      handleApiError(response, '사진 조회 실패');
      
      const photos = await response.json();
      console.log('getPhotos 결과:', photos);
      return photos;
    } catch (error) {
      console.error('getPhotos error:', error);
      throw error;
    }
  }

  async likePhoto(photoId: number, userId: number): Promise<void> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/photos/${photoId}/like?user_id=${userId}`, {
        method: 'POST',
      });
      handleApiError(response, '좋아요 실패');
    } catch (error) {
      console.error('likePhoto error:', error);
      throw error;
    }
  }

  async unlikePhoto(photoId: number, userId: number): Promise<void> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/photos/${photoId}/like?user_id=${userId}`, {
        method: 'DELETE',
      });
      handleApiError(response, '좋아요 취소 실패');
    } catch (error) {
      console.error('unlikePhoto error:', error);
      throw error;
    }
  }

  async deletePhoto(photoId: number): Promise<void> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/photos/${photoId}`, {
        method: 'DELETE',
      });
      handleApiError(response, '사진 삭제 실패');
    } catch (error) {
      console.error('deletePhoto error:', error);
      throw error;
    }
  }

  // 검색 API
  async searchPhotos(query: string, sortBy = 'latest', limit = 20, offset = 0): Promise<Photo[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('sort_by', sortBy);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetchWithTimeout(`${API_BASE_URL}/search/photos?${params}`);
      handleApiError(response, '검색 실패');
      return response.json();
    } catch (error) {
      console.error('searchPhotos error:', error);
      throw error;
    }
  }

  async searchKeywords(query: string): Promise<Keyword[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/search/keywords?q=${encodeURIComponent(query)}`);
      handleApiError(response, '키워드 검색 실패');
      return response.json();
    } catch (error) {
      console.error('searchKeywords error:', error);
      throw error;
    }
  }

  // 유저 관련 API
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/`);
      handleApiError(response, '유저 조회 실패');
      return response.json();
    } catch (error) {
      console.error('getUsers error:', error);
      throw error;
    }
  }

  async getUserPoints(userId: number): Promise<number> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/${userId}/points`);
      handleApiError(response, '사용자 포인트 조회 실패');
      const data = await response.json();
      return data.points;
    } catch (error) {
      console.error('getUserPoints error:', error);
      throw error;
    }
  }

  async createContest(contestData: ContestCreate, userId: number): Promise<Contest> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/contests/?user_id=${userId}`, {
        method: 'POST',
        body: JSON.stringify(contestData),
      });
      handleApiError(response, '공모 생성 실패');
      return response.json();
    } catch (error) {
      console.error('createContest error:', error);
      throw error;
    }
  }

  // 연결 상태 확인
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
