import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { IconButton } from "react-native-paper";

type NotificationToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
};

export default function NotificationToast({
  message,
  visible,
  onDismiss,
  duration = 4000,
}: NotificationToastProps) {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable style={styles.toast} onPress={handleDismiss}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎉</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
        <IconButton
          icon="close"
          size={20}
          onPress={handleDismiss}
          style={styles.closeButton}
          iconColor="#fff"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 12,
    padding: 16,
    paddingRight: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 20,
  },
  closeButton: {
    margin: 0,
  },
});
