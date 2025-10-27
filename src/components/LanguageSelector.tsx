import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Portal, Dialog, RadioButton, Text, Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { changeLanguage, getCurrentLanguage } from "../i18n";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default function LanguageSelector({ visible, onDismiss }: Props) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());

  const languages = [
    { code: "es", name: t("language.spanish") },
    { code: "gl", name: t("language.galician") },
  ];

  const handleSave = async () => {
    await changeLanguage(selectedLanguage);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{t("language.title")}</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group
            onValueChange={setSelectedLanguage}
            value={selectedLanguage}
          >
            {languages.map((lang) => (
              <View key={lang.code} style={styles.radioItem}>
                <RadioButton.Item
                  label={lang.name}
                  value={lang.code}
                  labelStyle={styles.radioLabel}
                />
              </View>
            ))}
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t("common.cancel")}</Button>
          <Button onPress={handleSave}>{t("common.save")}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  radioItem: {
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
  },
});
