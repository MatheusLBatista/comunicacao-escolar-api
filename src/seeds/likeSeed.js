import Like from '../models/Like.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

export default async function likeSeed() {
  await Like.deleteMany({});

  const posts = await Post.find({ active: true }).select('_id').lean();
  const users = await User.find({ active: true }).select('_id').lean();

  if (posts.length === 0 || users.length === 0) {
    console.log(
      'Seed de likes ignorada: nenhum post ou usuário ativo encontrado.',
    );
    return { insertedCount: 0 };
  }

  const likes = [];

  posts.forEach((post) => {
    const likesPerPost = Math.floor(Math.random() * users.length) + 1;
    const selectedUsers = new Set();

    for (let i = 0; i < likesPerPost && selectedUsers.size < users.length; i++) {
      const randomUserIndex = Math.floor(Math.random() * users.length);
      const userId = users[randomUserIndex]._id;

      if (!selectedUsers.has(userId.toString())) {
        selectedUsers.add(userId.toString());
        likes.push({
          post_id: post._id,
          user_id: userId,
        });
      }
    }
  });

  if (likes.length === 0) {
    console.log('Seed de likes ignorada: nenhum like foi criado.');
    return { insertedCount: 0 };
  }

  const result = await Like.collection.insertMany(likes);
  console.log(`Seeded ${result.insertedCount} likes.`);

  return result;
}
