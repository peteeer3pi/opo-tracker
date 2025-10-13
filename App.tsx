import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  MD3LightTheme,
  PaperProvider,
  Text,
  ActivityIndicator,
  Divider,
  Card,
  IconButton,
} from "react-native-paper";
import { View, ScrollView } from "react-native";
import TableScreen from "./src/screens/TableScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import TopicDetailScreen from "./src/screens/TopicDetailScreen";
import { useStore } from "./src/store/useStore";
import { TOPIC_TITLES } from "./src/data/titles";
import FolderScreen from "./src/screens/FolderScreen";

type RootStackParamList = {
  Dashboard: undefined;
  Categorías: { folderId?: string } | undefined;
  Tema: { topicId: string };
  Carpeta: { folderId?: string };
  "Selecciona oposición": undefined;
};
export type { RootStackParamList };
const Stack = createNativeStackNavigator<RootStackParamList>();

function OppositionSelectScreen({ navigation }: any) {
  const setOpposition = useStore((s) => s.setOpposition);
  const options = Object.keys(TOPIC_TITLES);
  const handleSelect = (name: string) => {
    setOpposition(name);
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text variant="headlineSmall" style={{ fontWeight: "700" }}>
            Elige tu oposición
          </Text>
          <Text variant="bodyMedium" style={{ color: "#555", marginTop: 6 }}>
            Podrás cambiarla más adelante reiniciando los datos.
          </Text>
        </View>
        <Divider style={{ marginBottom: 12 }} />
        <View style={{ gap: 10 }}>
          {options.map((name) => (
            <Card
              key={name}
              mode="elevated"
              onPress={() => handleSelect(name)}
              style={{ borderRadius: 12 }}
            >
              <Card.Content>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <IconButton
                    icon="school-outline"
                    size={22}
                    disabled
                    style={{ margin: 0, padding: 0 }}
                  />
                  <Text
                    variant="titleMedium"
                    style={{ flex: 1, flexWrap: "wrap" }}
                  >
                    {name}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563eb",
    secondary: "#16a34a",
  },
};

export default function App() {
  const hasHydrated = useStore((s) => s.hasHydrated);
  const selectedOpposition = useStore((s) => s.selectedOpposition);

  if (!hasHydrated) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <SafeAreaView
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator animating size="large" />
            <Text style={{ marginTop: 12 }}>Cargando…</Text>
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  const initialRouteName: keyof RootStackParamList = selectedOpposition
    ? "Dashboard"
    : "Selecciona oposición";

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <Stack.Navigator
              key={initialRouteName}
              initialRouteName={initialRouteName}
              screenOptions={{
                headerTitleStyle: { fontWeight: "700" },
                headerTintColor: "#111",
              }}
            >
              <Stack.Screen
                name="Selecciona oposición"
                component={OppositionSelectScreen}
              />
              <Stack.Screen name="Dashboard" component={TableScreen} />
              <Stack.Screen name="Categorías" component={CategoriesScreen} />
              <Stack.Screen name="Tema" component={TopicDetailScreen} />
              <Stack.Screen name="Carpeta" component={FolderScreen} />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
