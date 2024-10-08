import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {activities} from '../../utils/activity';
import {showToast} from '../../utils/toast';
import apiClient from '../../utils/api';
import {ApiResponse} from '../../utils/types';

const {width, height} = Dimensions.get('window');

interface Photo {
  id: string;
  imageUrl: string;
  activity: string;
  createdAt: string;
}

const ProfilePost: React.FC<{
  route: {params: {photos: Photo[]; index: number}};
}> = ({route}) => {
  const {photos: initialPhotos, index: initialIndex} = route.params;
  const [photos, setPhotos] = useState(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList<Photo>>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flatListRef.current?.scrollToIndex({index: initialIndex, animated: false});
    fadeIn();
  }, []);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setIsLoading(true);
            const response: ApiResponse<any> = await apiClient.post(
              '/deletePosts',
              {
                id: postId,
              },
            );

            if (response.data.status) {
              showToast('success', response.data.message);

              const newPhotos = photos.filter(photo => photo.id !== postId);

              if (newPhotos.length === 0) {
                navigation.goBack();
              } else {
                setPhotos(newPhotos);
                setCurrentIndex(prevIndex =>
                  prevIndex >= newPhotos.length
                    ? newPhotos.length - 1
                    : prevIndex,
                );
              }
            }
          } catch (error: any) {
            showToast(
              'error',
              error.response?.data?.message ||
                'An error occurred while deleting the post.',
            );
          } finally {
            setIsLoading(false);
            setShowDeleteOption(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderItem = ({item}: {item: Photo}) => {
    const activity = item.activity;
    const relatedImage = activities[activity]?.url;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{uri: item.imageUrl}}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradientOverlay}
        />
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {moment(item.createdAt).format('DD')}
            </Text>
            <Text style={styles.monthText}>
              {moment(item.createdAt).format('MMM')}
            </Text>
          </View>
          <LinearGradient
            colors={['#8b5cf6', '#2196f3']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.activityContainer}>
            {relatedImage && (
              <Image
                source={relatedImage}
                style={styles.relatedActivityImage}
              />
            )}
            <Text style={styles.activityText}>{activity}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            style={styles.interactionOverlay}>
            <View style={styles.interactionBar}>
              <View style={styles.interactionButtonContainer}>
                <TouchableOpacity style={styles.interactionButton}>
                  <Icon name="flame-outline" size={24} color="#FF6B6B" />
                  <Text style={styles.interactionText}>5</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.interactionButtonContainer}>
                <TouchableOpacity style={styles.interactionButton}>
                  <Icon
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color="#8b5cf6"
                  />
                  <Text style={styles.interactionText}>0</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.interactionButtonContainer}>
                <TouchableOpacity style={styles.interactionButton}>
                  <Icon name="paper-plane-outline" size={24} color="#FFD93D" />
                </TouchableOpacity>
              </View>

              <View style={styles.interactionButtonContainer}>
                {showDeleteOption ? (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePost(item.id)}
                    disabled={isLoading}>
                    <Icon name="trash-outline" size={24} color="#FF6B6B" />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.interactionButton}
                    onPress={() => setShowDeleteOption(true)}>
                    <Icon
                      name="ellipsis-vertical-outline"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  };

  const getItemLayout = (_: any, index: number) => ({
    length: height,
    offset: height * index,
    index,
  });

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      setShowDeleteOption(false);
      fadeIn();
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        vertical
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  imageContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  dateContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  dateText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  monthText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  activityContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relatedActivityImage: {
    width: 24,
    height: 24,
    marginRight: 5,
  },

  activityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  interactionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  interactionButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  deleteText: {
    color: '#FF6B6B',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  interactionText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 12,
  },
});

export default ProfilePost;
