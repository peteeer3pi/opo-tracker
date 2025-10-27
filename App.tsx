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
import BulletinDetailScreen from "./src/screens/BulletinDetailScreen";
import PlannerScreen from "./src/screens/PlannerScreen";
import { useStore } from "./src/store/useStore";
import { TOPIC_TITLES } from "./src/data/titles";
import FolderScreen from "./src/screens/FolderScreen";
import CustomOppositionScreen from "./src/screens/CustomOppositionScreen";
import NotificationToast from "./src/components/NotificationToast";
import { useNotificationStore } from "./src/store/useNotificationStore";
import "./src/i18n";
import { useTranslation } from "react-i18next";

type RootStackParamList = {
  Dashboard: undefined;
  Categorías: { folderId?: string } | undefined;
  Tema: { topicId: string };
  Boletín: { bulletinId: string };
  Carpeta: { folderId?: string };
  Planificador: undefined;
  "Selecciona oposición": undefined;
  "Oposición personalizada": undefined;
};
export type { RootStackParamList };
const Stack = createNativeStackNavigator<RootStackParamList>();

function OppositionSelectScreen({ navigation }: any) {
  const { t } = useTranslation();
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
            {t('opposition.select')}
          </Text>
          <Text variant="bodyMedium" style={{ color: "#555", marginTop: 6 }}>
            {t('opposition.subtitle')}
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

        <Divider style={{ marginVertical: 20 }} />

        <Card
          mode="outlined"
          onPress={() => navigation.navigate("Oposición personalizada")}
          style={{ borderRadius: 12, borderColor: "#2563eb", borderWidth: 2 }}
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
                icon="plus-circle-outline"
                size={22}
                iconColor="#2563eb"
                disabled
                style={{ margin: 0, padding: 0 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleMedium"
                  style={{ color: "#2563eb", fontWeight: "600" }}
                >
                  {t('opposition.custom')}
                </Text>
                <Text variant="bodySmall" style={{ color: "#666", marginTop: 4 }}>
                  {t('opposition.customSubtitle')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
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
  const notificationMessage = useNotificationStore((s) => s.message);
  const notificationVisible = useNotificationStore((s) => s.visible);
  const hideNotification = useNotificationStore((s) => s.hideNotification);

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
              <Stack.Screen
                name="Oposición personalizada"
                component={CustomOppositionScreen}
              />
              <Stack.Screen name="Dashboard" component={TableScreen} />
              <Stack.Screen name="Categorías" component={CategoriesScreen} />
              <Stack.Screen name="Tema" component={TopicDetailScreen} />
              <Stack.Screen name="Boletín" component={BulletinDetailScreen} />
              <Stack.Screen name="Carpeta" component={FolderScreen} />
              <Stack.Screen name="Planificador" component={PlannerScreen} />
            </Stack.Navigator>
          </SafeAreaView>
          <NotificationToast
            message={notificationMessage}
            visible={notificationVisible}
            onDismiss={hideNotification}
          />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
