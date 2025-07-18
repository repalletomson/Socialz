import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Fonts } from '../constants/Fonts';

export default function CustomAlert({ visible, title, message, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: '#111',
          borderRadius: 18,
          padding: 28,
          minWidth: 260,
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: Fonts.GeneralSans.Bold,
            fontSize: 20,
            color: '#fff',
            marginBottom: 12,
          }}>
            {title}
          </Text>
          <Text style={{
            fontFamily: Fonts.GeneralSans.Regular,
            fontSize: 16,
            color: '#A1A1AA',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            {message}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#8B5CF6',
              borderRadius: 12,
              paddingHorizontal: 28,
              paddingVertical: 10,
            }}
          >
            <Text style={{
              fontFamily: Fonts.GeneralSans.Semibold,
              color: '#fff',
              fontSize: 16,
            }}>
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 