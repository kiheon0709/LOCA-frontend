import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, User, Photo, getImageUrl } from '../services/api';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  selectedUser?: User;
  onLogout?: () => void;
}

export default function ProfileScreen({ selectedUser, onLogout }: ProfileScreenProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      loadUserPhotos();
    }
  }, [selectedUser]);

  const loadUserPhotos = async () => {
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      const userPhotos = await apiService.getPhotos(undefined, selectedUser.id);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('사용자 사진 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }: { item: Photo }) => {
    const imageUrl = getImageUrl(item.image_path);

    return (
      <View style={styles.photoItem}>
        <Image 
          source={{ uri: imageUrl }}
          style={styles.photoImage}
          resizeMode="cover"
        />
        <View style={styles.photoInfo}>
          <Text style={styles.photoLocation} numberOfLines={1}>
            {item.location || '위치 정보 없음'}
          </Text>
          <View style={styles.photoStats}>
            <Ionicons name="heart" size={12} color="#FF6B6B" />
            <Text style={styles.likeCount}>{item.like_count}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>마이페이지</Text>
        <Text style={styles.subtitle}>내 정보와 업로드한 사진들을 확인하세요</Text>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.userInfoContainer}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={40} color="#666" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{selectedUser?.nickname || '사용자'}</Text>
          <Text style={styles.userPoints}>포인트: {selectedUser?.points || 0}점</Text>
        </View>
      </View>

      {/* 로그아웃 버튼 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      {/* 사진 섹션 제목 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>내가 업로드한 사진들</Text>
        <Text style={styles.photoCount}>{photos.length}장</Text>
      </View>

      {/* 사진 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666" />
        </View>
      ) : photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>아직 업로드한 사진이 없어요</Text>
          <Text style={styles.emptySubtext}>첫 번째 사진을 업로드해보세요!</Text>
        </View>
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userPoints: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
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
  photoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
