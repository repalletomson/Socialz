import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SelectionModal({
  visible,
  onClose,
  options = [],
  onSelect,
  title = '',
  placeholder = 'Search...',
  notListedLabel = 'My option is not listed',
  allowManualEntry = true,
  manualEntryLabel = 'Enter manually',
}) {
  const [search, setSearch] = useState('');
  const [manualEntry, setManualEntry] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options.slice(0, 10);
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  const handleSelect = (value) => {
    setSearch('');
    setManualEntry('');
    setShowManualInput(false);
    onSelect(value);
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      handleSelect(manualEntry.trim());
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ flex: 1, color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {!showManualInput && (
            <TextInput
              placeholder={placeholder}
              placeholderTextColor="#A1A1AA"
              value={search}
              onChangeText={setSearch}
              style={{ backgroundColor: '#222', color: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 }}
            />
          )}
          {!showManualInput ? (
            <>
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelect(item)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListFooterComponent={allowManualEntry && (
                  <TouchableOpacity onPress={() => setShowManualInput(true)} style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: 16 }}>{notListedLabel}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>{manualEntryLabel}</Text>
              <TextInput
                placeholder="Type here..."
                placeholderTextColor="#A1A1AA"
                value={manualEntry}
                onChangeText={setManualEntry}
                style={{ backgroundColor: '#222', color: '#fff', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 }}
                autoFocus
              />
              <TouchableOpacity onPress={handleManualSubmit} style={{ backgroundColor: '#8B5CF6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Select</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
} 