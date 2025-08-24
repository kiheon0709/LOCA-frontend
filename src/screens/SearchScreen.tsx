import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Photo } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    // 검색 모드가 아닐 때만 모든 사진 로드
    if (!isSearchMode) {
      loadPhotos();
    }
  }, [sortBy, isSearchMode]);

  // 검색어 변경 감지
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        // 검색어가 비어있으면 전체 사진 로드
        setIsSearchMode(false);
        loadPhotos();
      } else if (searchQuery.trim().length > 0) {
        // 검색어가 있으면 검색 실행
        handleSearch();
      }
    }, 500); // 0.5초 지연

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      console.log('SearchScreen: 사진 로딩 시작');
      
      // 모든 사진을 가져오기 위해 keywordId와 userId를 전달하지 않음
      const photosData = await apiService.getPhotos(undefined, undefined, 50, 0);
      console.log('SearchScreen: 사진 로딩 완료', photosData.length);
      
      // 정렬 적용
      let sortedPhotos = [...photosData];
      if (sortBy === 'likes') {
        sortedPhotos.sort((a, b) => b.like_count - a.like_count);
      } else {
        // latest는 서버에서 이미 정렬되어 옴
        sortedPhotos.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      }
      
      setPhotos(sortedPhotos);
    } catch (error) {
      console.error('SearchScreen: 사진 로딩 실패', error);
      Alert.alert('오류', '사진을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      setIsSearchMode(true);
      console.log('SearchScreen: 검색 시작', searchQuery);
      
      const searchResults = await apiService.searchPhotos(searchQuery, sortBy, 50, 0);
      console.log('SearchScreen: 검색 완료', searchResults.length);
      
      setPhotos(searchResults);
    } catch (error) {
      console.error('SearchScreen: 검색 실패', error);
      Alert.alert('오류', '검색에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedPhoto(null);
  };

  const handleLike = async (photoId: number) => {
    try {
      // 실제 좋아요 API 호출 (임시로 사용자 ID 1 사용)
      await apiService.likePhoto(photoId, 1);
      
      // 로컬 상태 업데이트
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, like_count: photo.like_count + 1 }
          : photo
      ));
      
      // 선택된 사진도 업데이트
      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null);
      }
    } catch (error) {
      console.error('SearchScreen: 좋아요 실패', error);
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
    }
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity 
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.image_path }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>아카이브</Text>
        <Text style={styles.subtitle}>발견된 모든 숨은 명소들을 확인하세요</Text>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="검색어를 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 정렬 버튼 */}
      <View style={styles.sortContainer}>
        <View style={styles.photoCountContainer}>
          <Text style={styles.photoCountText}>
            총 {photos.length}개의 사진
          </Text>
        </View>
        <View style={styles.sortButtonsContainer}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'latest' && styles.sortButtonActive]}
            onPress={() => {
              setSortBy('latest');
              // 검색 모드일 때는 현재 검색 결과를 다시 정렬
              if (isSearchMode && searchQuery.trim()) {
                handleSearch();
              }
            }}
          >
            <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.sortButtonTextActive]}>
              최신순
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'likes' && styles.sortButtonActive]}
            onPress={() => {
              setSortBy('likes');
              // 검색 모드일 때는 현재 검색 결과를 다시 정렬
              if (isSearchMode && searchQuery.trim()) {
                handleSearch();
              }
            }}
          >
            <Text style={[styles.sortButtonText, sortBy === 'likes' && styles.sortButtonTextActive]}>
              인기순
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 사진 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666" />
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? '검색 결과가 없습니다.' : '아직 업로드된 사진이 없습니다.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
          onRefresh={loadPhotos}
          refreshing={isLoading}
        />
      )}

      {/* 사진 상세 팝업 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={handleCloseModal}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              {selectedPhoto && (
                <>
                  <View style={styles.modalImageContainer}>
                    <Image 
                      source={{ uri: selectedPhoto.image_path }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLocation}>
                        {selectedPhoto.location || '위치 정보 없음'}
                      </Text>
                      <TouchableOpacity 
                        style={styles.modalLikeButton}
                        onPress={() => handleLike(selectedPhoto.id)}
                      >
                        <Ionicons name="heart" size={20} color="#FF6B6B" />
                        <Text style={styles.modalLikeCount}>{selectedPhoto.like_count}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalUser}>
                        {selectedPhoto.user_nickname || '알 수 없는 사용자'}
                      </Text>
                      <Text style={styles.modalDate}>
                        {formatDate(selectedPhoto.uploaded_at)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCountContainer: {
    flex: 1,
  },
  photoCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonsContainer: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginLeft: 10,
  },
  sortButtonActive: {
    backgroundColor: '#000',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  photoItem: {
    width: (width - 40) / 2, // 전체 화면에서 좌우 여백 20씩만 뺌
    aspectRatio: 1,
    margin: 5, // 사진 간 여백을 5로 줄임
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 15, // 팝업창 안쪽 여백 추가
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageContainer: {
    width: '100%',
    flex: 1, // 고정 높이 대신 flex로 유동적 크기
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // contain에서 cover로 변경하여 여백 최소화
  },
  modalInfo: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  modalLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalLikeCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  modalUser: {
    fontSize: 14,
    color: '#666',
  },
  modalDate: {
    fontSize: 12,
    color: '#999',
  },
  photoGrid: {
    paddingHorizontal: 10, // 좌우 여백 20씩
  },
});
