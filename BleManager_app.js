import React, {useState, useEffect} from 'react';
import {View, Button, Text, PermissionsAndroid, Platform, Alert} from 'react-native';
import {BleManager} from 'react-native-ble-plx';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const bleManager = new BleManager();

  // Запрос разрешений
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Поиск устройств
  const scanDevices = async () => {
    if (!(await requestPermissions())) return;

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        Alert.alert('Ошибка', error.message);
        return;
      }
      if (device.name?.includes('RPi')) {
        setDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
      }
    });

    setTimeout(() => bleManager.stopDeviceScan(), 5000);
  };

  // Подключение к устройству
  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      setConnectedDevice(connected);
      Alert.alert('Успех', `Подключено к ${device.name}`);
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    }
  };

  // Отправка команды
  const sendCommand = async (command) => {
    if (!connectedDevice) return;

    try {
      await connectedDevice.writeCharacteristicWithoutResponse(
        '94f39d29-7d6d-437d-973b-fba39e49d4ee', // Service UUID
        '00001101-0000-1000-8000-00805f9b34fb', // Characteristic UUID
        JSON.stringify({action: command})
      );
      Alert.alert('Успех', 'Команда отправлена');
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    }
  };

  return (
    <View style={{padding: 20}}>
      <Button title="Поиск устройств" onPress={scanDevices} />

      {devices.map(device => (
        <Button
          key={device.id}
          title={device.name || 'Unknown Device'}
          onPress={() => connectToDevice(device)}
        />
      ))}

      {connectedDevice && (
        <>
          <Text style={{marginVertical: 20}}>
            Подключено: {connectedDevice.name}
          </Text>
          <Button
            title="Перезагрузить Raspberry Pi"
            onPress={() => sendCommand('reboot')}
          />
        </>
      )}
    </View>
  );
};

export default App;
