import { Stack } from 'expo-router';

export default function ServiceDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
    </Stack>
  );
}
