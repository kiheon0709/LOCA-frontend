import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  const [loaded] = useFonts({
    'BookkGothic-Light': require('./assets/fonts/bookkgothic/BookkGothic_Light.ttf'),
    'BookkGothic-Bold': require('./assets/fonts/bookkgothic/BookkGothic_Bold.ttf'),
    'BookkMyungjo-Bold': require('./assets/fonts/bookkmyungjo/BookkMyungjo_Bold.ttf'),
    'BookkMyungjo-Light': require('./assets/fonts/bookkmyungjo/BookkMyungjo_Light.ttf'),
  });

  if (!loaded) {
    return null; // 폰트 로딩 중에는 아무것도 표시하지 않음
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
