import { Stack } from 'expo-router';

export default function BranchDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="working-hours" />
    </Stack>
  );
}
