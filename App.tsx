import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import TableScreen from "./src/screens/TableScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import TopicDetailScreen from "./src/screens/TopicDetailScreen";

type RootStackParamList = {
  Dashboard: undefined;
  Categorías: undefined;
  Tema: { topicId: string };
};
export type { RootStackParamList };
const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563eb",
    secondary: "#16a34a",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <Stack.Navigator
              screenOptions={{
                headerTitleStyle: { fontWeight: "700" },
                headerTintColor: "#111",
              }}
            >
              <Stack.Screen name="Dashboard" component={TableScreen} />
              <Stack.Screen name="Categorías" component={CategoriesScreen} />
              <Stack.Screen name="Tema" component={TopicDetailScreen} />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
