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
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Photo {
  id: number;
  image_path: string;
  location?: string;
  like_count: number;
}

export default function SearchScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');

  // 더미 사진 데이터
  const dummyPhotos: Photo[] = [
    {
      id: 1,
      image_path: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Photo+1',
      location: '대전 유성구 궁동',
      like_count: 12
    },
    {
      id: 2,
      image_path: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Photo+2',
      location: '충남대학교',
      like_count: 8
    },
    {
      id: 3,
      image_path: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Photo+3',
      location: 'KAIST',
      like_count: 15
    },
    {
      id: 4,
      image_path: 'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=Photo+4',
      location: '대덕연구단지',
      like_count: 6
    }
  ];

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = () => {
    setPhotos(dummyPhotos);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      loadPhotos();
      return;
    }

    // 더미 검색 로직
    const filteredPhotos = dummyPhotos.filter(photo => 
      photo.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setPhotos(filteredPhotos);
  };

  const handleLike = (photoId: number) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, like_count: photo.like_count + 1 }
        : photo
    ));
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <View style={styles.photoItem}>
      <Image 
        source={{ uri: item.image_path }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      <View style={styles.photoInfo}>
        <Text style={styles.photoLocation} numberOfLines={1}>
          {item.location || '위치 정보 없음'}
        </Text>
        <View style={styles.photoActions}>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons name="heart" size={16} color="#FF6B6B" />
            <Text style={styles.likeCount}>{item.like_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
          placeholder="키워드로 검색..."
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
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'latest' && styles.sortButtonActive]}
          onPress={() => setSortBy('latest')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.sortButtonTextActive]}>
            최신순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'likes' && styles.sortButtonActive]}
          onPress={() => setSortBy('likes')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'likes' && styles.sortButtonTextActive]}>
            좋아요순
          </Text>
        </TouchableOpacity>
      </View>

      {/* 사진 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666" />
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
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
  photoGrid: {
    paddingHorizontal: 10,
  },
  photoItem: {
    flex: 1,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  photoImage: {
    width: '100%',
    height: (width - 30) / 2,
  },
  photoInfo: {
    padding: 12,
  },
  photoLocation: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
