import { Stack } from 'expo-router';

export default function StaffDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
    </Stack>
  );
}
