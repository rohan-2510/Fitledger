import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

interface ProfileImageDisplayProps {
  onPress?: () => void;
  size?: number;
  borderColor?: string;
  profileImageUrl?: string; // Add this line
}

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({
  onPress,
  size = 40,
  borderColor = Colors.primary,
  profileImageUrl, // Destructure profileImageUrl here
}) => {
  const { user } = useAuth();

  const imageSource = profileImageUrl
    ? { uri: profileImageUrl }
    : user?.profile_image_url
    ? { uri: user.profile_image_url }
    : require('../assets/images/default-profile.png');

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.profileImageContainer,
        { width: size, height: size, borderRadius: size / 2, borderColor: borderColor }
      ]}
    >
      <Image
        source={imageSource}
        style={styles.profileImage}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileImageContainer: {
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});
