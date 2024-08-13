import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { ref as dbRef, onValue, push, remove, set } from 'firebase/database';
import { auth, database } from '../config/firebaseconfig';
import Ionicons from '@expo/vector-icons/Ionicons';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const postsRef = dbRef(database, 'posts');
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val() ? Object.entries(snapshot.val()) : [];
      setPosts(data.reverse()); // Reverse to show the latest posts first
    });
  }, []);

  const handleLikePost = async (postId, currentLikes = {}) => {
    const userId = auth.currentUser.uid;
    const postRef = dbRef(database, `posts/${postId}/likes/${userId}`);
    
    if (currentLikes[userId]) {
      // User has already liked, remove the like
      await remove(postRef);
    } else {
      // Add the like
      await set(postRef, true);
    }
  };

  const handleAddComment = async (postId) => {
    if (comment.trim()) {
      const commentsRef = push(dbRef(database, `posts/${postId}/comments`));
      await set(commentsRef, {
        userId: auth.currentUser.uid,
        username: auth.currentUser.email.split('@')[0],
        comment: comment.trim(),
        timestamp: Date.now(),
      });
      setComment('');
    } else {
      alert("Comment cannot be empty");
    }
  };

  const handleDeletePost = async (postId, postOwnerId) => {
    if (postOwnerId === auth.currentUser.uid) {
      const postRef = dbRef(database, `posts/${postId}`);
      await remove(postRef);
    } else {
      alert("You can only delete your own posts");
    }
  };

  const renderPost = ({ item }) => {
    const postId = item[0];
    const post = item[1];

    return (
      <View style={styles.postContainer}>
        <Image 
          source={{ uri: post.profileImageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.userImage} 
        />
        <View style={styles.postContent}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.time}>{new Date(post.timestamp).toLocaleString()}</Text>
          <Text style={styles.location}>Checked in at: {post.barName}</Text>
          <Text style={styles.note}>{post.note}</Text>
          
          <View style={styles.interactionRow}>
            <TouchableOpacity onPress={() => handleLikePost(postId, post.likes)} style={styles.likeButton}>
              <Ionicons 
                name={post.likes && post.likes[auth.currentUser.uid] ? 'heart' : 'heart-outline'} 
                size={24} 
                color="red" 
              />
              <Text style={styles.likeCount}>{post.likes ? Object.keys(post.likes).length : 0}</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity onPress={() => handleAddComment(postId)} style={styles.commentButton}>
              <Ionicons name="send" size={20} color="blue" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={post.comments ? Object.entries(post.comments) : []}
            keyExtractor={(comment) => comment[0]}
            renderItem={({ item }) => (
              <View style={styles.commentContainer}>
                <Text style={styles.commentText}><Text style={styles.commentUser}>{item[1].username}:</Text> {item[1].comment}</Text>
              </View>
            )}
          />
          
          {post.userId === auth.currentUser.uid && (
            <TouchableOpacity onPress={() => handleDeletePost(postId, post.userId)} style={styles.deleteButton}>
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  postContainer: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  postContent: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  note: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  likeCount: {
    marginLeft: 5,
    fontSize: 14,
  },
  commentInput: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    fontSize: 14,
  },
  commentButton: {
    marginLeft: 10,
  },
  commentContainer: {
    marginTop: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentUser: {
    fontWeight: 'bold',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
});

export default Feed;
