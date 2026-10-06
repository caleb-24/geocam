import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        headerShown: true,
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#10b981',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
      }}
    >
      <Tabs.Screen
        name="geocam"
        options={{
          title: 'GeoCam',
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fotos"
        options={{
          title: 'Fotos',
          tabBarIcon: ({ color }) => <Ionicons name="images" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
