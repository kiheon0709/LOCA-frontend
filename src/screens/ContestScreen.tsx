import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'all' | 'my' | 'applied';

export default function ContestScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const tabs = [
    { id: 'all', title: '전체 공모' },
    { id: 'my', title: '내 공모' },
    { id: 'applied', title: '지원한 공모' }
  ];

  const handleCreateContest = () => {
    setIsCreateModalVisible(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalVisible(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>전체 공모 목록</Text>
          </View>
        );
      case 'my':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>내가 올린 공모</Text>
          </View>
        );
      case 'applied':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>지원한 공모</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id as TabType)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
            {activeTab === tab.id && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      {renderTabContent()}

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleCreateContest}
        activeOpacity={0.3}
      >
        <Ionicons name="add" size={24} color="#000000" />
        <Text style={styles.floatingButtonText}>공모 올리기</Text>
      </TouchableOpacity>

      {/* 공모 생성 모달 */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseCreateModal}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>공모 올리기</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 콘텐츠 */}
          <View style={styles.modalContent}>
            <Text style={styles.modalContentText}>공모 생성 화면입니다.</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'BookkMyungjo-Bold',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
    fontFamily: 'BookkMyungjo-Bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'BookkMyungjo-Bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  floatingButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'BookkMyungjo-Bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 1,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'BookkMyungjo-Bold',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'BookkMyungjo-Bold',
  },
});
