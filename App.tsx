import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import TabNavigator from './src/navigation/TabNavigator';
import UserSelectionScreen from './src/screens/UserSelectionScreen';
import { User } from './src/services/api';

export default function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loaded] = useFonts({
    'BookkGothic-Light': require('./assets/fonts/bookkgothic/BookkGothic_Light.ttf'),
    'BookkGothic-Bold': require('./assets/fonts/bookkgothic/BookkGothic_Bold.ttf'),
    'BookkMyungjo-Bold': require('./assets/fonts/bookkmyungjo/BookkMyungjo_Bold.ttf'),
    'BookkMyungjo-Light': require('./assets/fonts/bookkmyungjo/BookkMyungjo_Light.ttf'),
  });

  if (!loaded) {
    return null; // 폰트 로딩 중에는 아무것도 표시하지 않음
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  // 유저가 선택되지 않았으면 유저 선택 화면 표시
  if (!selectedUser) {
    return (
      <SafeAreaProvider>
        <UserSelectionScreen onUserSelect={handleUserSelect} />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  // 유저가 선택되었으면 메인 앱 표시
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator selectedUser={selectedUser} />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
