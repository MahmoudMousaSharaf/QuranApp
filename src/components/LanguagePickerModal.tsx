import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES, AppLanguage } from '../i18n/translations';

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
}

const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const c = colors[theme];
  const { appLanguage, setAppLanguage } = useLanguage();

  const handleSelect = (lang: AppLanguage) => {
    setAppLanguage(lang);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: c.surface }]}>
          <View style={[styles.modalHeader, { backgroundColor: c.headerBg }]}>
            <Text style={styles.modalTitle}>🌐 Select Language</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.langItem,
                  {
                    backgroundColor:
                      appLanguage === item.code ? c.ayahBg : c.surface,
                    borderColor: appLanguage === item.code ? c.primary : c.border,
                  },
                ]}
                onPress={() => handleSelect(item.code)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langNativeName, { color: c.text }]}>
                    {item.nativeName}
                  </Text>
                  <Text style={[styles.langEnglishName, { color: c.textSecondary }]}>
                    {item.name}
                  </Text>
                </View>
                {appLanguage === item.code && (
                  <Ionicons name="checkmark-circle" size={24} color={c.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 12,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  flag: {
    fontSize: 28,
    marginRight: 14,
  },
  langInfo: {
    flex: 1,
  },
  langNativeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  langEnglishName: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default LanguagePickerModal;
