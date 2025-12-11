import { Image } from 'expo-image';
import { View, ViewStyle } from 'react-native';
import tw from 'twrnc';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export function Logo({ size = 128, style }: LogoProps) {
  return (
    <View style={[tw`items-center justify-center`, style]}>
      <Image
        source={require('@/assets/images/favicon.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}

