import '../global.css';
import { Text, View } from 'react-native';
import { multiply } from 'yes';

const result = multiply(3, 7);

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-600">
        Result: {result}
      </Text>
      <Text className="mt-4 text-gray-500">NativeWind is working!</Text>
    </View>
  );
}
